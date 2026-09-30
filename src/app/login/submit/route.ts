import { NextResponse } from "next/server";
import { publicUrl } from "@/env.mjs";
import { authenticateAndCreateSession } from "@/lib/auth-login";
import { isBackofficeRole } from "@/lib/authz";
import { loginErrorQuery } from "@/lib/login-error";

function buildLoginRedirect(query = "") {
	return NextResponse.redirect(new URL(`/login${query}`, publicUrl), 303);
}

export async function POST(req: Request) {
	const formData = await req.formData();
	const usernameRaw = formData.get("username");
	const passwordRaw = formData.get("password");

	if (typeof usernameRaw !== "string" || typeof passwordRaw !== "string") {
		return buildLoginRedirect("?login_error=invalid");
	}

	const result = await authenticateAndCreateSession({
		email: usernameRaw.trim().toLowerCase(),
		password: passwordRaw,
		cartRaw: typeof formData.get("cart") === "string" ? String(formData.get("cart")) : null,
	});

	if (!result.ok) {
		return buildLoginRedirect(loginErrorQuery(result.error));
	}

	const response = NextResponse.redirect(
		new URL(isBackofficeRole(result.role) ? "/admin" : "/", publicUrl),
		303,
	);
	response.cookies.set("session", result.token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
	});
	return response;
}
