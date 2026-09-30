/**
 * Maps the `detail` string of a failed login to the `?login_error=` bucket the login form renders.
 * The backend (app/auth/service.py) distinguishes failures only by the Portuguese `detail` of a
 * 401, so the match is on exact known strings -- anything unknown stays `server`, never
 * misclassified as a credentials problem.
 */

// Exact strings from AuthService.login.
export const INVALID_CREDENTIALS_ERROR = "Credenciais inválidas";
export const UNVERIFIED_LOGIN_ERROR =
	"E-mail não verificado. Enviamos um novo link de confirmação para o seu e-mail.";
const BLOCKED_ACCOUNT_PREFIX = "Esta conta foi bloqueada";
// Produced by the store itself (auth-login.ts) while the storefront is in maintenance.
export const MAINTENANCE_LOGIN_RESTRICTED_ERROR = "Login restrito à administração durante a manutenção.";

export type LoginErrorBucket = "invalid" | "unverified" | "blocked" | "maintenance" | "server";

export function classifyLoginError(error: string): LoginErrorBucket {
	if (error === INVALID_CREDENTIALS_ERROR) return "invalid";
	if (error === UNVERIFIED_LOGIN_ERROR) return "unverified";
	if (error.startsWith(BLOCKED_ACCOUNT_PREFIX)) return "blocked";
	if (error === MAINTENANCE_LOGIN_RESTRICTED_ERROR) return "maintenance";
	return "server";
}

export function loginErrorQuery(error: string) {
	return `?login_error=${classifyLoginError(error)}`;
}
