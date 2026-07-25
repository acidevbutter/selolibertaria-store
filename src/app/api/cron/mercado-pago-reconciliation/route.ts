import { env } from "@/env.mjs";
import { reconcilePendingMercadoPagoOrders } from "@/lib/mercado-pago-orders/reconciliation";

export async function GET(request: Request) {
	const expected = env.MERCADO_PAGO_RECONCILIATION_SECRET;
	const received = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
	if (!expected || received !== expected) return new Response("Unauthorized", { status: 401 });
	return Response.json(await reconcilePendingMercadoPagoOrders({ limit: 50 }));
}
