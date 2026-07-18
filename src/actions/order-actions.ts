"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/api-auth";
import { canBuyOnSelolibertaria } from "@/lib/authz";
import { clearCartId, getCartId } from "@/lib/cart-cookies";
import { commerce } from "@/lib/commerce";
import { getDb } from "@/lib/mongodb";
import { matchesOrderIdentifier } from "@/lib/order-identity";

interface PurchaseItemDoc {
	name?: string | null;
	quantity?: number;
	unitAmount?: number | null;
	priceId?: string | null;
	productId?: string | null;
	image?: string | null;
}

interface PurchaseDoc {
	id: string;
	status: string;
	createdAt: Date | string;
	amountTotal: number;
	currency: string;
	items?: PurchaseItemDoc[];
	fulfillment?: {
		status?: "received" | "producing" | "shipped";
		trackingNumber?: string | null;
	};
	relatedIds?: { mercadoPagoPaymentId?: string };
}

export async function finalizeCheckoutCleanup(): Promise<{ ok: true } | { error: string }> {
	const auth = await requireAuth();
	try {
		if (!("error" in auth)) {
			if (!canBuyOnSelolibertaria(auth.session.role)) return { error: "Acesso negado" };
			await (await getDb())
				.collection("users")
				.updateOne(
					{ _id: new ObjectId(auth.session.sub as string) },
					{ $unset: { cart: "" }, $set: { updatedAt: new Date() } },
				);
		}
		const cartId = await getCartId();
		if (cartId) {
			try {
				commerce.cart.clear({ cartId });
			} catch {
				// Best effort only.
			}
			await clearCartId();
		}
		return { ok: true };
	} catch (error) {
		console.error("[finalizeCheckoutCleanup]", error);
		return { error: "Falha ao limpar o carrinho" };
	}
}

export async function getPurchaseDetails(purchaseId: string) {
	if (!purchaseId) return { error: "ID do pedido ausente" } as const;
	const auth = await requireAuth();
	if ("error" in auth) return { error: "Não autorizado" } as const;
	if (!canBuyOnSelolibertaria(auth.session.role)) return { error: "Acesso negado" } as const;

	try {
		const userDoc = await (await getDb()).collection<{ purchases?: PurchaseDoc[] }>("users").findOne(
			{
				_id: new ObjectId(auth.session.sub as string),
				$or: [{ "purchases.id": purchaseId }, { "purchases.relatedIds.mercadoPagoPaymentId": purchaseId }],
			},
			{ projection: { purchases: 1 } },
		);
		const purchase = userDoc?.purchases?.find((entry) => matchesOrderIdentifier(entry, purchaseId));
		if (!purchase) return { error: "Pedido não encontrado" } as const;
		return {
			id: purchase.id,
			status: purchase.status,
			createdAt: purchase.createdAt,
			amountTotal: purchase.amountTotal,
			currency: purchase.currency,
			items: (purchase.items ?? []).map((item) => ({
				name: item.name ?? null,
				quantity: item.quantity ?? 0,
				unitAmount: item.unitAmount ?? null,
				priceId: item.priceId ?? null,
				productId: item.productId ?? null,
				image: item.image ?? null,
			})),
			fulfillment: purchase.fulfillment,
		};
	} catch (error) {
		console.error("[getPurchaseDetails]", error);
		return { error: "Falha ao carregar o pedido" } as const;
	}
}
