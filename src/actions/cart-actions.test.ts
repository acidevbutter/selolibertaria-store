import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAuthMock = vi.fn();
const getCartIdMock = vi.fn();
const getCartCookieItemsMock = vi.fn();
const getCartCouponCodeMock = vi.fn();
const setCartIdMock = vi.fn();
const cookiesMock = vi.fn();

vi.mock("@/env.mjs", () => ({ env: { FASTAPI_API_URL: "http://fastapi.test" } }));
vi.mock("@/lib/api-auth", () => ({ requireAuth: () => requireAuthMock() }));
vi.mock("@/lib/authz", () => ({ canBuyOnSelolibertaria: () => true }));
vi.mock("@/lib/cart-cookies", () => ({
	clearCartId: vi.fn(),
	getCartCookieItems: () => getCartCookieItemsMock(),
	getCartCouponCode: () => getCartCouponCodeMock(),
	getCartId: () => getCartIdMock(),
	setCartId: (...args: unknown[]) => setCartIdMock(...args),
}));
vi.mock("next/headers", () => ({ cookies: () => cookiesMock() }));

const guestCart = {
	id: "00000000-0000-4000-8000-000000000001",
	coupon_code: null,
	items: [
		{
			product_id: "prod_123",
			variant_id: "variant_123",
			product_name: "Produto",
			variant_label: null,
			unit_amount: 4200,
			currency: "BRL",
			quantity: 1,
		},
	],
};

function fetchResponse(body: unknown, status = 200) {
	return new Response(body === null ? null : JSON.stringify(body), { status });
}

describe("cart actions", () => {
	beforeEach(() => {
		requireAuthMock.mockReset();
		getCartIdMock.mockReset();
		getCartCookieItemsMock.mockReset();
		getCartCouponCodeMock.mockReset();
		setCartIdMock.mockReset();
		cookiesMock.mockReset();
		vi.stubGlobal("fetch", vi.fn());
	});

	it("lê o carrinho convidado exclusivamente pelo FastAPI", async () => {
		requireAuthMock.mockResolvedValue({ error: "guest" });
		getCartIdMock.mockResolvedValue(guestCart.id);
		getCartCookieItemsMock.mockResolvedValue([]);
		cookiesMock.mockResolvedValue({ get: vi.fn() });
		vi.mocked(fetch).mockResolvedValue(fetchResponse(guestCart));

		const { getCartAction } = await import("@/actions/cart-actions");
		const result = await getCartAction();

		expect(fetch).toHaveBeenCalledWith(`http://fastapi.test/carts/guest/${guestCart.id}`, expect.anything());
		expect(result).toMatchObject({ id: guestCart.id, total: 4200 });
		expect(setCartIdMock).toHaveBeenCalledWith(
			guestCart.id,
			[{ productId: "prod_123", variantId: "variant_123", quantity: 1 }],
			null,
		);
	});

	it("envia a mutação autenticada do carrinho ao FastAPI", async () => {
		requireAuthMock.mockResolvedValue({ session: { role: "customer" } });
		cookiesMock.mockResolvedValue({ get: vi.fn().mockReturnValue({ value: "access-token" }) });
		vi.mocked(fetch).mockResolvedValue(fetchResponse(guestCart));

		const { addToCartAction } = await import("@/actions/cart-actions");
		const result = await addToCartAction("variant_123");

		expect(fetch).toHaveBeenCalledWith(
			"http://fastapi.test/carts/me/items",
			expect.objectContaining({ method: "POST", cache: "no-store" }),
		);
		expect(result).toMatchObject({ id: guestCart.id, items: [{ productId: "prod_123" }] });
	});
});
