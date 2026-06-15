"use server";

import { ObjectId } from "mongodb";
import Stripe from "stripe";
import { env } from "@/env.mjs";
import { requireAuth } from "@/lib/api-auth";
import { canBuyOnSelolibertaria } from "@/lib/authz";
import { clearCartId, getCartId } from "@/lib/cart-cookies";
import type { CheckoutSnapshotItem } from "@/lib/checkout/cart-snapshot";
import { commerce } from "@/lib/commerce-stripe";
import type { UserCart } from "@/lib/mongodb";
import { getDb } from "@/lib/mongodb";
import { matchesOrderIdentifier } from "@/lib/order-identity";
import { ensureOrderReceivedEmail } from "@/lib/order-received";
import { getClientVisiblePaymentIntentStatus } from "@/lib/payment-intent-status";
import {
	isFinalizedPaymentStatus,
	isOrderReceivedEligibleStatus,
	shouldPreserveAuthoritativePurchaseStatus,
} from "@/lib/payment-status";

/**
 * Clears the cart stored on the user document after the checkout is finalized.
 * Also removes the legacy in-memory/cookie cart, if it exists, to keep things consistent.
 */
export async function finalizeCheckoutCleanup(): Promise<{ ok: true } | { error: string }> {
	const auth = await requireAuth();
	if ("error" in auth) return { error: "Não autorizado" };
	if (!canBuyOnSelolibertaria(auth.session.role)) return { error: "Acesso negado" };

	const userId = auth.session.sub as string;

	try {
		const db = await getDb();

		await db
			.collection("users")
			.updateOne({ _id: new ObjectId(userId) }, { $unset: { cart: "" }, $set: { updatedAt: new Date() } });

		const cartId = await getCartId();

		if (cartId) {
			try {
				await commerce.cart.clear({ cartId });
			} catch (e) {}
			await clearCartId();
		}

		return { ok: true };
	} catch (err) {
		console.error("[finalizeCheckoutCleanup]", err);
		return { error: "Falha ao limpar o carrinho" };
	}
}

/**
 * Saves a purchase on the user document using the session_id returned on success_url.
 * This doesn't replace the webhook (source of truth), but it allows immediate recording.
 */
export async function recordSuccessfulCheckout(sessionId: string): Promise<{ ok: true } | { error: string }> {
	if (!sessionId || !sessionId.startsWith("cs_")) return { error: "ID de sessão inválido" };
	if (!env.STRIPE_SECRET_KEY) return { error: "Stripe não configurado" };

	const auth = await requireAuth();
	let userId: string | null = null;

	if (!("error" in auth)) {
		if (!canBuyOnSelolibertaria(auth.session.role)) return { error: "Acesso negado" };
		userId = auth.session.sub as string;
	}

	try {
		const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: undefined });
		const session = await stripe.checkout.sessions.retrieve(sessionId, {
			expand: ["line_items.data.price.product"],
		});

		if (session.metadata?.userId) {
			const metaUserId = String(session.metadata.userId);
			if (userId && metaUserId !== userId) return { error: "A sessão não pertence a esta pessoa usuária" };
			if (!userId) userId = metaUserId;
		}

		if (!userId) return { error: "Não autorizado" };

		const items = (session.line_items?.data || []).map((li) => {
			const prod = typeof li.price?.product === "object" ? (li.price?.product as Stripe.Product) : undefined;
			return {
				priceId: li.price?.id || null,
				productId: prod?.id || null,
				name: prod?.name || null,
				quantity: li.quantity || 0,
				unitAmount: li.price?.unit_amount ?? null,
			};
		});
		const userObjectId = new ObjectId(userId);
		const purchase = {
			id: session.id,
			createdAt: new Date(),
			status: session.payment_status || session.status || "unknown",
			amountTotal: session.amount_total || 0,
			currency: (session.currency || env.STRIPE_CURRENCY || "USD").toUpperCase(),
			items,
			invoiceId: (session.invoice as string) || null,
			paymentIntentId: (session.payment_intent as string) || null,
		};
		const db = await getDb();
		const usersCol = db.collection("users");
		const userDoc = await usersCol.findOne<{ cart?: UserCart }>(
			{ _id: userObjectId },
			{ projection: { cart: 1 } },
		);
		const cartSnapshot: UserCart | null = userDoc?.cart
			? { items: userDoc.cart.items.map((item) => ({ ...item })) }
			: null;
		const userUpdateCol = usersCol as unknown as {
			updateOne: (filter: unknown, update: unknown) => Promise<unknown>;
		};

		// Idempotência: não insere se já existir purchase com mesmo id
		const existing = await usersCol.findOne(
			{ _id: userObjectId, "purchases.id": session.id },
			{ projection: { _id: 1 } },
		);
		if (!existing) {
			await userUpdateCol.updateOne(
				{ _id: userObjectId },
				{
					$push: { purchases: { ...purchase, cart: cartSnapshot } },
					$set: { updatedAt: new Date() },
					$unset: { cart: "" },
				},
			);
		}
		return { ok: true };
	} catch (e) {
		console.error("[recordSuccessfulCheckout]", e);
		return { error: "Falha ao registrar a compra" };
	}
}

interface OrderDraftDoc {
	orderId?: string;
	userId: string;
	paymentIntentId: string;
	status: string;
	subtotal?: number;
	discountTotal?: number;
	amountTotal: number;
	currency: string;
	couponCode?: string | null;
	couponPromotionId?: string | null;
	couponCodeId?: string | null;
	items?: CheckoutSnapshotItem[];
}

interface BrowserSyncPurchaseDoc {
	id: string;
	status: string;
	relatedIds?: {
		paymentIntentId?: string;
		sessionId?: string;
	};
}

export async function recordPaymentIntentCheckout(input: {
	paymentIntentId?: string | null;
	orderId?: string | null;
}): Promise<{ ok: true; status: string; cartCleared: boolean } | { error: string; status?: string }> {
	if (!env.STRIPE_SECRET_KEY) return { error: "Stripe não configurado" };

	const auth = await requireAuth();
	if ("error" in auth) return { error: "Não autorizado" };
	if (!canBuyOnSelolibertaria(auth.session.role)) return { error: "Acesso negado" };

	const userId = auth.session.sub as string;

	try {
		const db = await getDb();
		const paymentIntentIdFromInput =
			typeof input.paymentIntentId === "string" && input.paymentIntentId.startsWith("pi_")
				? input.paymentIntentId
				: null;
		const orderIdFromInput =
			typeof input.orderId === "string" && input.orderId.startsWith("ord_") ? input.orderId : null;
		const draftByOrder = orderIdFromInput
			? await db.collection<OrderDraftDoc>("orderDrafts").findOne({ orderId: orderIdFromInput, userId })
			: null;
		const resolvedPaymentIntentId = paymentIntentIdFromInput || draftByOrder?.paymentIntentId || null;

		if (!resolvedPaymentIntentId || !resolvedPaymentIntentId.startsWith("pi_")) {
			return { error: "ID de intenção de pagamento inválido" };
		}

		const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: undefined });
		const paymentIntent = await stripe.paymentIntents.retrieve(resolvedPaymentIntentId, {
			expand: ["latest_charge"],
		});

		if (paymentIntent.metadata?.userId && paymentIntent.metadata.userId !== userId) {
			return { error: "A intenção de pagamento não pertence a esta pessoa usuária" };
		}

		const usersCol = db.collection("users");
		const userUpdateCol = usersCol as unknown as {
			updateOne: (filter: unknown, update: unknown) => Promise<{ matchedCount?: number }>;
		};
		const draft =
			draftByOrder ||
			(await db
				.collection<OrderDraftDoc>("orderDrafts")
				.findOne({ paymentIntentId: resolvedPaymentIntentId }));
		const userDoc = await usersCol.findOne<{ purchases?: BrowserSyncPurchaseDoc[] }>(
			{ _id: new ObjectId(userId) },
			{ projection: { purchases: 1 } },
		);

		if (draft?.userId && draft.userId !== userId) {
			return { error: "A intenção de pagamento não pertence a esta pessoa usuária" };
		}

		const status = paymentIntent.status;
		const clientVisibleStatus = getClientVisiblePaymentIntentStatus(status);
		const orderId = draft?.orderId || paymentIntent.metadata?.orderId || paymentIntent.id;
		const existingPurchase = userDoc?.purchases?.find(
			(purchase) =>
				matchesOrderIdentifier(purchase, orderId) || matchesOrderIdentifier(purchase, paymentIntent.id),
		);
		const existingAuthoritativeStatus = shouldPreserveAuthoritativePurchaseStatus(existingPurchase?.status)
			? existingPurchase?.status
			: undefined;
		const draftAuthoritativeStatus = shouldPreserveAuthoritativePurchaseStatus(draft?.status)
			? draft?.status
			: undefined;
		const authoritativeStatus =
			existingAuthoritativeStatus || draftAuthoritativeStatus || clientVisibleStatus;

		await db.collection("orderDrafts").updateOne(
			{ paymentIntentId: resolvedPaymentIntentId },
			{
				$set: {
					status: authoritativeStatus,
					updatedAt: new Date(),
				},
			},
		);

		if (status !== "succeeded" && status !== "processing") {
			return { error: "O pagamento ainda não foi concluído", status };
		}

		const items = (draft?.items || []).map((item) => ({
			name: item.name,
			quantity: item.quantity,
			unitAmount: item.unitAmount,
			priceId: item.priceId,
			productId: item.productId,
			image: item.image,
		}));
		const chargeId =
			typeof paymentIntent.latest_charge === "object" && paymentIntent.latest_charge
				? paymentIntent.latest_charge.id
				: typeof paymentIntent.latest_charge === "string"
					? paymentIntent.latest_charge
					: null;
		const eventId = `browser-sync:${paymentIntent.id}:${status}`;
		const relatedIds = {
			paymentIntentId: paymentIntent.id,
			...(chargeId ? { chargeIds: [chargeId] } : {}),
		};

		const updateExisting = await userUpdateCol.updateOne(
			{
				_id: new ObjectId(userId),
				$or: [{ "purchases.id": orderId }, { "purchases.relatedIds.paymentIntentId": paymentIntent.id }],
			},
			{
				$set: {
					"purchases.$.status": authoritativeStatus,
					"purchases.$.amountTotal": paymentIntent.amount,
					"purchases.$.currency": paymentIntent.currency.toUpperCase(),
					"purchases.$.items": items,
					"purchases.$.kind": "payment_intent",
					"purchases.$.paymentIntentId": paymentIntent.id,
					...(draft
						? {
								"purchases.$.pricing": {
									subtotal: draft.subtotal,
									discountTotal: draft.discountTotal,
									finalSubtotal: draft.amountTotal,
									couponCode: draft.couponCode ?? null,
									couponPromotionId: draft.couponPromotionId ?? null,
									couponCodeId: draft.couponCodeId ?? null,
								},
							}
						: {}),
					"purchases.$.relatedIds": relatedIds,
				},
				$addToSet: {
					"purchases.$.events": {
						eventId,
						type: "browser.payment_intent.sync",
						status: authoritativeStatus,
						createdAt: new Date(),
					},
				},
			},
		);

		if (updateExisting.matchedCount === 0) {
			await userUpdateCol.updateOne(
				{ _id: new ObjectId(userId), "purchases.id": { $ne: orderId } },
				{
					$push: {
						purchases: {
							id: orderId,
							createdAt: new Date(),
							status: authoritativeStatus,
							amountTotal: paymentIntent.amount,
							currency: paymentIntent.currency.toUpperCase(),
							items,
							kind: "payment_intent",
							paymentIntentId: paymentIntent.id,
							...(draft
								? {
										pricing: {
											subtotal: draft.subtotal,
											discountTotal: draft.discountTotal,
											finalSubtotal: draft.amountTotal,
											couponCode: draft.couponCode ?? null,
											couponPromotionId: draft.couponPromotionId ?? null,
											couponCodeId: draft.couponCodeId ?? null,
										},
									}
								: {}),
							relatedIds,
							fulfillment: { status: "received" as const },
							events: [
								{
									eventId,
									type: "browser.payment_intent.sync",
									status: authoritativeStatus,
									createdAt: new Date(),
								},
							],
						},
					},
					$set: { updatedAt: new Date() },
				},
			);
		}

		if (isOrderReceivedEligibleStatus(authoritativeStatus)) {
			await ensureOrderReceivedEmail(userId, orderId);
		}

		return {
			ok: true,
			status: authoritativeStatus,
			cartCleared: isFinalizedPaymentStatus(authoritativeStatus),
		};
	} catch (error) {
		console.error("[recordPaymentIntentCheckout]", error);
		return { error: "Falha ao registrar o pagamento" };
	}
}

export async function getPurchaseDetails(purchaseId: string): Promise<
	| { error: string }
	| {
			id: string;
			status: string;
			createdAt: Date | string;
			amountTotal: number;
			currency: string;
			items: Array<{
				name: string | null;
				quantity: number;
				unitAmount: number | null;
				priceId: string | null;
				productId: string | null;
				image: string | null;
			}>;
			fulfillment?: { status?: "received" | "producing" | "shipped"; trackingNumber?: string | null };
	  }
> {
	if (!purchaseId) return { error: "ID do pedido ausente" };
	const auth = await requireAuth();
	if ("error" in auth) return { error: "Não autorizado" };
	if (!canBuyOnSelolibertaria(auth.session.role)) return { error: "Acesso negado" };
	try {
		const db = await getDb();
		const userId = new ObjectId(auth.session.sub as string);
		interface PurchaseItemDoc {
			name?: string | null;
			quantity?: number;
			unitAmount?: number | null;
			priceId?: string | null;
			productId?: string | null;
		}
		interface PurchaseDoc {
			id: string;
			status: string;
			createdAt: Date | string;
			amountTotal: number;
			currency: string;
			items?: PurchaseItemDoc[];
			fulfillment?: { status?: "received" | "producing" | "shipped"; trackingNumber?: string | null };
			relatedIds?: { paymentIntentId?: string; sessionId?: string };
		}
		const userDoc = await db.collection("users").findOne<{ purchases?: PurchaseDoc[] }>(
			{
				_id: userId,
				$or: [
					{ "purchases.id": purchaseId },
					{ "purchases.relatedIds.paymentIntentId": purchaseId },
					{ "purchases.relatedIds.sessionId": purchaseId },
				],
			},
			{ projection: { purchases: 1 } },
		);
		const purchase = userDoc?.purchases?.find((p) => matchesOrderIdentifier(p, purchaseId));
		if (!purchase) return { error: "Pedido não encontrado" };
		let enrichedItems: Array<{
			name: string | null;
			quantity: number;
			unitAmount: number | null;
			priceId: string | null;
			productId: string | null;
			image: string | null;
		}> = [];
		if (env.STRIPE_SECRET_KEY) {
			try {
				const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: undefined });
				for (const it of purchase.items || []) {
					let name: string | null = it.name || null;
					let image: string | null = null;
					if (it.priceId) {
						try {
							const price = await stripe.prices.retrieve(it.priceId);
							const productId = typeof price.product === "string" ? price.product : price.product?.id;
							if (productId) {
								try {
									const product = await stripe.products.retrieve(productId);
									name = product.name || name;
									image = product.images?.[0] || null;
								} catch (e) {}
							}
						} catch (e) {}
					}
					enrichedItems.push({
						name,
						quantity: it.quantity || 0,
						unitAmount: it.unitAmount ?? null,
						priceId: it.priceId || null,
						productId: it.productId || null,
						image,
					});
				}
			} catch (e) {}
		}
		if (enrichedItems.length === 0) {
			enrichedItems = (purchase.items || []).map((it: PurchaseItemDoc) => ({
				name: it.name || null,
				quantity: it.quantity || 0,
				unitAmount: it.unitAmount ?? null,
				priceId: it.priceId || null,
				productId: it.productId || null,
				image: null,
			}));
		}
		return {
			id: purchase.id,
			status: purchase.status,
			createdAt: purchase.createdAt,
			amountTotal: purchase.amountTotal,
			currency: purchase.currency,
			items: enrichedItems,
			fulfillment: purchase.fulfillment,
		};
	} catch (e) {
		console.error("[getPurchaseDetails]", e);
		return { error: "Falha ao carregar os detalhes do pedido" };
	}
}
