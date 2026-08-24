import "server-only";

import { env } from "@/env.mjs";

export type ReconciliationOutcome =
	| "reconciled"
	| "still_pending"
	| "skipped_terminal"
	| "failed"
	| "alerted";

type ReconcileResponse = {
	checked: number;
	results: Array<{
		order_id: string;
		provider_order_id: string;
		outcome: Exclude<ReconciliationOutcome, "alerted">;
		status?: string | null;
		error?: string | null;
	}>;
};

export async function reconcilePendingMercadoPagoOrders(input: { limit?: number; orderId?: string } = {}) {
	const response = await fetch(`${env.FASTAPI_API_URL}/checkout/reconcile`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"x-internal-api-key": env.FASTAPI_INTERNAL_API_KEY,
		},
		body: JSON.stringify({ order_id: input.orderId, limit: input.limit ?? 25 }),
		cache: "no-store",
	});
	const payload = (await response.json().catch(() => null)) as ReconcileResponse | { detail?: string } | null;
	if (!response.ok) {
		throw new Error(
			payload && typeof payload === "object" && "detail" in payload && payload.detail
				? payload.detail
				: "Falha na reconciliação das orders Mercado Pago",
		);
	}
	return payload as ReconcileResponse;
}
