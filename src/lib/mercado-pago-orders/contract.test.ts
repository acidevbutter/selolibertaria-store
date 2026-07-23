import { describe, expect, it } from "vitest";
import type { OrdersApiError, OrdersPaymentInput } from "@/lib/mercado-pago-orders/contract";
import { MockOrdersApiClient, type OrdersMockScenario } from "@/lib/mercado-pago-orders/mock";

const baseInput: OrdersPaymentInput = {
	orderId: "ord_mock_1",
	externalReference: "ord_mock_1",
	amountInCents: 4200,
	currency: "BRL",
	payer: { email: "buyer@example.test" },
	paymentMethod: { type: "pix" },
	idempotencyKey: "orders:ord_mock_1:attempt-1",
};

describe("MockOrdersApiClient", () => {
	it.each<OrdersMockScenario>([
		"pix_pending",
		"pix_approved",
		"pix_expired",
		"pix_cancelled",
		"card_approved",
		"card_pending",
		"card_declined",
	])("returns the deterministic %s fixture", async (scenario) => {
		const client = new MockOrdersApiClient();
		const result = await client.createOrder({
			...baseInput,
			paymentMethod: { type: scenario.startsWith("card") ? "card" : "pix" },
			metadata: { mockScenario: scenario },
		});

		expect(result.status).toBe(
			scenario.includes("approved")
				? "approved"
				: scenario.includes("declined")
					? "declined"
					: scenario.includes("expired")
						? "expired"
						: scenario.includes("cancelled")
							? "cancelled"
							: "pending",
		);
		expect(result.amountInCents).toBe(4200);
		expect(result.externalReference).toBe("ord_mock_1");
		if (result.paymentMethod === "pix") expect(result.pix?.qrCode).toContain("ord_mock_1");
	});

	it("retries a transient timeout without creating a second order", async () => {
		const client = new MockOrdersApiClient();
		const input = { ...baseInput, metadata: { mockScenario: "timeout_retry" } };

		await expect(client.createOrder(input)).rejects.toMatchObject<Partial<OrdersApiError>>({
			code: "timeout",
			retryable: true,
		});
		const first = await client.createOrder(input);
		const second = await client.createOrder(input);
		expect(second).toEqual(first);
		expect(second.providerOrderId).toBe(first.providerOrderId);
	});

	it("deduplicates a webhook and rejects amount/reference divergence", async () => {
		const client = new MockOrdersApiClient();
		const order = await client.createOrder({ ...baseInput, metadata: { mockScenario: "pix_pending" } });
		const event = {
			eventId: "evt-1",
			providerOrderId: order.providerOrderId,
			orderId: order.orderId,
			externalReference: order.externalReference,
			status: "approved" as const,
			amountInCents: order.amountInCents,
			currency: order.currency,
			transactionId: order.transaction.id,
		};

		const first = await client.reconcileWebhook(event);
		const duplicate = await client.reconcileWebhook(event);
		expect(duplicate).toEqual(first);
		await expect(
			client.reconcileWebhook({ ...event, eventId: "evt-2", amountInCents: 4300 }),
		).rejects.toMatchObject({
			code: "integrity_mismatch",
		});
	});

	it("allows cancellation only while pending and makes it idempotent", async () => {
		const client = new MockOrdersApiClient();
		const pending = await client.createOrder({ ...baseInput, metadata: { mockScenario: "pix_pending" } });
		expect(
			(await client.cancelOrder({ providerOrderId: pending.providerOrderId, idempotencyKey: "cancel-1" }))
				.status,
		).toBe("cancelled");
		expect(
			(await client.cancelOrder({ providerOrderId: pending.providerOrderId, idempotencyKey: "cancel-2" }))
				.status,
		).toBe("cancelled");

		const approved = await client.createOrder({
			...baseInput,
			orderId: "ord_mock_approved",
			externalReference: "ord_mock_approved",
			idempotencyKey: "orders:approved",
			metadata: { mockScenario: "card_approved" },
			paymentMethod: { type: "card" },
		});
		await expect(
			client.cancelOrder({ providerOrderId: approved.providerOrderId, idempotencyKey: "cancel-3" }),
		).rejects.toMatchObject({ code: "not_cancelable" });
	});

	it("allows approved refunds, repeated refunds and rejects ineligible refunds", async () => {
		const client = new MockOrdersApiClient();
		const approved = await client.createOrder({
			...baseInput,
			metadata: { mockScenario: "card_approved" },
			paymentMethod: { type: "card" },
		});
		expect(
			(
				await client.refundOrder({
					providerOrderId: approved.providerOrderId,
					idempotencyKey: "refund-1",
					amountInCents: 4200,
				})
			).status,
		).toBe("refunded");
		expect(
			(await client.refundOrder({ providerOrderId: approved.providerOrderId, idempotencyKey: "refund-2" }))
				.status,
		).toBe("refunded");

		const declined = await client.createOrder({
			...baseInput,
			orderId: "ord_mock_declined",
			externalReference: "ord_mock_declined",
			idempotencyKey: "orders:declined",
			metadata: { mockScenario: "card_declined" },
			paymentMethod: { type: "card" },
		});
		await expect(
			client.refundOrder({ providerOrderId: declined.providerOrderId, idempotencyKey: "refund-3" }),
		).rejects.toMatchObject({ code: "not_refundable" });
	});
});
