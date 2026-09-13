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

import {
	createAsaasCheckout,
	finalizeAsaasCheckout,
	getShippingQuote,
	saveCheckoutCard,
} from "./checkout-actions";

const buyer = {
	fullName: "Pessoa Teste",
	email: "pessoa@example.com",
	cpf: "12345678909",
	phone: "11999999999",
};

const address = {
	line1: "Rua Teste",
	number: "100",
	district: "Centro",
	city: "São Paulo",
	state: "SP",
	postalCode: "01000-000",
	country: "BR",
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
		const result = await createAsaasCheckout({ buyer, deliveryMethod: "new-address", address });
		expect(result).toMatchObject({ needsConfirmation: true, amountTotal: 4500 });
		expect(mocks.fetch).not.toHaveBeenCalled();
	});

	it("envia centavos e interpreta o contrato snake_case", async () => {
		const result = await createAsaasCheckout({
			buyer,
			deliveryMethod: "new-address",
			address,
			confirmedAmount: 4500,
		});
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
			delivery_method: "new-address",
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
		expect(
			await createAsaasCheckout({ buyer, deliveryMethod: "new-address", address, confirmedAmount: 4500 }),
		).toEqual({
			error: "Frete indisponível",
		});
		expect(mocks.fetch).not.toHaveBeenCalled();
	});
});

describe("getShippingQuote", () => {
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
		mocks.shipping.mockResolvedValue({
			selected: { amount: 990, estimatedDays: 3 },
			error: null,
		});
	});

	it("calcula o frete só com o CEP, sem exigir endereço completo ou comprador", async () => {
		const result = await getShippingQuote({
			deliveryMethod: "new-address",
			address: { postalCode: "01000-000", country: "BR" },
		});
		expect(result).toMatchObject({ ok: true, amountTotal: 4500 + 990, shippingAmount: 990 });
		expect(mocks.fetch).not.toHaveBeenCalled();
	});

	it("recusa calcular sem um CEP válido", async () => {
		expect(await getShippingQuote({ deliveryMethod: "new-address", address: null })).toHaveProperty("error");
		expect(mocks.shipping).not.toHaveBeenCalled();
	});

	it("propaga o erro quando o frete não é encontrado para o CEP", async () => {
		mocks.shipping.mockResolvedValue({ selected: null, error: "Frete indisponível" });
		expect(
			await getShippingQuote({
				deliveryMethod: "new-address",
				address: { postalCode: "01000-000", country: "BR" },
			}),
		).toEqual({ error: "Frete indisponível" });
	});
});

describe("finalizeAsaasCheckout", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("fetch", mocks.fetch);
	});

	it("expoe os dados do cartao quando o pedido foi pago com cartao salvavel", async () => {
		mocks.fetch.mockResolvedValue(
			new Response(
				JSON.stringify({
					status: "succeeded",
					account_email_sent: true,
					billing_type: "CREDIT_CARD",
					credit_card_brand: "VISA",
					credit_card_last4: "4242",
					card_save_available: true,
				}),
				{ status: 200 },
			),
		);

		const result = await finalizeAsaasCheckout({ orderId: "ord_1234" });

		expect(result).toMatchObject({
			ok: true,
			status: "succeeded",
			cardSaveAvailable: true,
			creditCardBrand: "VISA",
			creditCardLast4: "4242",
		});
	});

	it("nao oferece salvar cartao quando o pagamento nao foi por cartao", async () => {
		mocks.fetch.mockResolvedValue(
			new Response(JSON.stringify({ status: "succeeded", card_save_available: false }), {
				status: 200,
			}),
		);

		const result = await finalizeAsaasCheckout({ orderId: "ord_1234" });

		expect(result).toMatchObject({ ok: true, cardSaveAvailable: false });
	});
});

describe("saveCheckoutCard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("fetch", mocks.fetch);
	});

	it("retorna bandeira e final do cartao salvo, sem token", async () => {
		mocks.fetch.mockResolvedValue(
			new Response(JSON.stringify({ id: "card_1", brand: "VISA", last4: "4242" }), {
				status: 201,
			}),
		);

		const result = await saveCheckoutCard({ orderId: "ord_1234" });

		expect(result).toEqual({ ok: true, brand: "VISA", last4: "4242" });
	});

	it("propaga o erro quando o pedido ainda nao foi confirmado", async () => {
		mocks.fetch.mockResolvedValue(
			new Response(JSON.stringify({ detail: "Pedido ainda não foi confirmado" }), {
				status: 409,
			}),
		);

		const result = await saveCheckoutCard({ orderId: "ord_1234" });

		expect(result).toEqual({ error: "Pedido ainda não foi confirmado" });
	});
});
