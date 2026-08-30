import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import { requireCapability } from "@/lib/api-auth";

export async function GET(request: Request) {
	const auth = await requireCapability("orders.read");
	if ("error" in auth) return auth.error;
	const token = (await cookies()).get("session")?.value;
	if (!token) return Response.json({ error: "Não autorizado" }, { status: 401 });
	const source = new URL(request.url);
	const page = Math.max(1, Number(source.searchParams.get("page") || 1));
	const limit = Math.max(1, Math.min(100, Number(source.searchParams.get("limit") || 20)));
	const response = await fetch(`${env.FASTAPI_API_URL}/orders/?page=${page}&page_size=${limit}`, {
		headers: { authorization: `Bearer ${token}` },
		cache: "no-store",
	});
	if (!response.ok) return Response.json({ error: "Pedidos indisponíveis" }, { status: response.status });
	const body = (await response.json()) as {
		items: Array<{
			id: string;
			buyer_email: string | null;
			amount_total: number;
			currency: string;
			status: string;
			created_at: string;
		}>;
		total: number;
	};
	return Response.json({
		page,
		limit,
		total: body.total,
		items: body.items.map((item) => ({
			id: item.id,
			userEmail: item.buyer_email,
			amountTotal: item.amount_total,
			currency: item.currency,
			status: item.status,
			createdAt: item.created_at,
		})),
	});
}
