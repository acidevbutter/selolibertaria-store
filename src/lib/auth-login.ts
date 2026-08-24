import "server-only";

import { env } from "@/env.mjs";
import { normalizeUserRole, type UserRole } from "@/lib/authz";
import { isMaintenanceModeEnabled } from "@/lib/maintenance-mode";

const MAINTENANCE_LOGIN_RESTRICTED_ERROR = "Login restrito à administração durante a manutenção.";

export async function authenticateAndCreateSession(input: {
	email: string;
	password: string;
	cartRaw?: string | null;
}): Promise<{ ok: true; role: UserRole; token: string } | { ok: false; error: string }> {
	try {
		const response = await fetch(`${env.FASTAPI_API_URL}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: input.email.trim().toLowerCase(), password: input.password }),
			cache: "no-store",
		});
		const body = (await response.json().catch(() => null)) as {
			access_token?: string;
			user?: { role?: string };
			detail?: string;
		} | null;
		if (!response.ok || !body?.access_token) {
			return { ok: false, error: body?.detail || "Credenciais inválidas" };
		}
		const role = normalizeUserRole(body.user?.role);
		if (isMaintenanceModeEnabled() && role !== "admin") {
			return { ok: false, error: MAINTENANCE_LOGIN_RESTRICTED_ERROR };
		}
		return { ok: true, role, token: body.access_token };
	} catch {
		return { ok: false, error: "Erro de autenticação" };
	}
}
