"use server";

import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import { requireAuth } from "@/lib/api-auth";
import { canBuyOnSelolibertaria } from "@/lib/authz";
import { clearCartId, getCartId } from "@/lib/cart-cookies";

async function sessionToken() {
	return (await cookies()).get("session")?.value ?? null;
}

export async function finalizeCheckoutCleanup(): Promise<{ ok: true } | { error: string }> {
	try {
		const [auth, token, guestCartId] = await Promise.all([requireAuth(), sessionToken(), getCartId()]);
		if (!("error" in auth)) {
			if (!canBuyOnSelolibertaria(auth.session.role)) return { error: "Acesso negado" };
			if (token) {
				await fetch(`${env.FASTAPI_API_URL}/carts/me`, {
					method: "DELETE",
					headers: { authorization: `Bearer ${token}` },
					cache: "no-store",
				});
			}
		} else if (guestCartId) {
			await fetch(`${env.FASTAPI_API_URL}/carts/guest/${guestCartId}`, {
				method: "DELETE",
				cache: "no-store",
			});
		}
		await clearCartId();
		return { ok: true };
	} catch {
		return { error: "Falha ao limpar o carrinho" };
	}
}

export async function getPurchaseDetails(purchaseId: string) {
	if (!purchaseId) return { error: "ID do pedido ausente" } as const;
	const auth = await requireAuth();
	if ("error" in auth) return { error: "Não autorizado" } as const;
	if (!canBuyOnSelolibertaria(auth.session.role)) return { error: "Acesso negado" } as const;
	const token = await sessionToken();
	if (!token) return { error: "Não autorizado" } as const;
	try {
		const response = await fetch(`${env.FASTAPI_API_URL}/orders/me/${encodeURIComponent(purchaseId)}`, {
			headers: { authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (response.status === 404) return { error: "Pedido não encontrado" } as const;
		if (!response.ok) throw new Error("Order API unavailable");
		const order = (await response.json()) as {
			id: string;
			status: string;
			created_at: string;
			amount_total: number;
			currency: string;
			items: Array<{
				name: string | null;
				quantity: number;
				unit_amount: number | null;
				price_id: string | null;
				product_id: string | null;
			}>;
			fulfillment_status: "received" | "producing" | "shipped";
			tracking_number: string | null;
		};
		return {
			id: order.id,
			status: order.status,
			createdAt: order.created_at,
			amountTotal: order.amount_total,
			currency: order.currency,
			items: order.items.map((item) => ({
				name: item.name,
				quantity: item.quantity,
				unitAmount: item.unit_amount,
				priceId: item.price_id,
				productId: item.product_id,
				image: null,
			})),
			fulfillment: { status: order.fulfillment_status, trackingNumber: order.tracking_number },
		};
	} catch {
		return { error: "Falha ao carregar o pedido" } as const;
	}
}
