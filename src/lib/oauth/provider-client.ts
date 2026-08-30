import "server-only";

import { createHash, randomBytes } from "crypto";
import { env, publicUrl } from "@/env.mjs";
import { OAUTH_PROVIDER_DEFINITIONS, type OAuthProviderId } from "@/lib/oauth/catalog";

export type OAuthProfile = {
	provider: OAuthProviderId;
	providerAccountId: string;
	email?: string | null;
	emailVerified?: boolean;
	name?: string | null;
	avatarUrl?: string | null;
};

export function createOAuthState() {
	return randomBytes(24).toString("hex");
}

export function createPkcePair() {
	const verifier = randomBytes(48).toString("base64url");
	const challenge = createHash("sha256").update(verifier).digest("base64url");
	return { verifier, challenge };
}

export function getOAuthCallbackUrl(providerId: OAuthProviderId) {
	return `${publicUrl}/api/auth/oauth/${providerId}/callback`;
}

export function buildAuthorizationUrl(
	providerId: OAuthProviderId,
	options: { state: string; codeChallenge?: string },
) {
	const provider = OAUTH_PROVIDER_DEFINITIONS[providerId];
	const url = new URL(provider.authorizationUrl);
	url.searchParams.set("client_id", "");
	url.searchParams.set("redirect_uri", getOAuthCallbackUrl(providerId));
	url.searchParams.set("response_type", "code");
	url.searchParams.set("scope", provider.defaultScopes.join(" "));
	url.searchParams.set("state", options.state);
	if (providerId === "google" && options.codeChallenge) {
		url.searchParams.set("access_type", "online");
		url.searchParams.set("include_granted_scopes", "true");
		url.searchParams.set("prompt", "select_account");
		url.searchParams.set("code_challenge", options.codeChallenge);
		url.searchParams.set("code_challenge_method", "S256");
	}
	return url;
}

export async function exchangeCodeForProfile(input: {
	providerId: OAuthProviderId;
	code: string;
	redirectUri?: string;
	codeVerifier?: string;
}) {
	const response = await fetch(`${env.FASTAPI_API_URL}/auth/internal/oauth/${input.providerId}/exchange`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY,
		},
		body: JSON.stringify({
			code: input.code,
			redirect_uri: input.redirectUri ?? getOAuthCallbackUrl(input.providerId),
			code_verifier: input.codeVerifier ?? null,
		}),
		cache: "no-store",
	});
	const payload = (await response.json().catch(() => ({}))) as {
		provider?: OAuthProviderId;
		provider_account_id?: string;
		email?: string | null;
		email_verified?: boolean;
		name?: string | null;
		avatar_url?: string | null;
		detail?: string;
	};
	if (!response.ok || !payload.provider_account_id) {
		throw new Error(payload.detail || "OAuth request failed");
	}
	return {
		provider: payload.provider ?? input.providerId,
		providerAccountId: payload.provider_account_id,
		email: payload.email,
		emailVerified: payload.email_verified === true,
		name: payload.name,
		avatarUrl: payload.avatar_url,
	};
}
