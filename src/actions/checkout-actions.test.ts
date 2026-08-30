import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/env.mjs", () => ({
	env: {
		FASTAPI_API_URL: "http://fastapi.test",
		FASTAPI_INTERNAL_API_KEY: "internal",
		NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY: "public-key",
	},
}));
vi.mock("@/lib/api-auth", () => ({
	requireAuth: vi.fn().mockResolvedValue({ error: new Response(null, { status: 401 }) }),
}));
vi.mock("@/lib/cart-cookies", () => ({ getCartId: vi.fn().mockResolvedValue("cart-cookie") }));
vi.mock("next/headers", () => ({ cookies: vi.fn().mockResolvedValue({ get: () => undefined }) }));

describe("continuePendingMercadoPagoPixCheckout", () => {
	beforeEach(() => {
		vi.resetModules();
		fetchMock.mockReset();
		vi.stubGlobal("fetch", fetchMock);
	});

	it("finaliza o acompanhamento no FastAPI sem aprovar o Pix localmente", async () => {
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ status: "processing", setup_password_required: true }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
		);

		const { continuePendingMercadoPagoPixCheckout } = await import("@/actions/checkout-actions");
		await expect(continuePendingMercadoPagoPixCheckout({ orderId: "ord_123" })).resolves.toEqual({
			ok: true,
			redirectUrl: "/user?section=purchases&order=ord_123&pendingPayment=1&setupPassword=1",
		});
		expect(fetchMock).toHaveBeenCalledWith(
			"http://fastapi.test/checkout/intents/ord_123/finalize",
			expect.objectContaining({
				method: "POST",
				headers: expect.any(Headers),
			}),
		);
	});
});
