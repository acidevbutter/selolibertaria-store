import { describe, expect, it } from "vitest";
import { createInternalOrderId, matchesOrderIdentifier } from "@/lib/order-identity";

describe("createInternalOrderId", () => {
	it("generates an ord_ prefixed identifier", () => {
		expect(createInternalOrderId()).toMatch(/^ord_[a-f0-9]{24}$/);
	});
});

describe("matchesOrderIdentifier", () => {
	it("matches by internal id", () => {
		expect(matchesOrderIdentifier({ id: "ord_1" }, "ord_1")).toBe(true);
	});

	it("matches by legacy Payments API payment id", () => {
		const order = { id: "ord_1", relatedIds: { mercadoPagoPaymentId: "mp_payment_1" } };
		expect(matchesOrderIdentifier(order, "mp_payment_1")).toBe(true);
	});

	it("matches by new Orders API order id", () => {
		const order = { id: "ord_1", relatedIds: { mercadoPagoOrderId: "mp_order_1" } };
		expect(matchesOrderIdentifier(order, "mp_order_1")).toBe(true);
	});

	it("matches when both legacy and new provider ids are present", () => {
		const order = {
			id: "ord_1",
			relatedIds: { mercadoPagoPaymentId: "mp_payment_1", mercadoPagoOrderId: "mp_order_1" },
		};
		expect(matchesOrderIdentifier(order, "mp_payment_1")).toBe(true);
		expect(matchesOrderIdentifier(order, "mp_order_1")).toBe(true);
	});

	it("returns false for an unrelated identifier", () => {
		const order = { id: "ord_1", relatedIds: { mercadoPagoPaymentId: "mp_payment_1" } };
		expect(matchesOrderIdentifier(order, "ord_2")).toBe(false);
	});
});
