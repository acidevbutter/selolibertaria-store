import { NextResponse } from "next/server";
import { publicUrl } from "@/env.mjs";
import { authenticateAndCreateSession, UNVERIFIED_LOGIN_ERROR } from "@/lib/auth-login";
import { isBackofficeRole } from "@/lib/authz";
import { CURRENCY_COOKIE_NAME, resolveSupportedCurrency } from "@/lib/currency";

function buildLoginRedirect(query = "") {
	return NextResponse.redirect(new URL(`/login${query}`, publicUrl), 303);
}

export async function POST(req: Request) {
	const formData = await req.formData();
	const emailRaw = formData.get("email");
	const passwordRaw = formData.get("password");

	if (typeof emailRaw !== "string" || typeof passwordRaw !== "string") {
		return buildLoginRedirect("?login_error=invalid");
	}

	const result = await authenticateAndCreateSession({
		email: emailRaw.trim().toLowerCase(),
		password: passwordRaw,
		cartRaw: typeof formData.get("cart") === "string" ? String(formData.get("cart")) : null,
	});

	if (!result.ok) {
		const query =
			result.error === "Credenciais inválidas"
				? "?login_error=invalid"
				: result.error === UNVERIFIED_LOGIN_ERROR
					? "?login_error=unverified"
					: "?login_error=server";
		return buildLoginRedirect(query);
	}

	const response = NextResponse.redirect(
		new URL(isBackofficeRole(result.role) ? "/admin" : "/", publicUrl),
		303,
	);
	const preferredCurrency = resolveSupportedCurrency(result.preferredCurrency);
	if (preferredCurrency) {
		response.cookies.set(CURRENCY_COOKIE_NAME, preferredCurrency, {
			path: "/",
			maxAge: 60 * 60 * 24 * 365,
			sameSite: "lax",
		});
	}
	return response;
}
