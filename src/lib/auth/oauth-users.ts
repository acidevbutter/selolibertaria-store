"use server";

import { env } from "@/env.mjs";
import type { UserRole } from "@/lib/authz";
import type { OAuthProviderId } from "@/lib/oauth/catalog";

type OAuthIdentityInput = {
	provider: OAuthProviderId;
	providerAccountId: string;
	email?: string | null;
	name?: string | null;
	avatarUrl?: string | null;
	verified?: boolean;
};

export async function findOrCreateOAuthUser(input: OAuthIdentityInput) {
	const response = await fetch(`${env.FASTAPI_API_URL}/auth/internal/oauth-user`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"x-internal-api-key": env.FASTAPI_INTERNAL_API_KEY,
		},
		body: JSON.stringify({
			provider: input.provider,
			provider_account_id: input.providerAccountId,
			email: input.email ?? null,
			name: input.name ?? null,
			avatar_url: input.avatarUrl ?? null,
			verified: input.verified === true,
		}),
		cache: "no-store",
	});
	if (!response.ok) {
		const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
		throw new Error(payload?.detail || "Não foi possível concluir o login OAuth");
	}
	return (await response.json()) as {
		id: string;
		email: string;
		name?: string | null;
		role: UserRole;
	};
}
