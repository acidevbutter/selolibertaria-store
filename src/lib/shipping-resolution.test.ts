import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/env.mjs", () => ({
	env: {
		FASTAPI_API_URL: "http://fastapi.test",
		FASTAPI_INTERNAL_API_KEY: "internal",
	},
}));

import { resolveShippingQuotesForDestination, serializeMelhorEnvioSettingsForAdmin } from "@/lib/shipping";

describe("shipping FastAPI client", () => {
	beforeEach(() => vi.restoreAllMocks());

	it("sends destination and structured items to FastAPI", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(
				JSON.stringify({
					quotes: [
						{
							provider_code: "melhor-envio",
							provider_label: "Melhor Envio",
							service_code: "1",
							service_name: "PAC",
							amount: 1890,
							currency: "BRL",
							estimated_days: 6,
							quoted_at: "2026-08-24T00:00:00Z",
							method: "http",
						},
					],
					selected: {
						provider_code: "melhor-envio",
						provider_label: "Melhor Envio",
						service_code: "1",
						service_name: "PAC",
						amount: 1890,
						currency: "BRL",
						estimated_days: 6,
						quoted_at: "2026-08-24T00:00:00Z",
						method: "http",
					},
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			),
		);

		const result = await resolveShippingQuotesForDestination({
			destination: { country: "BR", postalCode: "01310-100" },
			subtotal: 5000,
			currency: "BRL",
			deliveryMethod: "new-address",
			items: [
				{
					productId: "book",
					variantId: "print",
					quantity: 2,
					price: 2500,
					productType: "book",
					format: "print",
				},
			],
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"http://fastapi.test/shipping/quote",
			expect.objectContaining({
				headers: expect.objectContaining({ "X-Internal-API-Key": "internal" }),
			}),
		);
		expect(result.selected?.amount).toBe(1890);
		expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
			destination: { country: "BR", postal_code: "01310-100" },
			items: [{ quantity: 2, product_type: "book", format: "print" }],
		});
	});

	it("does not expose a token in admin settings", () => {
		const result = serializeMelhorEnvioSettingsForAdmin({ envTokenStatus: "configured" });
		expect(result).toMatchObject({ envTokenStatus: "configured", oauthStatus: "coming-soon" });
		expect(result).not.toHaveProperty("accessToken");
	});
});
