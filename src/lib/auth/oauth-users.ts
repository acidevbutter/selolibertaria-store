import "server-only";

import type { ObjectId } from "mongodb";
import { isUserBlocked, normalizeUserRole, type UserRole } from "@/lib/authz";
import { ensureIndexes, getDb } from "@/lib/mongodb";
import type { OAuthProviderId } from "@/lib/oauth/catalog";

type OAuthIdentityInput = {
	provider: OAuthProviderId;
	providerAccountId: string;
	email?: string | null;
	name?: string | null;
	avatarUrl?: string | null;
	verified?: boolean;
};

type OAuthIdentityRecord = {
	provider: OAuthProviderId;
	providerAccountId: string;
	email?: string | null;
	displayName?: string | null;
	avatarUrl?: string | null;
	linkedAt: Date;
	lastLoginAt: Date;
};

function mergeIdentity(
	existing: OAuthIdentityRecord[] | undefined,
	input: OAuthIdentityInput,
	now: Date,
): OAuthIdentityRecord[] {
	const identities = [...(existing ?? [])];
	const idx = identities.findIndex(
		(identity) =>
			identity.provider === input.provider && identity.providerAccountId === input.providerAccountId,
	);
	const nextIdentity: OAuthIdentityRecord = {
		provider: input.provider,
		providerAccountId: input.providerAccountId,
		email: input.email ?? null,
		displayName: input.name ?? null,
		avatarUrl: input.avatarUrl ?? null,
		linkedAt: identities[idx]?.linkedAt ?? now,
		lastLoginAt: now,
	};
	if (idx >= 0) identities[idx] = nextIdentity;
	else identities.push(nextIdentity);
	return identities;
}

export async function findOrCreateOAuthUser(input: OAuthIdentityInput) {
	await ensureIndexes();
	const db = await getDb();
	const now = new Date();
	const emailLower = input.email?.trim().toLowerCase() || null;
	const users = db.collection("users");

	const byIdentity = await users.findOne<{
		_id: ObjectId;
		email: string;
		name?: string;
		role?: UserRole;
		access?: { blockedAt?: Date | string | null } | null;
		identities?: OAuthIdentityRecord[];
		authMethods?: string[];
		profileImage?: string | null;
	}>({
		identities: { $elemMatch: { provider: input.provider, providerAccountId: input.providerAccountId } },
	});

	if (byIdentity) {
		if (isUserBlocked(byIdentity)) {
			throw new Error("This account has been blocked. Contact support.");
		}
		const identities = mergeIdentity(byIdentity.identities, input, now);
		await users.updateOne(
			{ _id: byIdentity._id },
			{
				$set: {
					identities,
					updatedAt: now,
					lastLoginProvider: input.provider,
					...(input.avatarUrl ? { profileImage: input.avatarUrl } : {}),
					...(input.name && !byIdentity.name ? { name: input.name } : {}),
				},
				$addToSet: { authMethods: input.provider },
			},
		);
		return {
			id: byIdentity._id.toString(),
			email: byIdentity.email,
			name: byIdentity.name ?? input.name ?? undefined,
			role: normalizeUserRole(byIdentity.role),
		};
	}

	if (emailLower) {
		const byEmail = await users.findOne<{
			_id: ObjectId;
			email: string;
			name?: string;
			role?: UserRole;
			access?: { blockedAt?: Date | string | null } | null;
			identities?: OAuthIdentityRecord[];
			authMethods?: string[];
			profileImage?: string | null;
		}>({ email: emailLower });
		if (byEmail) {
			if (isUserBlocked(byEmail)) {
				throw new Error("This account has been blocked. Contact support.");
			}
			const identities = mergeIdentity(byEmail.identities, input, now);
			await users.updateOne(
				{ _id: byEmail._id },
				{
					$set: {
						identities,
						updatedAt: now,
						lastLoginProvider: input.provider,
						...(input.verified ? { verified: true } : {}),
						...(input.avatarUrl ? { profileImage: input.avatarUrl } : {}),
						...(input.name && !byEmail.name ? { name: input.name } : {}),
					},
					$addToSet: { authMethods: input.provider },
				},
			);
			return {
				id: byEmail._id.toString(),
				email: byEmail.email,
				name: byEmail.name ?? input.name ?? undefined,
				role: normalizeUserRole(byEmail.role),
			};
		}
	}

	const created = {
		email: emailLower ?? `${input.provider}.${input.providerAccountId}@oauth.local`,
		name: input.name ?? undefined,
		role: "customer" as const,
		verified: input.verified === true,
		identities: mergeIdentity(undefined, input, now),
		authMethods: [input.provider],
		profileImage: input.avatarUrl ?? null,
		lastLoginProvider: input.provider,
		createdAt: now,
		updatedAt: now,
	};
	const result = await users.insertOne(created);
	return {
		id: result.insertedId.toString(),
		email: created.email,
		name: created.name,
		role: "customer" as const,
	};
}
