import type { OrderResponse } from "mercadopago/dist/clients/order/commonTypes";
import { describe, expect, it } from "vitest";
import type { MercadoPagoOrderSdk } from "@/lib/mercado-pago-orders/sdk-client";
import { MercadoPagoOrdersSdkClient } from "@/lib/mercado-pago-orders/sdk-client";

const response: OrderResponse = {
	api_response: { status: 201, headers: [] },
	id: "mp_order_1",
	external_reference: "ord_1",
	status: "processed",
	total_amount: "42.00",
	currency: "BRL",
	transactions: {
		payments: [
			{
				id: "mp_transaction_1",
				status: "approved",
				status_detail: "accredited",
				amount: "42.00",
				payment_method: { id: "pix", type: "bank_transfer", qr_code: "pix-code", installments: 1 },
			},
		],
	},
};

function createSdk(overrides: Partial<MercadoPagoOrderSdk> = {}) {
	return {
		create: async () => response,
		get: async () => response,
		cancel: async () => ({
			...response,
			status: "cancelled",
			transactions: { payments: [{ ...response.transactions?.payments?.[0], status: "cancelled" }] },
		}),
		refund: async () => ({
			...response,
			status: "refunded",
			transactions: { payments: [{ ...response.transactions?.payments?.[0], status: "refunded" }] },
		}),
		search: async () => ({ data: [response], paging: { total: "1" } }),
		...overrides,
	} satisfies MercadoPagoOrderSdk;
}

describe("MercadoPagoOrdersSdkClient", () => {
	it("maps the SDK response and forwards safe create options", async () => {
		let createInput: Parameters<MercadoPagoOrderSdk["create"]>[0] | undefined;
		const sdk = createSdk({
			create: async (input) => {
				createInput = input;
				return response;
			},
		});
		const logs: Array<{ operation: string; status: string; [key: string]: unknown }> = [];
		const client = new MercadoPagoOrdersSdkClient(sdk, 7000, (entry) => logs.push(entry));

		const result = await client.createOrder({
			orderId: "ord_1",
			externalReference: "ord_1",
			amountInCents: 4200,
			currency: "BRL",
			payer: { email: "buyer@example.test" },
			paymentMethod: { type: "pix" },
			idempotencyKey: "orders:ord_1:attempt-1",
		});

		expect(result).toMatchObject({
			providerOrderId: "mp_order_1",
			orderId: "ord_1",
			status: "approved",
			paymentMethod: "pix",
			transaction: { id: "mp_transaction_1", amountInCents: 4200 },
			statusDetail: "accredited",
			installments: 1,
		});
		expect(createInput).toMatchObject({
			body: {
				processing_mode: "automatic",
				total_amount: "42.00",
				transactions: {
					payments: [{ amount: "42.00", payment_method: { id: "pix", type: "bank_transfer" } }],
				},
			},
			requestOptions: { timeout: 7000, idempotencyKey: "orders:ord_1:attempt-1" },
		});
		expect(JSON.stringify(logs)).not.toContain("buyer@example.test");
	});

	it("maps the Orders processing status to a pending payment", async () => {
		const client = new MercadoPagoOrdersSdkClient(
			createSdk({
				create: async () => ({
					...response,
					status: "processing",
					transactions: {
						payments: [{ ...response.transactions?.payments?.[0], status: "processing" }],
					},
				}),
			}),
		);

		await expect(
			client.createOrder({
				orderId: "ord_processing_1",
				externalReference: "ord_processing_1",
				amountInCents: 4200,
				currency: "BRL",
				payer: { email: "buyer@example.test" },
				paymentMethod: { type: "pix" },
				idempotencyKey: "orders:ord_processing_1:attempt-1",
			}),
		).resolves.toMatchObject({ status: "pending", transaction: { status: "pending" } });
	});

	it("forwards token and selected installments through the Orders transaction", async () => {
		let createInput: Parameters<MercadoPagoOrderSdk["create"]>[0] | undefined;
		const client = new MercadoPagoOrdersSdkClient(
			createSdk({
				create: async (input) => {
					createInput = input;
					return response;
				},
			}),
		);

		await client.createOrder({
			orderId: "ord_card_1",
			externalReference: "ord_card_1",
			amountInCents: 4200,
			currency: "BRL",
			payer: { email: "buyer@example.test" },
			paymentMethod: { type: "card", id: "visa", token: "one-time-token", installments: 3 },
			idempotencyKey: "orders:ord_card_1:attempt-1",
		});

		expect(createInput?.body.transactions?.payments?.[0]?.payment_method).toMatchObject({
			id: "visa",
			token: "one-time-token",
			installments: 3,
		});
	});

	it("uses the SDK for search, cancel, partial refund and webhook reconciliation", async () => {
		const sdk = createSdk();
		const client = new MercadoPagoOrdersSdkClient(sdk);

		expect(
			(await client.searchOrders({ beginDate: "2026-07-01T00:00:00Z", endDate: "2026-07-31T23:59:59Z" }))
				.length,
		).toBe(1);
		expect(
			(await client.cancelOrder({ providerOrderId: "mp_order_1", idempotencyKey: "cancel-1" })).status,
		).toBe("cancelled");
		expect(
			(
				await client.refundOrder({
					providerOrderId: "mp_order_1",
					amountInCents: 4200,
					idempotencyKey: "refund-1",
				})
			).status,
		).toBe("refunded");
		expect(
			(
				await client.reconcileWebhook({
					eventId: "evt-1",
					providerOrderId: "mp_order_1",
					orderId: "ord_1",
					externalReference: "ord_1",
					status: "approved",
					amountInCents: 4200,
					currency: "BRL",
					transactionId: "mp_transaction_1",
				})
			).status,
		).toBe("approved");
	});

	it("normalizes transient SDK errors and blocks integrity divergence", async () => {
		const client = new MercadoPagoOrdersSdkClient(
			createSdk({ create: async () => Promise.reject({ status: 503 }) }),
		);
		await expect(
			client.createOrder({
				orderId: "ord_1",
				externalReference: "ord_1",
				amountInCents: 4200,
				currency: "BRL",
				payer: { email: "buyer@example.test" },
				paymentMethod: { type: "card", id: "visa", token: "one-time-token" },
				idempotencyKey: "orders:ord_1:attempt-2",
			}),
		).rejects.toMatchObject({ code: "timeout", retryable: true });

		const mismatchClient = new MercadoPagoOrdersSdkClient(createSdk());
		await expect(
			mismatchClient.reconcileWebhook({
				eventId: "evt-2",
				providerOrderId: "mp_order_1",
				orderId: "ord_1",
				externalReference: "ord_1",
				status: "approved",
				amountInCents: 4300,
				currency: "BRL",
				transactionId: "mp_transaction_1",
			}),
		).rejects.toMatchObject({ code: "integrity_mismatch" });
	});
});
