import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { env } from "@/env.mjs";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
	const auth = await requireAdmin();
	if (auth.error) return auth.error;
	const url = new URL(req.url);
	const limit = Math.min(Number(url.searchParams.get("limit") || "50"), 200);
	const skip = Math.max(Number(url.searchParams.get("skip") || "0"), 0);
	const status = url.searchParams.get("status");
	const token = (await cookies()).get("session")?.value;
	const response = await fetch(
		`${env.FASTAPI_API_URL}/webhooks?page=${Math.floor(skip / limit) + 1}&page_size=${limit}${status ? `&status=${encodeURIComponent(status)}` : ""}`,
		{ headers: { authorization: token ? `Bearer ${token}` : "" }, cache: "no-store" },
	);
	return new Response(await response.text(), {
		status: response.status,
		headers: { "Content-Type": "application/json" },
	});
}
