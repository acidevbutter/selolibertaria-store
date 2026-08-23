import { describe, expect, it, vi } from "vitest";
import { logMercadoPagoOrders } from "@/lib/mercado-pago-orders/observability";

describe("logMercadoPagoOrders", () => {
	it("registra somente a correlação segura da operação", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		logMercadoPagoOrders({
			operation: "create",
			status: "error",
			orderId: "ord_safe",
			providerOrderId: "mp_safe",
			errorCode: "timeout",
			durationMs: 8000,
		});
		expect(spy).toHaveBeenCalledWith(expect.stringContaining('"event":"mercado_pago_orders"'));
		expect(spy).not.toHaveBeenCalledWith(expect.stringContaining("email"));
		spy.mockRestore();
	});
});
