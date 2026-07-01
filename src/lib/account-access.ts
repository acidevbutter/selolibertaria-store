import { createHash, randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import type { UserRole } from "@/lib/authz";
import { getDb } from "@/lib/mongodb";

const ACCOUNT_ACCESS_TTL_MS = 1000 * 60 * 60 * 72;
const PASSWORD_SETUP_TTL_MS = 1000 * 60 * 60 * 24;

interface StoredAccountAccessToken {
	tokenHash: string;
	orderId: string;
	expiresAt: Date | string;
	createdAt?: Date | string;
}

function hashToken(token: string) {
	return createHash("sha256").update(token).digest("hex");
}

function createRawToken() {
	return randomBytes(32).toString("base64url");
}

export async function issueAccountAccessToken(input: { userId: string; orderId: string }) {
	const token = createRawToken();
	const expiresAt = new Date(Date.now() + ACCOUNT_ACCESS_TTL_MS);
	const now = new Date();
	const db = await getDb();
	const users = db.collection("users");
	const existingUser = await users.findOne<{
		accountAccessTokens?: StoredAccountAccessToken[];
	}>({ _id: new ObjectId(input.userId) }, { projection: { accountAccessTokens: 1 } });

	const preservedTokens =
		existingUser?.accountAccessTokens?.filter((entry) => {
			const entryExpiresAt = new Date(entry.expiresAt);
			if (Number.isNaN(entryExpiresAt.getTime()) || entryExpiresAt <= now) {
				return false;
			}
			return entry.orderId !== input.orderId;
		}) ?? [];

	await users.updateOne(
		{ _id: new ObjectId(input.userId) },
		{
			$set: {
				accountAccessTokens: [
					...preservedTokens,
					{
						tokenHash: hashToken(token),
						orderId: input.orderId,
						expiresAt,
						createdAt: now,
					},
				],
				updatedAt: now,
			},
		},
	);

	return { token, expiresAt };
}

export async function consumeAccountAccessToken(token: string): Promise<
	| {
			ok: true;
			orderId: string;
			user: {
				id: string;
				email: string;
				name?: string;
				role?: UserRole;
				hasPassword: boolean;
			};
	  }
	| { ok: false; error: "invalid" | "expired" }
> {
	const db = await getDb();
	const tokenHash = hashToken(token);
	const user = await db.collection("users").findOne<{
		_id: ObjectId;
		email: string;
		name?: string;
		role?: UserRole;
		passwordHash?: string;
		accountAccessTokens?: StoredAccountAccessToken[];
	}>(
		{ "accountAccessTokens.tokenHash": tokenHash },
		{
			projection: {
				email: 1,
				name: 1,
				role: 1,
				passwordHash: 1,
				accountAccessTokens: 1,
			},
		},
	);

	if (!user) return { ok: false, error: "invalid" };

	const matchedToken = user.accountAccessTokens?.find((entry) => entry.tokenHash === tokenHash);
	if (!matchedToken) return { ok: false, error: "invalid" };

	const expiresAt = new Date(matchedToken.expiresAt);
	if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
		return { ok: false, error: "expired" };
	}

	return {
		ok: true,
		orderId: matchedToken.orderId,
		user: {
			id: user._id.toHexString(),
			email: user.email,
			name: user.name,
			role: user.role,
			hasPassword: Boolean(user.passwordHash),
		},
	};
}

export async function issuePasswordSetupToken(userId: string) {
	const token = createRawToken();
	const expiresAt = new Date(Date.now() + PASSWORD_SETUP_TTL_MS);
	const db = await getDb();

	await db.collection("users").updateOne(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				passwordReset: { token, expiresAt },
				updatedAt: new Date(),
			},
		},
	);

	return { token, expiresAt };
}
