import { ObjectId } from "mongodb";
import type { CheckoutBuyerDraft } from "@/lib/checkout-buyer";
import { getDb } from "@/lib/mongodb";
import type { CheckoutAddress } from "@/lib/shipping-core";

export interface CheckoutIdentityDraft {
	_id?: ObjectId;
	orderId: string;
	userId?: string | null;
	buyer?: CheckoutBuyerDraft | null;
	deliveryAddress?: CheckoutAddress | null;
}

function escapeRegex(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function documentRegex(document: string) {
	return `^${document.split("").map(escapeRegex).join("\\D*")}$`;
}

function toUserAddress(address?: CheckoutAddress | null) {
	if (!address) return undefined;
	return {
		line1: address.line1 || undefined,
		line2: address.line2 || undefined,
		number: address.number || undefined,
		complement: address.complement || undefined,
		district: address.district || undefined,
		city: address.city || undefined,
		state: address.state || undefined,
		postalCode: address.postalCode || undefined,
		country: address.country || undefined,
	};
}

async function findUserByEmail(email: string) {
	const db = await getDb();
	return db.collection("users").findOne<{
		_id: ObjectId;
		email: string;
		name?: string;
		cpf?: string;
		cpfNormalized?: string;
		phone?: string;
		address?: CheckoutAddress;
	}>(
		{
			email: {
				$regex: `^${escapeRegex(email)}$`,
				$options: "i",
			},
		},
		{
			projection: {
				email: 1,
				name: 1,
				cpf: 1,
				cpfNormalized: 1,
				phone: 1,
				address: 1,
			},
		},
	);
}

async function findUserByDocument(document: string) {
	const db = await getDb();
	return db.collection("users").findOne<{
		_id: ObjectId;
		email: string;
		name?: string;
		cpf?: string;
		cpfNormalized?: string;
		phone?: string;
		address?: CheckoutAddress;
	}>(
		{ $or: [{ cpfNormalized: document }, { cpf: { $regex: documentRegex(document) } }] },
		{ projection: { email: 1, name: 1, cpf: 1, cpfNormalized: 1, phone: 1, address: 1 } },
	);
}

export async function resolveCheckoutUserForDraft(draft: CheckoutIdentityDraft) {
	const buyer = draft.buyer;
	if (!buyer?.email) {
		throw new Error("Missing checkout buyer email");
	}

	const db = await getDb();
	const users = db.collection("users");
	const now = new Date();
	const fallbackAddress = toUserAddress(draft.deliveryAddress);

	if (draft.userId) {
		const existingById = await users.findOne<{
			_id: ObjectId;
			name?: string;
			cpf?: string;
			phone?: string;
			address?: CheckoutAddress;
		}>({ _id: new ObjectId(draft.userId) }, { projection: { name: 1, cpf: 1, phone: 1, address: 1 } });
		if (existingById) {
			await users.updateOne(
				{ _id: existingById._id },
				{
					$set: {
						verified: true,
						updatedAt: now,
						cpfNormalized: buyer.cpf,
						...(existingById.name ? {} : { name: buyer.fullName }),
						...(existingById.cpf ? {} : { cpf: buyer.cpf }),
						...(existingById.phone ? {} : { phone: buyer.phone }),
						...(existingById.address || !fallbackAddress ? {} : { address: fallbackAddress }),
					},
					$unset: { verification: "" },
				},
			);
			return { userId: existingById._id.toHexString(), created: false };
		}
	}

	const [existingByEmail, existingByDocument] = await Promise.all([
		findUserByEmail(buyer.email),
		findUserByDocument(buyer.cpf),
	]);
	if (
		existingByEmail &&
		existingByDocument &&
		existingByEmail._id.toHexString() !== existingByDocument._id.toHexString()
	) {
		throw new Error("O e-mail e o CPF/CNPJ informados já pertencem a contas diferentes");
	}
	if (existingByDocument && existingByDocument.email.trim().toLowerCase() !== buyer.email) {
		throw new Error("O CPF/CNPJ informado já pertence a outra conta");
	}

	const existingUser = existingByEmail ?? existingByDocument;
	if (existingUser) {
		await users.updateOne(
			{ _id: existingUser._id },
			{
				$set: {
					email: buyer.email,
					verified: true,
					updatedAt: now,
					cpfNormalized: buyer.cpf,
					...(existingUser.name ? {} : { name: buyer.fullName }),
					...(existingUser.cpf ? {} : { cpf: buyer.cpf }),
					...(existingUser.phone ? {} : { phone: buyer.phone }),
					...(existingUser.address || !fallbackAddress ? {} : { address: fallbackAddress }),
				},
				$unset: { verification: "" },
			},
		);
		return { userId: existingUser._id.toHexString(), created: false };
	}

	try {
		const inserted = await users.insertOne({
			email: buyer.email,
			name: buyer.fullName,
			cpf: buyer.cpf,
			cpfNormalized: buyer.cpf,
			phone: buyer.phone,
			address: fallbackAddress,
			role: "customer",
			verified: true,
			authMethods: ["checkout_magic_link"],
			createdAt: now,
			updatedAt: now,
		});
		return { userId: inserted.insertedId.toHexString(), created: true };
	} catch (error) {
		const duplicate = error as { code?: number };
		if (duplicate.code === 11000) {
			const resolvedUser = await findUserByEmail(buyer.email);
			if (resolvedUser) {
				await users.updateOne(
					{ _id: resolvedUser._id },
					{
						$set: {
							email: buyer.email,
							verified: true,
							updatedAt: now,
							cpfNormalized: buyer.cpf,
							...(resolvedUser.name ? {} : { name: buyer.fullName }),
							...(resolvedUser.cpf ? {} : { cpf: buyer.cpf }),
							...(resolvedUser.phone ? {} : { phone: buyer.phone }),
							...(resolvedUser.address || !fallbackAddress ? {} : { address: fallbackAddress }),
						},
						$unset: { verification: "" },
					},
				);
				return { userId: resolvedUser._id.toHexString(), created: false };
			}
		}

		throw error;
	}
}
