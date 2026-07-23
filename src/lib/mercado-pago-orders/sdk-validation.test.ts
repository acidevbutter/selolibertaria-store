import { MercadoPagoConfig, Order } from "mercadopago";
import { describe, expect, it } from "vitest";

describe("Mercado Pago Orders SDK v3", () => {
	it("exposes the lifecycle operations required by the Orders contract", () => {
		const config = new MercadoPagoConfig({
			accessToken: "APP_USR_test_only",
			options: { timeout: 8000, idempotencyKey: "orders-test-key" },
		});
		const order = new Order(config);
		const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(order));

		expect(config.options).toMatchObject({ timeout: 8000, idempotencyKey: "orders-test-key" });
		expect(methods).toEqual(
			expect.arrayContaining(["create", "get", "cancel", "refund", "search", "process", "capture"]),
		);
	});
});
