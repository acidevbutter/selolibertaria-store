import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdersApiClient, OrdersPaymentResult } from "@/lib/mercado-pago-orders/contract";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/mercado-pago-orders/server-client", () => ({
	createMercadoPagoOrdersClient: createClient,
}));

import { createCheckoutOrder, retrieveCheckoutOrder } from "@/lib/mercado-pago-orders/checkout";

const result: OrdersPaymentResult = {
	providerOrderId: "mp_order_1",
	orderId: "ord_1",
	externalReference: "ord_1",
	status: "pending",
	amountInCents: 4200,
	currency: "BRL",
	paymentMethod: "pix",
	transaction: { id: "mp_tx_1", status: "pending", amountInCents: 4200, currency: "BRL" },
	pix: { qrCode: "pix-code", qrCodeBase64: null, ticketUrl: null, expiresAt: null },
};

describe("checkout Orders gateway", () => {
	beforeEach(() => {
		createClient.mockReset();
	});

	it("maps pending Orders status and keeps Pix data for the embedded checkout", async () => {
		const client = { createOrder: vi.fn().mockResolvedValue(result) } as unknown as OrdersApiClient;
		createClient.mockReturnValue(client);

		const checkout = await createCheckoutOrder({
			orderId: "ord_1",
			externalReference: "ord_1",
			amountInCents: 4200,
			currency: "BRL",
			payer: { email: "buyer@example.test" },
			paymentMethod: { type: "pix" },
			idempotencyKey: "orders:ord_1:attempt-1",
		});

		expect(checkout.status).toBe("processing");
		expect(checkout.providerStatus).toBe("pending");
		expect(checkout.pix?.qrCode).toBe("pix-code");
	});

	it("validates the order again when the checkout resumes", async () => {
		const client = { getOrder: vi.fn().mockResolvedValue(result) } as unknown as OrdersApiClient;
		createClient.mockReturnValue(client);

		await expect(
			retrieveCheckoutOrder({
				providerOrderId: "mp_order_1",
				expected: { externalReference: "ord_1", amountInCents: 4200, currency: "BRL" },
			}),
		).resolves.toMatchObject({ providerOrderId: "mp_order_1", transaction: { id: "mp_tx_1" } });
	});
});
