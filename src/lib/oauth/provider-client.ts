import "server-only";

import { createHash, randomBytes } from "crypto";
import { publicUrl } from "@/env.mjs";
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

async function assertOkJson<T>(response: Response) {
	const data = (await response.json().catch(() => ({}))) as T & { error?: unknown };
	if (!response.ok) {
		throw new Error(typeof data.error === "string" ? data.error : "OAuth request failed");
	}
	return data;
}

export async function exchangeCodeForProfile(input: {
	providerId: OAuthProviderId;
	code: string;
	clientId: string;
	clientSecret: string;
	codeVerifier?: string;
}) {
	const callbackUrl = getOAuthCallbackUrl(input.providerId);

	if (input.providerId === "google") {
		const body = new URLSearchParams({
			client_id: input.clientId,
			client_secret: input.clientSecret,
			code: input.code,
			code_verifier: input.codeVerifier || "",
			grant_type: "authorization_code",
			redirect_uri: callbackUrl,
		});
		const tokenRes = await fetch(OAUTH_PROVIDER_DEFINITIONS.google.tokenUrl, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body,
		});
		const tokenData = await assertOkJson<{ access_token?: string }>(tokenRes);
		const profileRes = await fetch(OAUTH_PROVIDER_DEFINITIONS.google.userInfoUrl, {
			headers: { Authorization: `Bearer ${tokenData.access_token}` },
			cache: "no-store",
		});
		const profile = await assertOkJson<{
			sub: string;
			email?: string;
			email_verified?: boolean;
			name?: string;
			picture?: string;
		}>(profileRes);
		return {
			provider: "google" as const,
			providerAccountId: profile.sub,
			email: profile.email,
			emailVerified: profile.email_verified === true,
			name: profile.name,
			avatarUrl: profile.picture,
		};
	}

	if (input.providerId === "facebook") {
		const tokenUrl = new URL(OAUTH_PROVIDER_DEFINITIONS.facebook.tokenUrl);
		tokenUrl.searchParams.set("client_id", input.clientId);
		tokenUrl.searchParams.set("client_secret", input.clientSecret);
		tokenUrl.searchParams.set("redirect_uri", callbackUrl);
		tokenUrl.searchParams.set("code", input.code);
		const tokenRes = await fetch(tokenUrl, { cache: "no-store" });
		const tokenData = await assertOkJson<{ access_token?: string }>(tokenRes);
		const profileUrl = new URL(OAUTH_PROVIDER_DEFINITIONS.facebook.userInfoUrl);
		profileUrl.searchParams.set("fields", "id,name,email,picture");
		profileUrl.searchParams.set("access_token", tokenData.access_token || "");
		const profileRes = await fetch(profileUrl, { cache: "no-store" });
		const profile = await assertOkJson<{
			id: string;
			email?: string;
			name?: string;
			picture?: { data?: { url?: string } };
		}>(profileRes);
		return {
			provider: "facebook" as const,
			providerAccountId: profile.id,
			email: profile.email,
			emailVerified: Boolean(profile.email),
			name: profile.name,
			avatarUrl: profile.picture?.data?.url,
		};
	}

	const body = new URLSearchParams({
		client_id: input.clientId,
		client_secret: input.clientSecret,
		grant_type: "authorization_code",
		redirect_uri: callbackUrl,
		code: input.code,
	});
	const tokenRes = await fetch(OAUTH_PROVIDER_DEFINITIONS.instagram.tokenUrl, {
		method: "POST",
		body,
	});
	const tokenData = await assertOkJson<{ access_token?: string; user_id?: number }>(tokenRes);
	const profileUrl = new URL(OAUTH_PROVIDER_DEFINITIONS.instagram.userInfoUrl);
	profileUrl.searchParams.set("fields", "id,username");
	profileUrl.searchParams.set("access_token", tokenData.access_token || "");
	const profileRes = await fetch(profileUrl, { cache: "no-store" });
	const profile = await assertOkJson<{ id: string; username?: string }>(profileRes);
	return {
		provider: "instagram" as const,
		providerAccountId: profile.id,
		email: null,
		emailVerified: false,
		name: profile.username,
		avatarUrl: null,
	};
}
