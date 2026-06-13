import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "@/env.mjs";
import { LOCALE_COOKIE_NAME, matchLocale } from "@/i18n/config";
import { isBackofficeRole } from "@/lib/authz";
import { coreDecrypt } from "@/lib/session-core";

function isPublicApiPath(pathname: string) {
	return (
		pathname === "/api/auth/login" ||
		pathname === "/api/auth/login/form" ||
		pathname === "/api/auth/verify" ||
		pathname === "/api/auth/register" ||
		pathname === "/api/auth/forgot-password" ||
		pathname === "/api/auth/reset-password" ||
		pathname === "/api/stripe/webhook" ||
		pathname === "/api/auth/oauth/complete" ||
		pathname.startsWith("/api/auth/oauth/") ||
		pathname === "/api/address/postal-lookup"
	);
}

async function verifyAuth(request: NextRequest) {
	const auth = request.headers.get("authorization") || request.headers.get("Authorization");
	if (auth?.startsWith("Bearer ")) {
		const token = auth.slice(7).trim();
		try {
			const secret = new TextEncoder().encode(env.JWT_SECRET);
			await jwtVerify(token, secret, { algorithms: ["HS256"] });
			return { ok: true as const, clearSession: false as const };
		} catch {
			/* ignore */
		}
	}
	const session = request.cookies.get("session")?.value;
	if (session) {
		const data = await coreDecrypt(session);
		if (data && data.expires > Date.now()) return { ok: true as const, clearSession: false as const };
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

	const response = NextResponse.redirect(redirectUrl, { status: 307 });
	response.cookies.set(LOCALE_COOKIE_NAME, locale, {
		path: "/",
		maxAge: 60 * 60 * 24 * 365,
		sameSite: "lax",
	});
	return response;
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const localeRedirect = getLocaleRedirect(request);
	if (localeRedirect) return localeRedirect;

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
			const response = NextResponse.redirect(new URL("/login", request.url));
			return withUnauthorizedSessionCleared(response, authResult.clearSession);
		}
		return NextResponse.next();
	}
	if (isAdmin) {
		const session = request.cookies.get("session")?.value;
		if (!session) return NextResponse.redirect(new URL("/login", request.url));
		const data = await coreDecrypt(session);
		if (!data || data.expires <= Date.now()) {
			const response = NextResponse.redirect(new URL("/login", request.url));
			response.cookies.delete("session");
			return response;
		}
		if (!isBackofficeRole(data.user.role)) return NextResponse.redirect(new URL("/forbidden", request.url));
		return NextResponse.next();
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
