import { requireAdmin } from "@/lib/api-auth";
import { reconcilePendingMercadoPagoOrders } from "@/lib/mercado-pago-orders/reconciliation";

export async function POST(request: Request) {
	const auth = await requireAdmin();
	if (auth.error) return auth.error;
	const body = (await request.json().catch(() => ({}))) as { orderId?: string; limit?: number };
	const result = await reconcilePendingMercadoPagoOrders({ orderId: body.orderId, limit: body.limit });
	return Response.json(result);
}
