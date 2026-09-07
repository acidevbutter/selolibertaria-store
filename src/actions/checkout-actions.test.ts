import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ snapshot: vi.fn(), shipping: vi.fn(), fetch: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: vi.fn() }) }));
vi.mock("@/actions/order-actions", () => ({ finalizeCheckoutCleanup: vi.fn() }));
vi.mock("@/env.mjs", () => ({
	env: { FASTAPI_API_URL: "http://backend", FASTAPI_INTERNAL_API_KEY: "internal" },
}));
vi.mock("@/lib/api-auth", () => ({ requireAuth: async () => ({ error: true }) }));
vi.mock("@/lib/checkout/cart-snapshot", () => ({ getCheckoutSnapshot: mocks.snapshot }));
vi.mock("@/lib/shipping", () => ({
	resolveShippingQuotesForDestination: mocks.shipping,
	toShippingRate: (quote: { amount: number }) => ({ fixed_amount: { amount: quote.amount } }),
}));
vi.mock("@/lib/cart-cookies", () => ({ getCartId: async () => "guest-1" }));

import { createAsaasCheckout } from "./checkout-actions";

const buyer = {
	fullName: "Pessoa Teste",
	email: "pessoa@example.com",
	cpf: "12345678909",
	phone: "11999999999",
};

describe("checkout Asaas", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("fetch", mocks.fetch);
		mocks.snapshot.mockResolvedValue({
			ok: true,
			snapshot: {
				checkoutOwnerKey: "guest:guest-1",
				userId: null,
				user: {},
				cartHash: "cart-1",
				currency: "BRL",
				subtotal: 5000,
				discountTotal: 500,
				amountTotal: 4500,
				items: [],
			},
		});
		mocks.shipping.mockResolvedValue({ selected: { amount: 0 }, error: null });
		mocks.fetch.mockResolvedValue(
			new Response(
				JSON.stringify({
					order_id: "ord_1234",
					status: "pending",
					asaas_charge_id: "pay_1",
					redirect_url: "https://sandbox.asaas.com/i/pay_1",
					pix_copy_paste: null,
				}),
				{ status: 201 },
			),
		);
	});

	it("exige confirmação do total antes de emitir cobrança", async () => {
		const result = await createAsaasCheckout({ buyer, deliveryMethod: "pickup" });
		expect(result).toMatchObject({ needsConfirmation: true, amountTotal: 4500 });
		expect(mocks.fetch).not.toHaveBeenCalled();
	});

	it("envia centavos e interpreta o contrato snake_case", async () => {
		const result = await createAsaasCheckout({ buyer, deliveryMethod: "pickup", confirmedAmount: 4500 });
		expect(result).toMatchObject({
			ok: true,
			asaasChargeId: "pay_1",
			status: "pending",
			redirectUrl: "https://sandbox.asaas.com/i/pay_1",
		});
		const [url, request] = mocks.fetch.mock.calls[0]!;
		expect(url).toBe("http://backend/checkout/intents");
		expect(JSON.parse(request.body)).toMatchObject({
			amount_total: 4500,
			delivery_method: "pickup",
			delivery_address: null,
		});
		expect(request.headers.get("X-Internal-API-Key")).toBe("internal");
	});

	it("bloqueia entrega sem endereço completo", async () => {
		expect(
			await createAsaasCheckout({ buyer, deliveryMethod: "new-address", confirmedAmount: 4500 }),
		).toHaveProperty("error");
		expect(mocks.fetch).not.toHaveBeenCalled();
	});

	it("não emite cobrança quando o frete falha", async () => {
		mocks.shipping.mockResolvedValue({ selected: null, error: "Frete indisponível" });
		expect(await createAsaasCheckout({ buyer, deliveryMethod: "pickup", confirmedAmount: 4500 })).toEqual({
			error: "Frete indisponível",
		});
		expect(mocks.fetch).not.toHaveBeenCalled();
	});
});
