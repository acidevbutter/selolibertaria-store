import "server-only";

import { env } from "@/env.mjs";
import { normalizeUserRole, type UserRole } from "@/lib/authz";
import { INVALID_CREDENTIALS_ERROR, MAINTENANCE_LOGIN_RESTRICTED_ERROR } from "@/lib/login-error";
import { isMaintenanceModeEnabled } from "@/lib/maintenance-mode";

// Kept for existing importers; the error -> bucket mapping lives in src/lib/login-error.ts.
export { UNVERIFIED_LOGIN_ERROR } from "@/lib/login-error";

export async function authenticateAndCreateSession(input: {
	email: string;
	password: string;
	cartRaw?: string | null;
}): Promise<
	| { ok: true; role: UserRole; token: string; preferredCurrency?: string | null }
	| { ok: false; error: string }
> {
	try {
		const response = await fetch(`${env.FASTAPI_API_URL}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: input.email.trim().toLowerCase(), password: input.password }),
			cache: "no-store",
		});
		const body = (await response.json().catch(() => null)) as {
			access_token?: string;
			user?: { role?: string; preferred_currency?: string | null };
			detail?: string;
		} | null;
		if (!response.ok || !body?.access_token) {
			return { ok: false, error: body?.detail || INVALID_CREDENTIALS_ERROR };
		}
		const role = normalizeUserRole(body.user?.role);
		if ((await isMaintenanceModeEnabled()) && role !== "admin") {
			return { ok: false, error: MAINTENANCE_LOGIN_RESTRICTED_ERROR };
		}
		return { ok: true, role, token: body.access_token, preferredCurrency: body.user?.preferred_currency };
	} catch {
		return { ok: false, error: "Erro de autenticação" };
	}
}
