import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDb, recordMercadoPagoCheckout } = vi.hoisted(() => ({
	getDb: vi.fn(),
	recordMercadoPagoCheckout: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/mongodb", () => ({ getDb }));
vi.mock("@/actions/mercado-pago-order-actions", () => ({ recordMercadoPagoCheckout }));

import { reconcilePendingMercadoPagoOrders } from "@/lib/mercado-pago-orders/reconciliation";

type Attempt = {
	providerOrderId: string;
	orderId?: string;
	attempts?: number;
	nextAttemptAt?: Date | null;
	status?: string;
	lastError?: string | null;
	alert?: boolean;
};

function createDb(
	drafts: Array<{ orderId: string; status: string; mercadoPagoOrderId?: string }>,
	attempts = new Map<string, Attempt>(),
) {
	return {
		collection(name: string) {
			if (name === "orderDrafts") {
				return {
					find(query: { status?: { $in?: string[] } }) {
						const selected = query.status?.$in
							? drafts.filter((draft) => query.status?.$in?.includes(draft.status))
							: drafts;
						return { sort: () => ({ limit: () => ({ toArray: async () => selected }) }) };
					},
				};
			}
			return {
				findOne: async ({ providerOrderId }: { providerOrderId: string }) =>
					attempts.get(providerOrderId) ?? null,
				updateOne: async (
					{ providerOrderId }: { providerOrderId: string },
					update: { $set?: Record<string, unknown>; $setOnInsert?: Record<string, unknown> },
				) => {
					const current = attempts.get(providerOrderId) ?? { providerOrderId };
					attempts.set(providerOrderId, {
						...current,
						...(current.providerOrderId ? {} : update.$setOnInsert),
						...update.$set,
					});
					return { acknowledged: true };
				},
			};
		},
	};
}

describe("reconcilePendingMercadoPagoOrders", () => {
	beforeEach(() => {
		getDb.mockReset();
		recordMercadoPagoCheckout.mockReset();
	});

	it("recovers a pending order through the shared checkout processor and ignores final drafts", async () => {
		getDb.mockResolvedValue(
			createDb([
				{ orderId: "ord_pending", status: "pending", mercadoPagoOrderId: "mp_pending" },
				{ orderId: "ord_paid", status: "succeeded", mercadoPagoOrderId: "mp_paid" },
			]),
		);
		recordMercadoPagoCheckout.mockResolvedValue({ ok: true, status: "succeeded" });

		await expect(reconcilePendingMercadoPagoOrders()).resolves.toMatchObject({
			checked: 1,
			results: [{ orderId: "ord_pending", providerOrderId: "mp_pending", outcome: "reconciled" }],
		});
		expect(recordMercadoPagoCheckout).toHaveBeenCalledTimes(1);
		expect(recordMercadoPagoCheckout).toHaveBeenCalledWith({
			mercadoPagoOrderId: "mp_pending",
			createSession: false,
		});
	});

	it("does not reprocess a still-pending order before its next retry window", async () => {
		const attempts = new Map<string, Attempt>();
		getDb.mockResolvedValue(
			createDb(
				[{ orderId: "ord_pending", status: "processing", mercadoPagoOrderId: "mp_pending" }],
				attempts,
			),
		);
		recordMercadoPagoCheckout.mockResolvedValue({ ok: true, status: "processing" });

		await reconcilePendingMercadoPagoOrders();
		await expect(reconcilePendingMercadoPagoOrders()).resolves.toMatchObject({
			results: [{ outcome: "still_pending" }],
		});
		expect(recordMercadoPagoCheckout).toHaveBeenCalledTimes(1);
	});

	it("records an alert after the final failed attempt", async () => {
		const attempts = new Map<string, Attempt>([
			["mp_mismatch", { providerOrderId: "mp_mismatch", attempts: 4 }],
		]);
		getDb.mockResolvedValue(
			createDb([{ orderId: "ord_mismatch", status: "pending", mercadoPagoOrderId: "mp_mismatch" }], attempts),
		);
		recordMercadoPagoCheckout.mockResolvedValue({ error: "A order externa diverge do pedido interno." });

		await expect(reconcilePendingMercadoPagoOrders()).resolves.toMatchObject({
			results: [{ outcome: "alerted", error: "A order externa diverge do pedido interno." }],
		});
		expect(attempts.get("mp_mismatch")).toMatchObject({
			attempts: 5,
			status: "alerted",
			alert: true,
			nextAttemptAt: null,
		});
	});
});
