import { NextResponse } from "next/server";
import { consumeAccountAccessToken } from "@/lib/account-access";
import { createPersistentSession } from "@/lib/session";

export async function GET(req: Request) {
	const url = new URL(req.url);
	const token = url.searchParams.get("token");
	if (!token) {
		return NextResponse.redirect(new URL("/login?access=missing", url.origin));
	}

	const result = await consumeAccountAccessToken(token);
	if (!result.ok) {
		return NextResponse.redirect(new URL(`/login?access=${result.error}`, url.origin));
	}

	await createPersistentSession({
		id: result.user.id,
		email: result.user.email,
		name: result.user.name,
		role: result.user.role,
	});

	const redirectUrl = new URL("/user", url.origin);
	redirectUrl.searchParams.set("section", "purchases");
	redirectUrl.searchParams.set("order", result.orderId);
	if (!result.user.hasPassword) {
		redirectUrl.searchParams.set("setupPassword", "1");
	}

	return NextResponse.redirect(redirectUrl);
}
