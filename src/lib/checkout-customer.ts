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
				phone: 1,
				address: 1,
			},
		},
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

	const existingByEmail = await findUserByEmail(buyer.email);
	if (existingByEmail) {
		await users.updateOne(
			{ _id: existingByEmail._id },
			{
				$set: {
					email: buyer.email,
					verified: true,
					updatedAt: now,
					...(existingByEmail.name ? {} : { name: buyer.fullName }),
					...(existingByEmail.cpf ? {} : { cpf: buyer.cpf }),
					...(existingByEmail.phone ? {} : { phone: buyer.phone }),
					...(existingByEmail.address || !fallbackAddress ? {} : { address: fallbackAddress }),
				},
				$unset: { verification: "" },
			},
		);
		return { userId: existingByEmail._id.toHexString(), created: false };
	}

	try {
		const inserted = await users.insertOne({
			email: buyer.email,
			name: buyer.fullName,
			cpf: buyer.cpf,
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
