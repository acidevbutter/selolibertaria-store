import { beforeEach, describe, expect, it, vi } from "vitest";

type CookieOptions = {
	httpOnly?: boolean;
	maxAge?: number;
	path?: string;
	sameSite?: "lax" | "strict" | "none";
	secure?: boolean;
};

const cookieJar = new Map<string, { value: string; options?: CookieOptions }>();

vi.mock("next/headers", () => ({
	cookies: async () => ({
		get: (name: string) => {
			const entry = cookieJar.get(name);
			return entry ? { name, value: entry.value } : undefined;
		},
		set: (name: string, value: string, options?: CookieOptions) => {
			cookieJar.set(name, { value, options });
		},
	}),
	headers: async () => ({
		get: () => null,
	}),
}));

describe("cart cookies", () => {
	beforeEach(() => {
		cookieJar.clear();
		vi.resetModules();
	});

	it("persiste e relê o snapshot convidado com itens, path e maxAge corretos", async () => {
		const { CART_COOKIE, getCartCookiePayload, parseCartCookie, setCartId } = await import(
			"@/lib/cart-cookies"
		);

		await setCartId(
			"guest_123",
			[
				{
					productId: "prod_123",
					variantId: "price_123",
					quantity: 1,
				},
			],
			null,
		);

		const stored = cookieJar.get(CART_COOKIE);

		expect(stored).toBeDefined();
		expect(stored?.options).toMatchObject({
			httpOnly: true,
			maxAge: 60 * 60 * 24 * 30,
			path: "/",
			sameSite: "lax",
			secure: false,
		});
		expect(parseCartCookie(stored?.value)).toEqual({
			id: "guest_123",
			items: [
				{
					productId: "prod_123",
					variantId: "price_123",
					quantity: 1,
				},
			],
			couponCode: null,
		});
		expect(await getCartCookiePayload()).toEqual({
			id: "guest_123",
			items: [
				{
					productId: "prod_123",
					variantId: "price_123",
					quantity: 1,
				},
			],
			couponCode: null,
		});
	});
});
