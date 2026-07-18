import { describe, expect, it } from "vitest";
import { buildMercadoPagoPaymentAttemptIdempotencyKey } from "@/lib/checkout/mercado-pago-idempotency";

const baseInput = {
	orderId: "ord_123",
	checkoutOwnerKey: "guest",
	cartHash: "cart_hash",
	amountTotal: 7590,
	currency: "BRL",
	paymentMethodId: "pix",
	buyerEmail: "leitora@selo.com",
	deliveryMethod: "pickup" as const,
	deliveryAddress: null,
	shippingRate: null,
};

describe("buildMercadoPagoPaymentAttemptIdempotencyKey", () => {
	it("keeps the same key for the same payment attempt", () => {
		const first = buildMercadoPagoPaymentAttemptIdempotencyKey({
			...baseInput,
			attemptId: "attempt-1",
		});
		const second = buildMercadoPagoPaymentAttemptIdempotencyKey({
			...baseInput,
			attemptId: "attempt-1",
		});

		expect(first).toBe(second);
		expect(first).toContain("mp:ord_123:");
	});

	it("changes the key between payment attempts", () => {
		const first = buildMercadoPagoPaymentAttemptIdempotencyKey({
			...baseInput,
			attemptId: "attempt-1",
		});
		const second = buildMercadoPagoPaymentAttemptIdempotencyKey({
			...baseInput,
			attemptId: "attempt-2",
		});

		expect(first).not.toBe(second);
	});
});
