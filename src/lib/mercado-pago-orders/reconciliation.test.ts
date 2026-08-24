import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env.mjs", () => ({
	env: { FASTAPI_API_URL: "http://fastapi.test", FASTAPI_INTERNAL_API_KEY: "test-key" },
}));

import { reconcilePendingMercadoPagoOrders } from "@/lib/mercado-pago-orders/reconciliation";

describe("reconcilePendingMercadoPagoOrders", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("delegates pending checkout selection and reconciliation to FastAPI", async () => {
		const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
			new Response(
				JSON.stringify({
					checked: 1,
					results: [
						{
							order_id: "ord_pending",
							provider_order_id: "mp_pending",
							outcome: "reconciled",
							status: "succeeded",
						},
					],
				}),
				{ status: 200 },
			),
		);

		await expect(reconcilePendingMercadoPagoOrders({ limit: 10 })).resolves.toMatchObject({
			checked: 1,
			results: [{ order_id: "ord_pending", outcome: "reconciled" }],
		});
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("/checkout/reconcile"),
			expect.objectContaining({ method: "POST" }),
		);
	});

	it("preserves a still-pending result from FastAPI", async () => {
		vi.spyOn(global, "fetch").mockResolvedValue(
			new Response(
				JSON.stringify({
					checked: 1,
					results: [
						{
							order_id: "ord_pending",
							provider_order_id: "mp_pending",
							outcome: "still_pending",
							status: "processing",
						},
					],
				}),
				{ status: 200 },
			),
		);

		await expect(reconcilePendingMercadoPagoOrders()).resolves.toMatchObject({
			results: [{ outcome: "still_pending", status: "processing" }],
		});
	});

	it("surfaces FastAPI reconciliation errors", async () => {
		vi.spyOn(global, "fetch").mockResolvedValue(
			new Response(JSON.stringify({ detail: "Chave interna inválida" }), { status: 401 }),
		);

		await expect(reconcilePendingMercadoPagoOrders()).rejects.toThrow("Chave interna inválida");
	});
});
