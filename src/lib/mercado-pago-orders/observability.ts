import type { OrdersAdapterLog } from "@/lib/mercado-pago-orders/sdk-client";

type SafeOrdersLog = Pick<
	OrdersAdapterLog,
	"operation" | "status" | "orderId" | "providerOrderId" | "providerStatus" | "errorCode" | "durationMs"
> & { event: "mercado_pago_orders" };

export function logMercadoPagoOrders(entry: OrdersAdapterLog) {
	const safeEntry: SafeOrdersLog = {
		event: "mercado_pago_orders",
		operation: entry.operation,
		status: entry.status,
		orderId: entry.orderId,
		providerOrderId: entry.providerOrderId,
		providerStatus: entry.providerStatus,
		errorCode: entry.errorCode,
		durationMs: entry.durationMs,
	};

	if (entry.status === "error") {
		console.error(JSON.stringify(safeEntry));
		return;
	}
	console.info(JSON.stringify(safeEntry));
}
