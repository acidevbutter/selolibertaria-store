import { jwtVerify } from "jose";
import { ObjectId } from "mongodb";
import { cookies, headers } from "next/headers";
import { env } from "@/env.mjs";
import {
	type Capability,
	canBuyOnSelolibertaria,
	hasCapability,
	isUserBlocked,
	normalizeUserRole,
} from "@/lib/authz";
import { getDb } from "@/lib/mongodb";
import { coreDecrypt } from "@/lib/session-core";

async function getBlockedState(userId: string) {
	const db = await getDb();
	const user = await db
		.collection("users")
		.findOne<{ access?: { blockedAt?: Date | string | null } | null }>(
			{ _id: new ObjectId(userId) },
			{ projection: { access: 1 } },
		);
	return isUserBlocked(user);
}

export async function requireAuth() {
	const h = await headers();
	const auth = h.get("authorization") || h.get("Authorization");
	if (auth?.startsWith("Bearer ")) {
		const token = auth.slice(7).trim();
		try {
			const secret = new TextEncoder().encode(env.JWT_SECRET);
			const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
			if (payload?.sub) {
				const sub = String(payload.sub);
				if (await getBlockedState(sub)) {
					return { error: new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403 }) };
				}
				return {
					session: {
						...payload,
						sub,
						email: typeof payload.email === "string" ? payload.email : undefined,
						role: normalizeUserRole(typeof payload.role === "string" ? payload.role : undefined),
					},
				};
			}
		} catch {
			/* ignore */
		}
	}
	const sessionToken = (await cookies()).get("session")?.value;
	if (sessionToken) {
		const data = await coreDecrypt(sessionToken);
		if (data && data.expires > Date.now()) {
			if (await getBlockedState(data.user.id)) {
				return { error: new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403 }) };
			}
			return {
				session: {
					sub: data.user.id,
					email: data.user.email,
					role: normalizeUserRole(data.user.role),
				},
			};
		}
	}
	return { error: new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) };
}

export async function requireAdmin() {
	// Prefer cookie session so we can read role
	const sessionToken = (await cookies()).get("session")?.value;
	if (sessionToken) {
		const data = await coreDecrypt(sessionToken);
		const role = normalizeUserRole(data?.user?.role);
		if (data && data.expires > Date.now() && role === "admin") {
			return { session: { sub: data.user.id, email: data.user.email, role: "admin" as const } };
		}
	}
	// Fallback: Authorization header won't carry role; reject to avoid privilege escalation
	return { error: new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403 }) };
}

export async function requireCapability(capability: Capability) {
	const auth = await requireAuth();
	if ("error" in auth) return auth;
	if (!hasCapability(auth.session.role, capability)) {
		return { error: new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403 }) };
	}
	return auth;
}

export async function requireSelolibertariaBuyer() {
	const auth = await requireAuth();
	if ("error" in auth) return auth;
	if (!canBuyOnSelolibertaria(auth.session.role)) {
		return { error: new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403 }) };
	}
	return auth;
}
