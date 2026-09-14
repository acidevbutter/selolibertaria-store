import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import { requireAdmin } from "@/lib/api-auth";

export async function POST(request: Request) {
	const auth = await requireAdmin();
	if (auth.error) return auth.error;
	const body = (await request.json().catch(() => null)) as { orderId?: string; operation?: string } | null;
	if (!body?.orderId || !["cancel", "refund"].includes(body.operation ?? "")) {
		return Response.json({ error: "Operação inválida" }, { status: 400 });
	}
	const sessionToken = (await cookies()).get("session")?.value;
	const response = await fetch(
		`${env.FASTAPI_API_URL}/orders/${encodeURIComponent(body.orderId)}/payment-operation`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY,
				...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
			},
			body: JSON.stringify({ operation: body.operation }),
			cache: "no-store",
		},
	);
	return Response.json(await response.json().catch(() => null), { status: response.status });
}
