import { env } from "@/env.mjs";

function dataId(request: Request, body: Record<string, unknown> | null) {
	const url = new URL(request.url);
	const query = url.searchParams.get("data.id") || url.searchParams.get("id");
	if (query) return query;
	const data = body?.data;
	if (data && typeof data === "object" && "id" in data) return String((data as { id?: unknown }).id || "");
	return body?.id ? String(body.id) : "";
}

export async function POST(request: Request) {
	const raw = await request.text();
	let body: Record<string, unknown> | null = null;
	try {
		body = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
	} catch {
		return new Response("invalid payload", { status: 400 });
	}
	const response = await fetch(`${env.FASTAPI_API_URL}/payments/mercado-pago/webhook`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			...(request.headers.get("x-signature") ? { "x-signature": request.headers.get("x-signature")! } : {}),
			...(request.headers.get("x-request-id")
				? { "x-request-id": request.headers.get("x-request-id")! }
				: {}),
			"x-data-id": dataId(request, body),
		},
		body: raw || "{}",
		cache: "no-store",
	});
	return new Response(response.ok ? "ok" : "failed", { status: response.status });
}
