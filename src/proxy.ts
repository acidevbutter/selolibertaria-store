import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { publicUrl } from "@/env.mjs";
import { matchLocale } from "@/i18n/config";
import { isBackofficeRole, normalizeUserRole } from "@/lib/authz";
import { isMaintenanceModeEnabled } from "@/lib/maintenance-mode";

type ProxySessionPayload = { role?: string | null };

function isPublicApiPath(pathname: string) {
	return (
		pathname === "/api/auth/login" ||
		pathname === "/api/auth/login/form" ||
		pathname === "/api/auth/verify" ||
		pathname === "/api/auth/register" ||
		pathname === "/api/auth/email-available" ||
		pathname === "/api/auth/forgot-password" ||
		pathname === "/api/auth/reset-password" ||
		pathname === "/api/cart" ||
		pathname === "/api/cart/merge" ||
		pathname === "/api/auth/oauth/complete" ||
		pathname.startsWith("/api/auth/oauth/") ||
		pathname === "/api/address/postal-lookup"
	);
}

async function decryptProxySession(token: string): Promise<ProxySessionPayload | null> {
	try {
		const response = await fetch(`${process.env.FASTAPI_API_URL || "http://localhost:8000"}/auth/me`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!response.ok) return null;
		const user = (await response.json()) as { role?: string };
		return { role: user.role };
	} catch {
		return null;
	}
}

async function verifyAuth(request: NextRequest) {
	const auth = request.headers.get("authorization") || request.headers.get("Authorization");
	const token = auth?.replace(/^Bearer\s+/i, "") || request.cookies.get("session")?.value;
	if (token) {
		if (await decryptProxySession(token)) return { ok: true as const, clearSession: false as const };
		return { ok: false as const, clearSession: true as const };
	}
	return { ok: false as const, clearSession: false as const };
}

function withUnauthorizedSessionCleared(response: NextResponse | Response, shouldClearSession: boolean) {
	if (!shouldClearSession || !(response instanceof NextResponse)) {
		return response;
	}
	response.cookies.delete("session");
	return response;
}

function getLocaleRedirect(request: NextRequest) {
	const [maybeLocale, ...restSegments] = request.nextUrl.pathname.split("/").filter(Boolean);
	const locale = matchLocale(maybeLocale);
	if (!locale) return null;

	const pathname = restSegments.length > 0 ? `/${restSegments.join("/")}` : "/";
	const redirectUrl = request.nextUrl.clone();
	redirectUrl.pathname = pathname;
	return NextResponse.redirect(redirectUrl, { status: 307 });
}

function isMaintenanceAllowedPath(pathname: string) {
	return (
		pathname === "/login" ||
		pathname === "/login/submit" ||
		pathname === "/api/auth/login" ||
		pathname === "/api/auth/login/form" ||
		pathname === "/maintenance"
	);
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const localeRedirect = getLocaleRedirect(request);
	if (localeRedirect) return localeRedirect;

	if (isMaintenanceModeEnabled() && !isMaintenanceAllowedPath(pathname)) {
		const session = request.cookies.get("session")?.value;
		const data = session ? await decryptProxySession(session) : null;
		const isAuthenticatedAdmin = normalizeUserRole(data?.role) === "admin";
		if (!isAuthenticatedAdmin) {
			if (pathname.startsWith("/api")) {
				return NextResponse.json({ error: "Site em manutenção", code: "MAINTENANCE_MODE" }, { status: 503 });
			}
			return NextResponse.redirect(new URL("/maintenance", publicUrl));
		}
	}

	const isApi = pathname.startsWith("/api");
	const pageProtected = pathname.startsWith("/orders") || pathname.startsWith("/user");
	const isAdmin = pathname.startsWith("/admin");

	if (isApi && !isPublicApiPath(pathname)) {
		const authResult = await verifyAuth(request);
		if (!authResult.ok) {
			const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
			return withUnauthorizedSessionCleared(response, authResult.clearSession);
		}
		return NextResponse.next();
	}

	if (pageProtected) {
		const authResult = await verifyAuth(request);
		if (!authResult.ok) {
			const response = NextResponse.redirect(new URL("/login", publicUrl));
			return withUnauthorizedSessionCleared(response, authResult.clearSession);
		}
		return NextResponse.next();
	}

	if (isAdmin) {
		const session = request.cookies.get("session")?.value;
		if (!session) return NextResponse.redirect(new URL("/login", publicUrl));
		const data = await decryptProxySession(session);
		if (!data) {
			const response = NextResponse.redirect(new URL("/login", publicUrl));
			response.cookies.delete("session");
			return response;
		}
		if (!isBackofficeRole(data.role)) {
			return NextResponse.redirect(new URL("/forbidden", publicUrl));
		}
		return NextResponse.next();
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
