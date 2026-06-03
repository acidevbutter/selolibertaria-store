import { describe, expect, it } from "vitest";
import { hasStripeWebhookEvent, matchesStripeWebhookPurchase } from "@/lib/stripe-webhook-purchases";

describe("stripe webhook purchase helpers", () => {
	it("reconhece compra pelo id principal e ids relacionados", () => {
		const purchase = {
			id: "pi_123",
			relatedIds: {
				sessionId: "cs_123",
				paymentIntentId: "pi_123",
				chargeIds: ["ch_123"],
				refundIds: ["re_123"],
			},
		};

		expect(matchesStripeWebhookPurchase(purchase, "pi_123")).toBe(true);
		expect(matchesStripeWebhookPurchase(purchase, "cs_123")).toBe(true);
		expect(matchesStripeWebhookPurchase(purchase, "ch_123")).toBe(true);
		expect(matchesStripeWebhookPurchase(purchase, "re_123")).toBe(true);
		expect(matchesStripeWebhookPurchase(purchase, "missing")).toBe(false);
	});

	it("detecta eventos duplicados já registrados na compra", () => {
		const purchase = {
			id: "pi_123",
			events: [{ eventId: "evt_123" }, { eventId: "evt_456" }],
		};

		expect(hasStripeWebhookEvent(purchase, "evt_123")).toBe(true);
		expect(hasStripeWebhookEvent(purchase, "evt_999")).toBe(false);
	});
});
