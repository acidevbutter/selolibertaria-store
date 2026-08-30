import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/env.mjs";
import { requireAdmin } from "@/lib/api-auth";

async function forward(path: string, init: RequestInit = {}) {
	const token = (await cookies()).get("session")?.value;
	const headers = new Headers(init.headers);
	headers.set("Content-Type", "application/json");
	if (token) headers.set("Authorization", `Bearer ${token}`);
	return fetch(`${env.FASTAPI_API_URL}${path}`, { ...init, headers, cache: "no-store" });
}

export async function GET() {
	const { error } = await requireAdmin();
	if (error) return error;
	const response = await forward("/settings/");
	return new NextResponse(await response.text(), {
		status: response.status,
		headers: { "Content-Type": "application/json" },
	});
}

export async function PATCH(request: Request) {
	const { error } = await requireAdmin();
	if (error) return error;
	const body = await request.json().catch(() => null);
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		return NextResponse.json(
			{ error: "Payload de configurações inválido", code: "ADMIN_SETTINGS_INVALID_REQUEST" },
			{ status: 400 },
		);
	}
	const response = await forward("/settings/", {
		method: "PATCH",
		body: JSON.stringify({ current: body }),
	});
	return new NextResponse(await response.text(), {
		status: response.status,
		headers: { "Content-Type": "application/json" },
	});
}
