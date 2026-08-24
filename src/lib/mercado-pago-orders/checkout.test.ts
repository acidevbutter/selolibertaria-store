import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env.mjs", () => ({ env: { FASTAPI_API_URL: "http://fastapi.test" } }));

import { getMaxCardInstallments, getMercadoPagoCardErrorMessage } from "@/lib/mercado-pago-orders/card";
import { createCheckoutOrder, retrieveCheckoutOrder } from "@/lib/mercado-pago-orders/checkout";

const result = {
	provider_order_id: "mp_order_1",
	external_reference: "ord_1",
	status: "processing",
	provider_status: "pending",
	transaction_id: "mp_tx_1",
	amount_in_cents: 4200,
	currency: "BRL",
	payment_method: "pix",
	status_detail: null,
	installments: null,
	qr_code: "pix-code",
	qr_code_base64: null,
	ticket_url: null,
	expires_at: null,
};

describe("checkout Orders gateway", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(result))));
	});

	it("limits installments by order value and keeps rejection details safe", () => {
		expect(getMaxCardInstallments(4200)).toBe(12);
		expect(getMaxCardInstallments(599)).toBe(5);
		expect(getMercadoPagoCardErrorMessage("cc_rejected_insufficient_amount")).toContain("limite");
		expect(getMercadoPagoCardErrorMessage("unknown_provider_detail")).toContain("recusado");
	});

	it("maps pending Orders status and keeps Pix data for the embedded checkout", async () => {
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
		await expect(
			retrieveCheckoutOrder({
				providerOrderId: "mp_order_1",
				expected: { externalReference: "ord_1", amountInCents: 4200, currency: "BRL" },
			}),
		).resolves.toMatchObject({ providerOrderId: "mp_order_1", transaction: { id: "mp_tx_1" } });
	});
});
