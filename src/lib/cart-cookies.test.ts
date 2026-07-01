import { describe, expect, it } from "vitest";
import { parseCartCookie } from "@/lib/cart-cookies";

describe("parseCartCookie", () => {
	it("lê payload JSON codificado na string do cookie", () => {
		const raw = encodeURIComponent(
			JSON.stringify({
				id: "cart_123",
				items: [{ productId: "prod_1", variantId: "price_1", quantity: 2 }],
				couponCode: "PROMO",
			}),
		);

		expect(parseCartCookie(raw)).toEqual({
			id: "cart_123",
			items: [{ productId: "prod_1", variantId: "price_1", quantity: 2 }],
			couponCode: "PROMO",
		});
	});

	it("mantém compatibilidade com cookie legado simples", () => {
		expect(parseCartCookie("legacy_cart_id")).toEqual({ id: "legacy_cart_id" });
	});
});
