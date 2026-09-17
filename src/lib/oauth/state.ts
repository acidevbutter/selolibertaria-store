import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import type { OAuthProviderId } from "@/lib/oauth/catalog";

const key = new TextEncoder().encode(env.OAUTH_STATE_SECRET);
const OAUTH_STATE_COOKIE = "oauth_state";
const OAUTH_PENDING_COOKIE = "oauth_pending";

type OAuthStatePayload = {
	kind: "state";
	provider: OAuthProviderId;
	state: string;
	codeVerifier?: string;
	redirectTo?: string;
};

type OAuthPendingPayload = {
	kind: "pending";
	provider: OAuthProviderId;
	providerAccountId: string;
	displayName?: string;
	avatarUrl?: string;
	suggestedEmail?: string;
};

async function signPayload(payload: OAuthStatePayload | OAuthPendingPayload, expiresInMinutes: number) {
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(`${expiresInMinutes}m`)
		.sign(key);
}

async function verifyPayload<T>(token: string | undefined): Promise<T | null> {
	if (!token) return null;
	try {
		const verified = await jwtVerify(token, key, { algorithms: ["HS256"] });
		return verified.payload as T;
	} catch {
		return null;
	}
}

export async function readOAuthStateCookie() {
	const token = (await cookies()).get(OAUTH_STATE_COOKIE)?.value;
	return await verifyPayload<OAuthStatePayload>(token);
}

export async function clearOAuthStateCookie() {
	(await cookies()).set(OAUTH_STATE_COOKIE, "", { maxAge: 0, path: "/" });
}

export async function setOAuthPendingCookie(payload: OAuthPendingPayload) {
	const token = await signPayload(payload, 30);
	(await cookies()).set(OAUTH_PENDING_COOKIE, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 30,
		path: "/",
	});
}

export async function readOAuthPendingCookie() {
	const token = (await cookies()).get(OAUTH_PENDING_COOKIE)?.value;
	return await verifyPayload<OAuthPendingPayload>(token);
}

export async function clearOAuthPendingCookie() {
	(await cookies()).set(OAUTH_PENDING_COOKIE, "", { maxAge: 0, path: "/" });
}
