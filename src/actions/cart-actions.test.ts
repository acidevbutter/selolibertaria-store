import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Cart } from "@/lib/commerce-types";

const requireAuthMock = vi.fn();
const getCartIdMock = vi.fn();
const getCartCookieItemsMock = vi.fn();
const getCartCouponCodeMock = vi.fn();
const buildPricedCartPayloadMock = vi.fn();
const variantResolveMock = vi.fn();
const getDbMock = vi.fn();

vi.mock("@/lib/api-auth", () => ({
	requireAuth: () => requireAuthMock(),
}));

vi.mock("@/lib/authz", () => ({
	canBuyOnSelolibertaria: () => true,
}));

vi.mock("@/lib/cart-cookies", () => ({
	clearCartId: vi.fn(),
	getCartCookieItems: () => getCartCookieItemsMock(),
	getCartCouponCode: () => getCartCouponCodeMock(),
	getCartId: () => getCartIdMock(),
	persistCartSnapshot: vi.fn(),
	setCartId: vi.fn(),
}));

vi.mock("@/lib/cart-pricing", () => ({
	buildPricedCartPayload: (...args: unknown[]) => buildPricedCartPayloadMock(...args),
}));

vi.mock("@/lib/commerce", () => ({
	commerce: {
		cart: {
			clear: vi.fn(),
			get: vi.fn(),
		},
		variant: {
			resolve: (...args: unknown[]) => variantResolveMock(...args),
		},
	},
}));

vi.mock("@/lib/mongodb", () => ({
	getDb: () => getDbMock(),
}));

vi.mock("@/lib/promotions", () => ({
	normalizeCouponCode: (value: string) => value,
}));

describe("getCartAction", () => {
	beforeEach(() => {
		requireAuthMock.mockReset();
		getCartIdMock.mockReset();
		getCartCookieItemsMock.mockReset();
		getCartCouponCodeMock.mockReset();
		buildPricedCartPayloadMock.mockReset();
		variantResolveMock.mockReset();
		getDbMock.mockReset();
		vi.resetModules();
	});

	it("lê o snapshot convidado salvo no cookie e monta o carrinho usado por /api/cart", async () => {
		const guestCart: Cart = {
			id: "guest_123",
			items: [
				{
					id: "item_1",
					productId: "prod_123",
					variantId: "price_123",
					quantity: 1,
					price: 4200,
					product: {
						id: "prod_123",
						name: "Produto",
						images: ["/capa.png"],
						summary: "Resumo",
					},
				},
			],
			total: 4200,
			subtotal: 4200,
			discountTotal: 0,
			currency: "BRL",
			couponCode: null,
			couponError: null,
			appliedPromotions: [],
		};

		requireAuthMock.mockResolvedValue({ error: "guest" });
		getCartIdMock.mockResolvedValue("guest_123");
		getCartCookieItemsMock.mockResolvedValue([
			{
				productId: "prod_123",
				variantId: "price_123",
				quantity: 1,
			},
		]);
		getCartCouponCodeMock.mockResolvedValue(null);
		buildPricedCartPayloadMock.mockResolvedValue({ cart: guestCart });

		const { getCartAction } = await import("@/actions/cart-actions");
		const result = await getCartAction();

		expect(result).toEqual(guestCart);
		expect(buildPricedCartPayloadMock).toHaveBeenCalledWith({
			cartId: "guest_123",
			minimalItems: [
				{
					productId: "prod_123",
					variantId: "price_123",
					quantity: 1,
				},
			],
			couponCode: null,
			userId: undefined,
		});
	});

	it("preserva o ID do produto ao adicionar uma variante ao carrinho autenticado", async () => {
		const findOneMock = vi.fn().mockResolvedValue({ cart: { items: [] } });
		const updateOneMock = vi.fn().mockResolvedValue({ acknowledged: true });
		getDbMock.mockResolvedValue({
			collection: () => ({ findOne: findOneMock, updateOne: updateOneMock }),
		});
		requireAuthMock.mockResolvedValue({ session: { role: "customer", sub: "64b64c5d10b8a7e4c7b8d123" } });
		variantResolveMock.mockResolvedValue({
			product: { id: "prod_123" },
			variant: { id: "price_123" },
		});
		buildPricedCartPayloadMock.mockResolvedValue({ cart: { id: "user-cart" } });

		const { addToCartAction } = await import("@/actions/cart-actions");
		await addToCartAction("price_123");

		expect(updateOneMock).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				$set: expect.objectContaining({
					cart: expect.objectContaining({
						items: [{ productId: "prod_123", variantId: "price_123", quantity: 1 }],
					}),
				}),
			}),
		);
	});
});
