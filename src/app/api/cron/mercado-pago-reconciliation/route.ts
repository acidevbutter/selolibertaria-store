import { reconcilePendingMercadoPagoOrders } from "@/lib/mercado-pago-orders/reconciliation";

export async function GET(request: Request) {
	if (request.headers.get("x-vercel-cron") !== "1") return new Response("Unauthorized", { status: 401 });
	return Response.json(await reconcilePendingMercadoPagoOrders({ limit: 50 }));
}
