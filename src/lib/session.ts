import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/env.mjs";
import type { UserRole } from "@/lib/authz";

const SessionDuration = 5 * 60 * 60 * 1000;

export interface UserPayload {
	id: string;
	email: string;
	name?: string | null;
	role?: UserRole;
}

export interface SessionData {
	user: UserPayload;
	expires: number;
}

async function getRemoteUser(token: string): Promise<UserPayload | null> {
	try {
		const response = await fetch(`${env.FASTAPI_API_URL}/auth/me`, {
			headers: { authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!response.ok) return null;
		const user = (await response.json()) as UserPayload;
		return { id: user.id, email: user.email, name: user.name, role: user.role };
	} catch {
		return null;
	}
}

export async function decrypt(token: string): Promise<SessionData | null> {
	const user = await getRemoteUser(token);
	return user ? { user, expires: Date.now() + SessionDuration } : null;
}

export async function auth() {
	const token = (await cookies()).get("session")?.value;
	return token ? decrypt(token) : null;
}

export async function createPersistentSession(user: UserPayload) {
	const response = await fetch(`${env.FASTAPI_API_URL}/auth/internal/session`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"x-internal-api-key": env.FASTAPI_INTERNAL_API_KEY,
		},
		body: JSON.stringify({ user_id: user.id }),
		cache: "no-store",
	});
	if (!response.ok) throw new Error("Não foi possível criar a sessão");
	const session = (await response.json()) as { access_token: string; expires_at: string };
	const expires = new Date(session.expires_at).getTime();
	(await cookies()).set("session", session.access_token, {
		expires: new Date(expires),
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
	});
	return { sid: null, jwt: session.access_token, expires };
}

export async function revokeSessionByJwt(token: string) {
	await fetch(`${env.FASTAPI_API_URL}/auth/logout`, {
		method: "POST",
		headers: { authorization: `Bearer ${token}` },
		cache: "no-store",
	});
}

export async function revokeAllUserSessions(userId: string) {
	await fetch(`${env.FASTAPI_API_URL}/auth/internal/users/${encodeURIComponent(userId)}/revoke-sessions`, {
		method: "POST",
		headers: { "x-internal-api-key": env.FASTAPI_INTERNAL_API_KEY },
		cache: "no-store",
	});
}

export async function updateSession(_request: Request) {
	const token = (await cookies()).get("session")?.value;
	if (token && !(await getRemoteUser(token))) (await cookies()).delete("session");
	return NextResponse.next();
}

export { SessionDuration };
