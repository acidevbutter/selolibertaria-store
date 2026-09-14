import { env } from "@/env.mjs";
import { requireAdmin } from "@/lib/api-auth";

export async function POST(request: Request) {
	const auth = await requireAdmin();
	if (auth.error) return auth.error;
	const body = (await request.json().catch(() => ({}))) as { orderId?: string; limit?: number };
	const response = await fetch(`${env.FASTAPI_API_URL}/checkout/reconcile`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY,
		},
		body: JSON.stringify({ order_id: body.orderId, limit: body.limit }),
		cache: "no-store",
	});
	return Response.json(await response.json().catch(() => null), { status: response.status });
}
