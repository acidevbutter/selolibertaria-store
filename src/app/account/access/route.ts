import { NextResponse } from "next/server";
import { env } from "@/env.mjs";
import { createPersistentSession } from "@/lib/session";

export async function GET(req: Request) {
	const url = new URL(req.url);
	const token = url.searchParams.get("token");
	if (!token) {
		return NextResponse.redirect(new URL("/login?access=missing", url.origin));
	}

	const response = await fetch(`${env.FASTAPI_API_URL}/auth/account-access/consume`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ token }),
		cache: "no-store",
	});
	if (!response.ok) return NextResponse.redirect(new URL("/login?access=invalid", url.origin));
	const result = (await response.json()) as {
		order_id: string;
		session: {
			user: {
				id: string;
				email: string;
				name?: string;
				role?: "admin" | "vendor" | "customer";
				has_password: boolean;
			};
		};
	};

	await createPersistentSession({
		id: result.session.user.id,
		email: result.session.user.email,
		name: result.session.user.name,
		role: result.session.user.role,
	});

	const redirectUrl = new URL("/user", url.origin);
	redirectUrl.searchParams.set("section", "purchases");
	redirectUrl.searchParams.set("order", result.order_id);
	if (!result.session.user.has_password) {
		redirectUrl.searchParams.set("setupPassword", "1");
	}

	return NextResponse.redirect(redirectUrl);
}
