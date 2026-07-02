import { beforeEach, describe, expect, it, vi } from "vitest";

const getCartActionMock = vi.fn();

vi.mock("@/actions/cart-actions", () => ({
	getCartAction: () => getCartActionMock(),
}));

import { GET } from "@/app/api/cart/route";

describe("/api/cart", () => {
	beforeEach(() => {
		getCartActionMock.mockReset();
	});

	it("responde sem cache com o carrinho atual", async () => {
		const cart = {
			id: "guest_123",
			items: [{ id: "item_1", productId: "prod_123", variantId: "price_123", quantity: 1, price: 4200 }],
			total: 4200,
			currency: "BRL",
		};

		getCartActionMock.mockResolvedValue(cart);

		const response = await GET();

		expect(response.status).toBe(200);
		expect(response.headers.get("Cache-Control")).toContain("no-store");
		expect(await response.json()).toEqual({ cart });
	});
});
