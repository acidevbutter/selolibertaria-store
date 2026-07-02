"use server";

import { ObjectId } from "mongodb";
import Stripe from "stripe";
import { env } from "@/env.mjs";
import { requireAuth } from "@/lib/api-auth";
import { canBuyOnSelolibertaria, normalizeUserRole } from "@/lib/authz";
import { clearCartId, getCartId } from "@/lib/cart-cookies";
import type { CheckoutSnapshot, CheckoutSnapshotItem } from "@/lib/checkout/cart-snapshot";
import { normalizeCheckoutBuyer } from "@/lib/checkout-buyer";
import { resolveCheckoutUserForDraft } from "@/lib/checkout-customer";
import { commerce } from "@/lib/commerce-stripe";
import type { UserCart } from "@/lib/mongodb";
import { getDb } from "@/lib/mongodb";
import { matchesOrderIdentifier } from "@/lib/order-identity";
import { ensureOrderReceivedEmail } from "@/lib/order-received";
import {
	buildPersistedOrderShippingSnapshot,
	type PersistedOrderDeliveryAddress,
} from "@/lib/order-shipping-snapshot";
import { getClientVisiblePaymentIntentStatus } from "@/lib/payment-intent-status";
import {
	isFinalizedPaymentStatus,
	isOrderReceivedEligibleStatus,
	shouldPreserveAuthoritativePurchaseStatus,
} from "@/lib/payment-status";
import { createPersistentSession } from "@/lib/session";

interface OrderDraftDoc {
	orderId?: string;
	checkoutOwnerKey?: string;
	userId?: string | null;
	paymentIntentId: string;
	status: string;
	subtotal?: number;
	discountTotal?: number;
	amountTotal: number;
	currency: string;
	buyer?: {
		fullName?: string;
		email?: string;
		cpf?: string;
		phone?: string;
	} | null;
	couponCode?: string | null;
	couponPromotionId?: string | null;
	couponCodeId?: string | null;
	items?: CheckoutSnapshotItem[];
	deliveryMethod?: "saved-address" | "new-address" | "pickup";
	deliveryAddress?: PersistedOrderDeliveryAddress | null;
	shippingRate?: CheckoutSnapshot["shippingRate"] | null;
}

interface BrowserSyncPurchaseDoc {
	id: string;
	status: string;
	relatedIds?: {
		paymentIntentId?: string;
		sessionId?: string;
	};
}

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
	relatedIds?: {
		paymentIntentId?: string;
		sessionId?: string;
	};
}

type CheckoutBrowserAccess =
	| {
			ok: true;
			userId: string;
			setupPasswordRequired: boolean;
	  }
	| {
			ok: false;
			error: string;
	  };

async function resolveCheckoutBrowserAccess(input: {
	auth: Awaited<ReturnType<typeof requireAuth>> | { error: string };
	draft?: OrderDraftDoc | null;
	paymentIntentUserId?: string | null;
}): Promise<CheckoutBrowserAccess> {
	const db = await getDb();
	let userId: string | null =
		!("error" in input.auth) && canBuyOnSelolibertaria(input.auth.session.role)
			? (input.auth.session.sub as string)
			: null;

	if (!("error" in input.auth) && !canBuyOnSelolibertaria(input.auth.session.role)) {
		return { ok: false, error: "Acesso negado" };
	}

	if (input.paymentIntentUserId) {
		if (userId && input.paymentIntentUserId !== userId) {
			return { ok: false, error: "A intenção de pagamento não pertence a esta pessoa usuária" };
		}
		userId = input.paymentIntentUserId;
	}

	if (input.draft?.userId) {
		if (userId && input.draft.userId !== userId) {
			return { ok: false, error: "A intenção de pagamento não pertence a esta pessoa usuária" };
		}
		userId = input.draft.userId;
	}

	if (!userId && input.draft?.buyer?.email && input.draft.orderId) {
		const resolved = await resolveCheckoutUserForDraft({
			orderId: input.draft.orderId,
			userId: input.draft.userId ?? null,
			buyer: normalizeCheckoutBuyer(input.draft.buyer),
			deliveryAddress: input.draft.deliveryAddress ?? null,
		});
		userId = resolved.userId;

		await db.collection("orderDrafts").updateOne(
			{ paymentIntentId: input.draft.paymentIntentId },
			{
				$set: {
					userId,
					updatedAt: new Date(),
				},
			},
		);
	}

	if (!userId) {
		return { ok: false, error: "Não foi possível preparar o acesso da conta" };
	}

	const user = await db.collection("users").findOne<{
		_id: ObjectId;
		email?: string;
		name?: string;
		role?: string;
		passwordHash?: string;
	}>({ _id: new ObjectId(userId) }, { projection: { email: 1, name: 1, role: 1, passwordHash: 1 } });

	if (!user?.email) {
		return { ok: false, error: "Conta da compra não encontrada" };
	}

	if ("error" in input.auth) {
		await createPersistentSession({
			id: user._id.toHexString(),
			email: user.email,
			name: user.name,
			role: normalizeUserRole(user.role),
		});
	}

	return {
		ok: true,
		userId: user._id.toHexString(),
		setupPasswordRequired: !user.passwordHash,
	};
}

/**
 * Clears cart stored on user document after checkout finalized.
 * Also removes legacy in-memory/cookie cart, if exists, to keep things consistent.
 */
export async function finalizeCheckoutCleanup(): Promise<{ ok: true } | { error: string }> {
	const auth = await requireAuth();

	try {
		if (!("error" in auth)) {
			if (!canBuyOnSelolibertaria(auth.session.role)) {
				return { error: "Acesso negado" };
			}

			const userId = auth.session.sub as string;
			const db = await getDb();
			await db
				.collection("users")
				.updateOne({ _id: new ObjectId(userId) }, { $unset: { cart: "" }, $set: { updatedAt: new Date() } });
		}

		const cartId = await getCartId();
		if (cartId) {
			try {
				await commerce.cart.clear({ cartId });
			} catch {
				// noop
			}
			await clearCartId();
		}

		return { ok: true };
	} catch (error) {
		console.error("[finalizeCheckoutCleanup]", error);
		return { error: "Falha ao limpar o carrinho" };
	}
}

/**
 * Saves a purchase on user document using session_id returned on success_url.
 * This doesn't replace webhook (source of truth), but it allows immediate recording.
 */
export async function recordSuccessfulCheckout(
	sessionId: string,
): Promise<{ ok: true; setupPasswordRequired: boolean } | { error: string }> {
	if (!sessionId || !sessionId.startsWith("cs_")) return { error: "ID de sessão inválido" };
	if (!env.STRIPE_SECRET_KEY) return { error: "Stripe não configurado" };

	const auth = await requireAuth();

	try {
		const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: undefined });
		const session = await stripe.checkout.sessions.retrieve(sessionId, {
			expand: ["line_items.data.price.product"],
		});

		const db = await getDb();
		const paymentIntentId =
			typeof session.payment_intent === "string"
				? session.payment_intent
				: (session.payment_intent?.id ?? null);
		const draft = paymentIntentId?.startsWith("pi_")
			? await db.collection<OrderDraftDoc>("orderDrafts").findOne({ paymentIntentId })
			: null;
		const browserAccess = await resolveCheckoutBrowserAccess({
			auth,
			draft,
			paymentIntentUserId: session.metadata?.userId ? String(session.metadata.userId) : null,
		});

		if (!browserAccess.ok) {
			return { error: browserAccess.error };
		}

		const userId = browserAccess.userId;
		const purchaseId = draft?.orderId || session.id;
		const items = (session.line_items?.data || []).map((lineItem) => {
			const product =
				typeof lineItem.price?.product === "object" ? (lineItem.price.product as Stripe.Product) : undefined;
			return {
				priceId: lineItem.price?.id || null,
				productId: product?.id || null,
				name: product?.name || null,
				quantity: lineItem.quantity || 0,
				unitAmount: lineItem.price?.unit_amount ?? null,
			};
		});
		const userObjectId = new ObjectId(userId);
		const shippingSnapshot = buildPersistedOrderShippingSnapshot({
			deliveryMethod: draft?.deliveryMethod ?? null,
			deliveryAddress: draft?.deliveryAddress ?? null,
			shippingRate: draft?.shippingRate ?? null,
		});
		const relatedIds = {
			sessionId: session.id,
			...(paymentIntentId ? { paymentIntentId } : {}),
		};

		const purchase = {
			id: purchaseId,
			createdAt: new Date(),
			status: session.payment_status || session.status || "unknown",
			amountTotal: session.amount_total || 0,
			currency: (session.currency || env.STRIPE_CURRENCY || "USD").toUpperCase(),
			buyer: draft?.buyer ?? null,
			items,
			invoiceId: (session.invoice as string) || null,
			paymentIntentId,
			relatedIds,
			fulfillment: { status: "received" as const },
			...shippingSnapshot,
		};

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

		const existing = await usersCol.findOne(
			{
				_id: userObjectId,
				$or: [
					{ "purchases.id": purchaseId },
					{ "purchases.relatedIds.sessionId": session.id },
					...(paymentIntentId ? [{ "purchases.relatedIds.paymentIntentId": paymentIntentId }] : []),
				],
			},
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

		if (isOrderReceivedEligibleStatus(purchase.status)) {
			await ensureOrderReceivedEmail(userId, purchaseId);
		}

		return { ok: true, setupPasswordRequired: browserAccess.setupPasswordRequired };
	} catch (error) {
		console.error("[recordSuccessfulCheckout]", error);
		return { error: "Falha ao registrar a compra" };
	}
}

export async function recordPaymentIntentCheckout(input: {
	paymentIntentId?: string | null;
	orderId?: string | null;
}): Promise<
	| { ok: true; status: string; cartCleared: boolean; setupPasswordRequired: boolean }
	| { error: string; status?: string }
> {
	if (!env.STRIPE_SECRET_KEY) return { error: "Stripe não configurado" };

	const paymentIntentIdFromInput =
		typeof input.paymentIntentId === "string" && input.paymentIntentId.startsWith("pi_")
			? input.paymentIntentId
			: null;
	const orderIdFromInput =
		typeof input.orderId === "string" && input.orderId.startsWith("ord_") ? input.orderId : null;

	try {
		const db = await getDb();
		const draftByOrder = orderIdFromInput
			? await db.collection<OrderDraftDoc>("orderDrafts").findOne({ orderId: orderIdFromInput })
			: null;
		const resolvedPaymentIntentId = paymentIntentIdFromInput || draftByOrder?.paymentIntentId || null;

		if (!resolvedPaymentIntentId) {
			return { error: "ID da intenção de pagamento ausente" };
		}

		const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: undefined });
		const paymentIntent = await stripe.paymentIntents.retrieve(resolvedPaymentIntentId, {
			expand: ["latest_charge"],
		});
		const draft =
			draftByOrder ||
			(await db.collection<OrderDraftDoc>("orderDrafts").findOne({
				paymentIntentId: resolvedPaymentIntentId,
			}));

		const status = paymentIntent.status;
		const clientVisibleStatus = getClientVisiblePaymentIntentStatus(status);
		const orderId = draft?.orderId || paymentIntent.metadata?.orderId || paymentIntent.id;
		const draftAuthoritativeStatus = shouldPreserveAuthoritativePurchaseStatus(draft?.status)
			? draft?.status
			: undefined;
		const authoritativeStatus = draftAuthoritativeStatus || clientVisibleStatus;

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

		const auth = await requireAuth();
		const browserAccess = await resolveCheckoutBrowserAccess({
			auth,
			draft,
			paymentIntentUserId: paymentIntent.metadata?.userId ?? null,
		});
		if (!browserAccess.ok) {
			return { error: browserAccess.error, status: authoritativeStatus };
		}

		const userId = browserAccess.userId;

		const usersCol = db.collection("users");
		const userUpdateCol = usersCol as unknown as {
			updateOne: (
				filter: unknown,
				update: unknown,
			) => Promise<{
				matchedCount?: number;
			}>;
		};
		const userDoc = await usersCol.findOne<{
			purchases?: BrowserSyncPurchaseDoc[];
		}>({ _id: new ObjectId(userId) }, { projection: { purchases: 1 } });

		const existingPurchase = userDoc?.purchases?.find(
			(purchase) =>
				matchesOrderIdentifier(purchase, orderId) || matchesOrderIdentifier(purchase, paymentIntent.id),
		);
		const existingAuthoritativeStatus = shouldPreserveAuthoritativePurchaseStatus(existingPurchase?.status)
			? existingPurchase?.status
			: undefined;
		const finalStatus = existingAuthoritativeStatus || authoritativeStatus;
		const chargeId =
			typeof paymentIntent.latest_charge === "object" && paymentIntent.latest_charge
				? paymentIntent.latest_charge.id
				: typeof paymentIntent.latest_charge === "string"
					? paymentIntent.latest_charge
					: null;
		const relatedIds = {
			paymentIntentId: paymentIntent.id,
			...(chargeId ? { chargeIds: [chargeId] } : {}),
		};
		const items = (draft?.items || []).map((item) => ({
			name: item.name,
			quantity: item.quantity,
			unitAmount: item.unitAmount,
			priceId: item.priceId,
			productId: item.productId,
			image: item.image,
		}));
		const shippingSnapshot = buildPersistedOrderShippingSnapshot({
			deliveryMethod: draft?.deliveryMethod ?? null,
			deliveryAddress: draft?.deliveryAddress ?? null,
			shippingRate: draft?.shippingRate ?? null,
		});
		const eventId = `browser-sync:${paymentIntent.id}:${status}`;

		const updateExisting = await userUpdateCol.updateOne(
			{
				_id: new ObjectId(userId),
				$or: [{ "purchases.id": orderId }, { "purchases.relatedIds.paymentIntentId": paymentIntent.id }],
			},
			{
				$set: {
					"purchases.$.status": finalStatus,
					"purchases.$.amountTotal": paymentIntent.amount,
					"purchases.$.currency": paymentIntent.currency.toUpperCase(),
					"purchases.$.items": items,
					"purchases.$.buyer": draft?.buyer ?? null,
					"purchases.$.relatedIds": relatedIds,
					"purchases.$.fulfillment.status": "received",
					...(draft
						? {
								"purchases.$.pricing": {
									subtotal: draft.subtotal,
									discountTotal: draft.discountTotal,
									finalSubtotal: draft.amountTotal,
									shippingTotal: draft.shippingRate?.fixed_amount.amount ?? 0,
									shippingRate: draft.shippingRate ?? null,
									couponCode: draft.couponCode ?? null,
									couponPromotionId: draft.couponPromotionId ?? null,
									couponCodeId: draft.couponCodeId ?? null,
								},
								"purchases.$.deliveryMethod": shippingSnapshot.deliveryMethod ?? null,
								"purchases.$.deliveryAddress": shippingSnapshot.deliveryAddress ?? null,
								"purchases.$.shippingRate": shippingSnapshot.shippingRate ?? null,
							}
						: {}),
					updatedAt: new Date(),
				},
				$addToSet: {
					"purchases.$.events": {
						eventId,
						type: "browser.payment_intent.sync",
						status: finalStatus,
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
							status: finalStatus,
							amountTotal: paymentIntent.amount,
							currency: paymentIntent.currency.toUpperCase(),
							buyer: draft?.buyer ?? null,
							items,
							kind: "payment_intent",
							paymentIntentId: paymentIntent.id,
							...(draft
								? {
										pricing: {
											subtotal: draft.subtotal,
											discountTotal: draft.discountTotal,
											finalSubtotal: draft.amountTotal,
											shippingTotal: draft.shippingRate?.fixed_amount.amount ?? 0,
											shippingRate: draft.shippingRate ?? null,
											couponCode: draft.couponCode ?? null,
											couponPromotionId: draft.couponPromotionId ?? null,
											couponCodeId: draft.couponCodeId ?? null,
										},
										...shippingSnapshot,
									}
								: {}),
							relatedIds,
							fulfillment: { status: "received" as const },
							events: [
								{
									eventId,
									type: "browser.payment_intent.sync",
									status: finalStatus,
									createdAt: new Date(),
								},
							],
						},
					},
					$set: { updatedAt: new Date() },
				},
			);
		}

		if (isOrderReceivedEligibleStatus(finalStatus)) {
			await ensureOrderReceivedEmail(userId, orderId);
		}

		return {
			ok: true,
			status: finalStatus,
			cartCleared: isFinalizedPaymentStatus(finalStatus),
			setupPasswordRequired: browserAccess.setupPasswordRequired,
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
			fulfillment?: {
				status?: "received" | "producing" | "shipped";
				trackingNumber?: string | null;
			};
	  }
> {
	if (!purchaseId) return { error: "ID do pedido ausente" };

	const auth = await requireAuth();
	if ("error" in auth) return { error: "Não autorizado" };
	if (!canBuyOnSelolibertaria(auth.session.role)) return { error: "Acesso negado" };

	try {
		const db = await getDb();
		const userId = new ObjectId(auth.session.sub as string);
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
		const purchase = userDoc?.purchases?.find((entry) => matchesOrderIdentifier(entry, purchaseId));
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
				const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
					apiVersion: undefined,
				});
				for (const item of purchase.items || []) {
					let name: string | null = item.name || null;
					let image: string | null = null;

					if (item.priceId) {
						try {
							const price = await stripe.prices.retrieve(item.priceId);
							const productId = typeof price.product === "string" ? price.product : price.product?.id;
							if (productId) {
								try {
									const product = await stripe.products.retrieve(productId);
									name = product.name || name;
									image = product.images?.[0] || null;
								} catch {
									// noop
								}
							}
						} catch {
							// noop
						}
					}

					enrichedItems.push({
						name,
						quantity: item.quantity || 0,
						unitAmount: item.unitAmount ?? null,
						priceId: item.priceId ?? null,
						productId: item.productId ?? null,
						image,
					});
				}
			} catch {
				// noop
			}
		}

		if (enrichedItems.length === 0) {
			enrichedItems = (purchase.items || []).map((item) => ({
				name: item.name || null,
				quantity: item.quantity || 0,
				unitAmount: item.unitAmount ?? null,
				priceId: item.priceId ?? null,
				productId: item.productId ?? null,
				image: item.image ?? null,
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
	} catch (error) {
		console.error("[getPurchaseDetails]", error);
		return { error: "Falha ao carregar o pedido" };
	}
}
