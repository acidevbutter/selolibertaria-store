import { createHash, randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import type { UserRole } from "@/lib/authz";
import { getDb } from "@/lib/mongodb";

const ACCOUNT_ACCESS_TTL_MS = 1000 * 60 * 60 * 72;
const PASSWORD_SETUP_TTL_MS = 1000 * 60 * 60 * 24;
const PASSWORD_RESET_TTL_MS = 1000 * 60 * 60;

interface StoredAccountAccessToken {
	tokenHash: string;
	orderId: string;
	expiresAt: Date | string;
	createdAt?: Date | string;
}

interface StoredPasswordResetToken {
	tokenHash: string;
	expiresAt: Date | string;
	createdAt?: Date | string;
	purpose?: "setup" | "reset";
}

function hashToken(token: string) {
	return createHash("sha256").update(token).digest("hex");
}

function createRawToken() {
	return randomBytes(32).toString("base64url");
}

function isExpired(rawDate: Date | string | undefined | null, now = new Date()) {
	if (!rawDate) {
		return true;
	}

	const parsed = new Date(rawDate);
	return Number.isNaN(parsed.getTime()) || parsed <= now;
}

export async function issueAccountAccessToken(input: { userId: string; orderId: string }) {
	const token = createRawToken();
	const expiresAt = new Date(Date.now() + ACCOUNT_ACCESS_TTL_MS);
	const now = new Date();
	const db = await getDb();
	const users = db.collection("users");
	const existingUser = await users.findOne<{ accountAccessTokens?: StoredAccountAccessToken[] }>(
		{ _id: new ObjectId(input.userId) },
		{ projection: { accountAccessTokens: 1 } },
	);

	const preservedTokens =
		existingUser?.accountAccessTokens?.filter((entry) => {
			if (isExpired(entry.expiresAt, now)) {
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
	| { ok: false; error: "invalid" | "expired" | "missing_user" }
> {
	const db = await getDb();
	const users = db.collection("users");
	const tokenHash = hashToken(token);
	const now = new Date();
	const user = await users.findOne<{
		_id: ObjectId;
		email?: string;
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

	if (!user?.email) {
		return { ok: false, error: "missing_user" };
	}

	const matchedToken = user.accountAccessTokens?.find((entry) => entry.tokenHash === tokenHash);
	if (!matchedToken) {
		return { ok: false, error: "invalid" };
	}

	if (isExpired(matchedToken.expiresAt, now)) {
		await users.updateOne(
			{ _id: user._id },
			{
				$set: {
					accountAccessTokens: (user.accountAccessTokens ?? []).filter(
						(entry) => entry.tokenHash !== tokenHash && !isExpired(entry.expiresAt, now),
					),
					updatedAt: now,
				},
			},
		);
		return { ok: false, error: "expired" };
	}

	await users.updateOne(
		{ _id: user._id },
		{
			$set: {
				accountAccessTokens: (user.accountAccessTokens ?? []).filter(
					(entry) => entry.tokenHash !== tokenHash && !isExpired(entry.expiresAt, now),
				),
				updatedAt: now,
			},
		},
	);

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

export async function issuePasswordResetToken(input: {
	userId: string;
	ttlMs?: number;
	purpose?: "setup" | "reset";
}) {
	const token = createRawToken();
	const now = new Date();
	const expiresAt = new Date(now.getTime() + (input.ttlMs ?? PASSWORD_RESET_TTL_MS));
	const passwordReset: StoredPasswordResetToken = {
		tokenHash: hashToken(token),
		expiresAt,
		createdAt: now,
		purpose: input.purpose ?? "reset",
	};

	const db = await getDb();
	await db.collection("users").updateOne(
		{ _id: new ObjectId(input.userId) },
		{
			$set: {
				passwordReset,
				updatedAt: now,
			},
		},
	);

	return { token, expiresAt };
}

export async function issuePasswordSetupToken(userId: string) {
	return issuePasswordResetToken({
		userId,
		ttlMs: PASSWORD_SETUP_TTL_MS,
		purpose: "setup",
	});
}

export async function resolvePasswordResetToken(token: string): Promise<
	| {
			ok: true;
			user: {
				_id: ObjectId;
				passwordHash?: string;
				passwordReset?: StoredPasswordResetToken;
			};
	  }
	| { ok: false; error: "invalid" | "expired" }
> {
	const db = await getDb();
	const tokenHash = hashToken(token);
	const user = await db.collection("users").findOne<{
		_id: ObjectId;
		passwordHash?: string;
		passwordReset?: StoredPasswordResetToken;
	}>({ "passwordReset.tokenHash": tokenHash }, { projection: { passwordHash: 1, passwordReset: 1 } });

	if (!user?.passwordReset) {
		return { ok: false, error: "invalid" };
	}

	if (user.passwordReset.tokenHash !== tokenHash) {
		return { ok: false, error: "invalid" };
	}

	if (isExpired(user.passwordReset.expiresAt)) {
		return { ok: false, error: "expired" };
	}

	return { ok: true, user };
}

export function hashAccountAccessToken(token: string) {
	return hashToken(token);
}
