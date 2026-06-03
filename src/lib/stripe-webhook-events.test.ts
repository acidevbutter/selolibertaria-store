import { describe, expect, it } from "vitest";
import { deriveStripeEventStatus, extractStripeEventContext } from "./stripe-webhook-events";

describe("stripe-webhook-events", () => {
	it("mapeia eventos de disputa para status internos estáveis", () => {
		expect(deriveStripeEventStatus({ status: "needs_response" }, "charge.dispute.created")).toBe("disputed");
		expect(deriveStripeEventStatus({ status: "warning_closed" }, "charge.dispute.updated")).toBe("won");
		expect(deriveStripeEventStatus({ status: "lost" }, "charge.dispute.closed")).toBe("lost");
	});

	it("extrai payment intent e charge de eventos de disputa", () => {
		const context = extractStripeEventContext({
			type: "charge.dispute.created",
			data: {
				object: {
					id: "du_123",
					payment_intent: "pi_123",
					charge: "ch_123",
				},
			},
		} as never);

		expect(context.kind).toBe("dispute");
		expect(context.rootId).toBe("pi_123");
		expect(context.related.paymentIntentId).toBe("pi_123");
		expect(context.related.chargeId).toBe("ch_123");
	});
});
