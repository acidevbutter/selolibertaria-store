"use server";

import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import { requireAuth } from "@/lib/api-auth";
import { getCartId } from "@/lib/cart-cookies";

type ReconcileResponse = {
	checked: number;
	results: Array<{
		order_id: string;
		provider_order_id: string;
		outcome: "reconciled" | "still_pending" | "failed" | "skipped_terminal";
		status?: string | null;
		error?: string | null;
	}>;
};

async function ownerKey() {
	const auth = await requireAuth();
	if (!("error" in auth)) return `user:${auth.session.sub}`;
	return `guest:${(await getCartId()) || "cookie-cart"}`;
}

async function reconcile(input: { orderId?: string | null; paymentId?: string | null }) {
	const response = await fetch(`${env.FASTAPI_API_URL}/checkout/reconcile`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"x-internal-api-key": env.FASTAPI_INTERNAL_API_KEY,
			...((await cookies()).get("session")?.value
				? { authorization: `Bearer ${(await cookies()).get("session")!.value}` }
				: {}),
		},
		body: JSON.stringify({
			order_id: input.orderId || undefined,
			provider_order_id: input.paymentId || undefined,
			limit: 1,
		}),
		cache: "no-store",
	});
	const payload = (await response.json().catch(() => null)) as ReconcileResponse | { detail?: string } | null;
	if (!response.ok) {
		return {
			error:
				payload && typeof payload === "object" && "detail" in payload && payload.detail
					? payload.detail
					: "Falha na reconciliação do pedido",
		};
	}
	const item = (payload as ReconcileResponse).results[0];
	if (!item) return { error: "Pedido Mercado Pago não encontrado" };
	if (item.outcome === "failed")
		return { error: item.error || "Falha na reconciliação", status: item.status };
	return {
		ok: true as const,
		status: item.status || (item.outcome === "still_pending" ? "processing" : "succeeded"),
		cartCleared:
			item.outcome === "reconciled" || (item.outcome === "skipped_terminal" && item.status === "succeeded"),
		setupPasswordRequired: false,
	};
}

export async function recordMercadoPagoCheckout(input: {
	paymentId?: string | null;
	mercadoPagoOrderId?: string | null;
	orderId?: string | null;
	createSession?: boolean;
}) {
	return reconcile({
		orderId: input.orderId,
		paymentId: input.mercadoPagoOrderId || input.paymentId,
	});
}

export { ownerKey as getCheckoutOwnerKey };
