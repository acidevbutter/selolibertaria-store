import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/env.mjs", () => ({
	env: { FASTAPI_API_URL: "http://fastapi.test", FASTAPI_INTERNAL_API_KEY: "internal" },
}));
vi.mock("server-only", () => ({}));

describe("resolveCheckoutUserForDraft", () => {
	afterEach(() => vi.restoreAllMocks());

	it("resolves the checkout customer through FastAPI", async () => {
		const fetchMock = vi
			.spyOn(global, "fetch")
			.mockResolvedValue(
				new Response(JSON.stringify({ user: { id: "user-1" }, created: true }), { status: 200 }),
			);
		const { resolveCheckoutUserForDraft } = await import("@/lib/checkout-customer");
		await expect(
			resolveCheckoutUserForDraft({
				orderId: "ord_123",
				buyer: {
					fullName: "Nova Leitora",
					email: "nova@example.com",
					cpf: "39053344705",
					phone: "11999999999",
				},
			}),
		).resolves.toEqual({ userId: "user-1", created: true });
		expect(fetchMock).toHaveBeenCalledWith(
			"http://fastapi.test/auth/internal/checkout-user",
			expect.objectContaining({ method: "POST" }),
		);
	});
});
