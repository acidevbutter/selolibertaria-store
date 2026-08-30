import type { NextRequest } from "next/server";
import { env } from "@/env.mjs";
import { requireCapability } from "@/lib/api-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireCapability("orders.update_status");
	if ("error" in auth) return auth.error;
	const { id } = await params;
	const body = await req.text();
	const token = req.headers.get("authorization") || `Bearer ${req.cookies.get("session")?.value || ""}`;
	const response = await fetch(`${env.FASTAPI_API_URL}/orders/${encodeURIComponent(id)}/payment-operation`, {
		method: "POST",
		headers: {
			authorization: token,
			"content-type": "application/json",
		},
		body,
		cache: "no-store",
	});
	return new Response(await response.text(), {
		status: response.status,
		headers: { "content-type": response.headers.get("content-type") || "application/json" },
	});
}
