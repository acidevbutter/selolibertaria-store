import { cookies, headers } from "next/headers";
import { env } from "@/env.mjs";
import { type Capability, hasCapability, normalizeUserRole } from "@/lib/authz";

async function currentUser(token: string) {
	const response = await fetch(`${env.FASTAPI_API_URL}/auth/me`, {
		headers: { Authorization: `Bearer ${token}` },
		cache: "no-store",
	});
	if (!response.ok) return null;
	return (await response.json()) as { id: string; email: string; role?: string };
}

export async function requireAuth() {
	const h = await headers();
	const token = h.get("authorization")?.replace(/^Bearer\s+/i, "") || (await cookies()).get("session")?.value;
	if (!token) return { error: new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) };
	const user = await currentUser(token);
	if (!user) return { error: new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) };
	return { session: { sub: user.id, email: user.email, role: normalizeUserRole(user.role) } };
}

export async function requireAdmin() {
	const auth = await requireAuth();
	if ("error" in auth || auth.session.role !== "admin") {
		return { error: new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403 }) };
	}
	return auth;
}

export async function requireCapability(capability: Capability) {
	const auth = await requireAuth();
	if ("error" in auth || !hasCapability(auth.session.role, capability)) {
		return { error: new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403 }) };
	}
	return auth;
}
