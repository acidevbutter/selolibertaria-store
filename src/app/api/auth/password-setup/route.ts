import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env, publicUrl } from "@/env.mjs";

export async function GET(request: Request) {
	const token = (await cookies()).get("session")?.value;
	if (!token) return NextResponse.redirect(new URL("/login", publicUrl));
	const response = await fetch(`${env.FASTAPI_API_URL}/auth/password-setup`, {
		method: "POST",
		headers: { authorization: `Bearer ${token}` },
		cache: "no-store",
	});
	const next = new URL(request.url).searchParams.get("next");
	if (response.status === 409)
		return NextResponse.redirect(new URL(next || "/user?section=purchases", publicUrl));
	if (!response.ok) return NextResponse.redirect(new URL("/login", publicUrl));
	const body = (await response.json()) as { token: string };
	const redirect = new URL("/reset-password", publicUrl);
	redirect.searchParams.set("token", body.token);
	if (next) redirect.searchParams.set("next", next);
	return NextResponse.redirect(redirect);
}
