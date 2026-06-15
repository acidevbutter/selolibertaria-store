import { NextResponse } from "next/server";
import { authenticateAndCreateSession } from "@/lib/auth-login";
import { isBackofficeRole } from "@/lib/authz";

function buildLoginRedirect(req: Request, query = "") {
	return NextResponse.redirect(new URL(`/login${query}`, req.url), 303);
}

export async function POST(req: Request) {
	const formData = await req.formData();
	const usernameRaw = formData.get("username");
	const passwordRaw = formData.get("password");

	if (typeof usernameRaw !== "string" || typeof passwordRaw !== "string") {
		return buildLoginRedirect(req, "?login_error=invalid");
	}

	const result = await authenticateAndCreateSession({
		email: usernameRaw.trim().toLowerCase(),
		password: passwordRaw,
		cartRaw: typeof formData.get("cart") === "string" ? String(formData.get("cart")) : null,
	});

	if (!result.ok) {
		const query = result.error === "Credenciais inválidas" ? "?login_error=invalid" : "?login_error=server";
		return buildLoginRedirect(req, query);
	}

	return NextResponse.redirect(new URL(isBackofficeRole(result.role) ? "/admin" : "/", req.url), 303);
}
