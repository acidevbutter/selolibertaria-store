import { NextResponse } from "next/server";
import { env } from "@/env.mjs";
import { getCartCookieItems } from "@/lib/cart-cookies";

export async function GET(request: Request) {
	const token = new URL(request.url).searchParams.get("token");
	if (!token) return new Response("Invalid or expired token", { status: 400 });
	const response = await fetch(`${env.FASTAPI_API_URL}/auth/verify`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ token }),
		cache: "no-store",
	});
	if (!response.ok) return new Response("Invalid or expired token", { status: 400 });
	const session = (await response.json()) as { access_token: string; expires_at: string };
	const target = (await getCartCookieItems())?.length ? "/checkout" : "/";
	const redirect = NextResponse.redirect(new URL(target, request.url));
	redirect.cookies.set({
		name: "session",
		value: session.access_token,
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		expires: new Date(session.expires_at),
	});
	return redirect;
}
