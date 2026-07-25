"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/api-auth";
import { canBuyOnSelolibertaria, normalizeUserRole } from "@/lib/authz";
import { clearCartId } from "@/lib/cart-cookies";
import type { CheckoutSnapshotItem } from "@/lib/checkout/cart-snapshot";
import { normalizeCheckoutBuyer } from "@/lib/checkout-buyer";
import { resolveCheckoutUserForDraft } from "@/lib/checkout-customer";
import { retrieveCheckoutOrder } from "@/lib/mercado-pago-orders/checkout";
import { getDb } from "@/lib/mongodb";
import { matchesOrderIdentifier } from "@/lib/order-identity";
import { ensureOrderReceivedEmail } from "@/lib/order-received";
import {
	buildPersistedOrderShippingSnapshot,
	type PersistedOrderDeliveryAddress,
} from "@/lib/order-shipping-snapshot";
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
	paymentReferenceId?: string | null;
	paymentProvider?: "mercado_pago";
	mercadoPagoPaymentId?: string | null;
	mercadoPagoOrderId?: string | null;
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
	shippingRate?: unknown;
}

interface CheckoutBrowserAccess {
	ok: boolean;
	error?: string;
	userId?: string;
	setupPasswordRequired?: boolean;
}

async function resolveCheckoutBrowserAccess(input: {
	auth: Awaited<ReturnType<typeof requireAuth>> | { error: string };
	draft?: OrderDraftDoc | null;
	paymentUserId?: string | null;
	createSession?: boolean;
}): Promise<CheckoutBrowserAccess> {
	const db = await getDb();
	let userId: string | null =
		!("error" in input.auth) && canBuyOnSelolibertaria(input.auth.session.role)
			? (input.auth.session.sub as string)
			: null;

	if (!("error" in input.auth) && !canBuyOnSelolibertaria(input.auth.session.role)) {
		return { ok: false, error: "Acesso negado" };
	}

	if (input.paymentUserId) {
		if (userId && input.paymentUserId !== userId) {
			return { ok: false, error: "O pagamento não pertence a esta pessoa usuária" };
		}
		userId = input.paymentUserId;
	}

	if (input.draft?.userId) {
		if (userId && input.draft.userId !== userId) {
			return { ok: false, error: "O pagamento não pertence a esta pessoa usuária" };
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
			{ orderId: input.draft.orderId },
			{
				$set: {
					userId,
					updatedAt: new Date(),
				},
			},
		);
	}

	if (!userId) return { ok: false, error: "Não foi possível preparar o acesso da conta" };

	const user = await db.collection("users").findOne<{
		_id: ObjectId;
		email?: string;
		name?: string;
		role?: string;
		passwordHash?: string;
	}>({ _id: new ObjectId(userId) }, { projection: { email: 1, name: 1, role: 1, passwordHash: 1 } });
	if (!user?.email) return { ok: false, error: "Conta da compra não encontrada" };

	if ("error" in input.auth && input.createSession !== false) {
		await createPersistentSession({
			id: user._id.toHexString(),
			email: user.email,
			name: user.name,
			role: normalizeUserRole(user.role),
		});
	}

	return { ok: true, userId: user._id.toHexString(), setupPasswordRequired: !user.passwordHash };
}

export async function recordMercadoPagoCheckout(input: {
	paymentId?: string | null;
	mercadoPagoOrderId?: string | null;
	orderId?: string | null;
	createSession?: boolean;
}): Promise<
	| { ok: true; status: string; cartCleared: boolean; setupPasswordRequired: boolean }
	| { error: string; status?: string }
> {
	const providerOrderIdFromInput =
		typeof input.mercadoPagoOrderId === "string" && /^[0-9A-Za-z_-]+$/.test(input.mercadoPagoOrderId)
			? input.mercadoPagoOrderId
			: null;
	const paymentIdFromInput =
		typeof input.paymentId === "string" && /^[0-9A-Za-z_-]+$/.test(input.paymentId) ? input.paymentId : null;
	const orderIdFromInput =
		typeof input.orderId === "string" && input.orderId.startsWith("ord_") ? input.orderId : null;

	if (!paymentIdFromInput && !providerOrderIdFromInput && !orderIdFromInput)
		return { error: "ID da order ausente" };

	try {
		const db = await getDb();
		const draftByOrder = orderIdFromInput
			? await db.collection<OrderDraftDoc>("orderDrafts").findOne({ orderId: orderIdFromInput })
			: null;
		const resolvedOrderId =
			providerOrderIdFromInput ||
			paymentIdFromInput ||
			draftByOrder?.mercadoPagoOrderId ||
			draftByOrder?.mercadoPagoPaymentId ||
			null;
		if (!resolvedOrderId) return { error: "ID da order Mercado Pago ausente" };

		const paymentOrderId = draftByOrder?.orderId ?? null;
		const draft =
			draftByOrder ||
			(await db.collection<OrderDraftDoc>("orderDrafts").findOne({
				$or: [
					{ mercadoPagoOrderId: resolvedOrderId },
					{ mercadoPagoPaymentId: resolvedOrderId },
					...(paymentOrderId ? [{ orderId: paymentOrderId }] : []),
				],
			}));

		if (!draft?.orderId || draft.paymentProvider !== "mercado_pago") {
			return { error: "Pedido Mercado Pago não encontrado" };
		}
		const orderId = draft.orderId;
		const order = await retrieveCheckoutOrder({
			providerOrderId: resolvedOrderId,
			expected: { amountInCents: draft.amountTotal, currency: draft.currency, externalReference: orderId },
		});
		if (paymentOrderId && paymentOrderId !== order.externalReference) {
			return { error: "Pagamento não pertence ao pedido informado" };
		}

		const authoritativeStatus = order.status;
		await db.collection<OrderDraftDoc>("orderDrafts").updateOne(
			{ orderId },
			{
				$set: {
					status: authoritativeStatus,
					mercadoPagoOrderId: resolvedOrderId,
					mercadoPagoPaymentId: resolvedOrderId,
					"mercadoPago.status": order.providerStatus,
					"mercadoPago.transactionId": order.transaction.id,
					updatedAt: new Date(),
					confirmedAt: authoritativeStatus === "succeeded" ? new Date() : null,
				},
			},
		);

		if (authoritativeStatus !== "succeeded" && authoritativeStatus !== "processing") {
			return { error: "O pagamento ainda não foi concluído", status: authoritativeStatus };
		}
		if (authoritativeStatus !== "succeeded") {
			return { ok: true, status: authoritativeStatus, cartCleared: false, setupPasswordRequired: false };
		}

		const auth = await requireAuth();
		const browserAccess = await resolveCheckoutBrowserAccess({
			auth,
			draft,
			paymentUserId: draft.userId ?? null,
			createSession: input.createSession,
		});
		if (!browserAccess.ok || !browserAccess.userId)
			return { error: browserAccess.error ?? "Acesso negado", status: authoritativeStatus };

		const userId = browserAccess.userId;
		const usersCol = db.collection("users");
		const userUpdateCol = usersCol as unknown as {
			updateOne: (filter: unknown, update: unknown) => Promise<{ matchedCount?: number }>;
		};
		const userDoc = await usersCol.findOne<{ purchases?: Array<{ id: string; status?: string }> }>(
			{ _id: new ObjectId(userId) },
			{ projection: { purchases: 1 } },
		);
		const existingPurchase = userDoc?.purchases?.find((purchase) =>
			matchesOrderIdentifier(purchase, orderId),
		);
		const finalStatus = shouldPreserveAuthoritativePurchaseStatus(existingPurchase?.status)
			? existingPurchase?.status || authoritativeStatus
			: authoritativeStatus;
		const amountTotal = order.amountInCents;
		const currency = order.currency.toUpperCase();
		const items = (draft.items || []).map((item) => ({
			name: item.name,
			quantity: item.quantity,
			unitAmount: item.unitAmount,
			priceId: item.priceId,
			productId: item.productId,
			image: item.image,
		}));
		const shippingSnapshot = buildPersistedOrderShippingSnapshot({
			deliveryMethod: draft.deliveryMethod ?? null,
			deliveryAddress: draft.deliveryAddress ?? null,
			shippingRate: draft.shippingRate ?? null,
		});
		const eventId = `mercado-pago-order:${resolvedOrderId}:${order.providerStatus}`;
		const relatedIds = { mercadoPagoOrderId: resolvedOrderId };

		const updateExisting = await userUpdateCol.updateOne(
			{
				_id: new ObjectId(userId),
				purchases: {
					$elemMatch: {
						$or: [{ id: orderId }, { "relatedIds.mercadoPagoOrderId": resolvedOrderId }],
					},
				},
			},
			{
				$set: {
					"purchases.$.status": finalStatus,
					"purchases.$.amountTotal": amountTotal,
					"purchases.$.currency": currency,
					"purchases.$.items": items,
					"purchases.$.buyer": draft.buyer ?? null,
					"purchases.$.relatedIds": relatedIds,
					"purchases.$.fulfillment.status": "received",
					"purchases.$.pricing": {
						subtotal: draft.subtotal,
						discountTotal: draft.discountTotal,
						finalSubtotal: draft.amountTotal,
						shippingTotal:
							typeof draft.shippingRate === "object" &&
							draft.shippingRate &&
							"fixed_amount" in draft.shippingRate &&
							typeof draft.shippingRate.fixed_amount === "object" &&
							draft.shippingRate.fixed_amount &&
							"amount" in draft.shippingRate.fixed_amount
								? Number(draft.shippingRate.fixed_amount.amount)
								: 0,
						shippingRate: draft.shippingRate ?? null,
						couponCode: draft.couponCode ?? null,
						couponPromotionId: draft.couponPromotionId ?? null,
						couponCodeId: draft.couponCodeId ?? null,
					},
					"purchases.$.deliveryMethod": shippingSnapshot.deliveryMethod ?? null,
					"purchases.$.deliveryAddress": shippingSnapshot.deliveryAddress ?? null,
					"purchases.$.shippingRate": shippingSnapshot.shippingRate ?? null,
					updatedAt: new Date(),
				},
				$addToSet: {
					"purchases.$.events": {
						eventId,
						type: "mercado_pago.payment.sync",
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
							amountTotal,
							currency,
							buyer: draft.buyer ?? null,
							items,
							kind: "mercado_pago",
							mercadoPagoOrderId: resolvedOrderId,
							relatedIds,
							...(draft
								? {
										pricing: {
											subtotal: draft.subtotal,
											discountTotal: draft.discountTotal,
											finalSubtotal: draft.amountTotal,
											shippingTotal:
												typeof draft.shippingRate === "object" &&
												draft.shippingRate &&
												"fixed_amount" in draft.shippingRate &&
												typeof draft.shippingRate.fixed_amount === "object" &&
												draft.shippingRate.fixed_amount &&
												"amount" in draft.shippingRate.fixed_amount
													? Number(draft.shippingRate.fixed_amount.amount)
													: 0,
											shippingRate: draft.shippingRate ?? null,
											couponCode: draft.couponCode ?? null,
											couponPromotionId: draft.couponPromotionId ?? null,
											couponCodeId: draft.couponCodeId ?? null,
										},
										...shippingSnapshot,
									}
								: {}),
							fulfillment: { status: "received" as const },
							events: [
								{
									eventId,
									type: "mercado_pago.payment.sync",
									status: finalStatus,
									createdAt: new Date(),
								},
							],
						},
					},
					$set: { updatedAt: new Date() },
					$unset: { cart: "" },
				},
			);
		}

		if (isOrderReceivedEligibleStatus(finalStatus)) {
			await ensureOrderReceivedEmail(userId, orderId);
		}
		if (isFinalizedPaymentStatus(finalStatus)) {
			await clearCartId();
		}

		return {
			ok: true,
			status: finalStatus,
			cartCleared: isFinalizedPaymentStatus(finalStatus),
			setupPasswordRequired: Boolean(browserAccess.setupPasswordRequired),
		};
	} catch (error) {
		console.error("[recordMercadoPagoCheckout]", error);
		return { error: "Falha ao registrar o pagamento" };
	}
}
