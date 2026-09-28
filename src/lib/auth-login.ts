import "server-only";

import { env } from "@/env.mjs";
import { normalizeUserRole, type UserRole } from "@/lib/authz";
import { isMaintenanceModeEnabled } from "@/lib/maintenance-mode";

const MAINTENANCE_LOGIN_RESTRICTED_ERROR = "Login restrito à administração durante a manutenção.";

// Exact string returned by the backend's AuthService.login (app/auth/service.py)
// when the account's e-mail hasn't been verified yet. Kept as an exact match
// (rather than a substring/regex) so routes can map it to a distinct
// login_error bucket without misclassifying unrelated auth failures.
export const UNVERIFIED_LOGIN_ERROR =
	"E-mail não verificado. Enviamos um novo link de confirmação para o seu e-mail.";

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
			return { ok: false, error: body?.detail || "Credenciais inválidas" };
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
