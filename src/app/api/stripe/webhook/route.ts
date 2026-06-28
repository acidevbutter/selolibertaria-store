import { ObjectId } from "mongodb";
import type { NextRequest } from "next/server";
import Stripe from "stripe";
import { getDb } from "@/lib/mongodb";
import { notifyOrderStatusChange } from "@/lib/notify-order-status";
import { recordOrderAuditEntry } from "@/lib/order-audit";
import { ensureOrderReceivedEmail } from "@/lib/order-received";
import {
	buildPersistedOrderShippingSnapshot,
	type PersistedOrderDeliveryAddress,
	type PersistedOrderShippingRate,
} from "@/lib/order-shipping-snapshot";
import { shouldNotifyCustomerOrderStatusChange } from "@/lib/order-status-notification";
import { isOrderReceivedEligibleStatus } from "@/lib/payment-status";
import { recordPromotionRedemption } from "@/lib/promotions";
import {
	deriveStripeEventStatus,
	type ExtractedStripeEventContext,
	extractStripeEventContext,
} from "@/lib/stripe-webhook-events";
import { hasStripeWebhookEvent, matchesStripeWebhookPurchase } from "@/lib/stripe-webhook-purchases";

// NOTE: In the App Router we must read the raw body manually before any parsing.
// Do NOT export a config with bodyParser: false here (that pattern is for pages router).

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
// Use the type's default literal to satisfy Stripe TS definitions (avoid hardcoding outdated date string).
// Initialize with default API version from the library types (avoids hard-coded outdated versions).
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: undefined }) : null;

interface WebhookLogUpdate {
	eventId?: string | null;
	type?: string | null;
	raw?: unknown;
	status?: string;
	error?: string | null;
	verified?: boolean;
	processedAt?: Date;
}

const AUDITED_ORDER_STATUS_WEBHOOK_TYPES = new Set([
	"checkout.session.completed",
	"checkout.session.async_payment_succeeded",
	"checkout.session.async_payment_failed",
	"payment_intent.succeeded",
	"payment_intent.processing",
	"payment_intent.payment_failed",
	"payment_intent.canceled",
	"charge.succeeded",
	"charge.failed",
	"charge.refunded",
	"refund.succeeded",
	"refund.updated",
	"invoice.paid",
	"invoice.payment_failed",
	"charge.dispute.created",
	"charge.dispute.updated",
	"charge.dispute.closed",
]);

async function buffer(readable: ReadableStream<Uint8Array>) {
	const reader = readable.getReader();
	const chunks: Uint8Array[] = [];
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		if (value) chunks.push(value);
	}
	return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
	const requestHeaders = Object.fromEntries(req.headers.entries());
	let logId: ObjectId | null = null;
	let parsedRawBody: unknown = null;

	async function createWebhookLog(status: string, bodyText?: string, update?: WebhookLogUpdate) {
		try {
			const db = await getDb();
			const webhooksCol = db.collection("webhooks");
			const initialRaw = bodyText ? safeParseJson(bodyText) : null;
			parsedRawBody = initialRaw;
			const result = await webhooksCol.insertOne({
				eventId: update?.eventId ?? extractStringField(initialRaw, "id"),
				type: update?.type ?? extractStringField(initialRaw, "type"),
				raw: update?.raw ?? initialRaw,
				headers: requestHeaders,
				verified: update?.verified ?? false,
				receivedAt: new Date(),
				status,
				error: update?.error ?? null,
				processedAt: update?.processedAt ?? null,
			});
			logId = result.insertedId;
		} catch (err) {
			console.error("Failed to persist webhook", err);
		}
	}

	async function updateWebhookLog(update: WebhookLogUpdate) {
		if (!logId) return;
		try {
			const db = await getDb();
			const webhooksCol = db.collection("webhooks");
			await webhooksCol.updateOne(
				{ _id: logId },
				{
					$set: {
						...(update.eventId !== undefined ? { eventId: update.eventId } : {}),
						...(update.type !== undefined ? { type: update.type } : {}),
						...(update.raw !== undefined ? { raw: update.raw } : {}),
						...(update.status !== undefined ? { status: update.status } : {}),
						...(update.error !== undefined ? { error: update.error } : {}),
						...(update.verified !== undefined ? { verified: update.verified } : {}),
						...(update.processedAt !== undefined ? { processedAt: update.processedAt } : {}),
					},
				},
			);
		} catch (err) {
			console.error("Failed to update webhook log", err);
		}
	}

	if (!stripe) {
		await createWebhookLog("failed", undefined, {
			error: "Missing STRIPE_SECRET_KEY",
		});
		return new Response("Missing STRIPE_SECRET_KEY", { status: 500 });
	}

	let event: Stripe.Event;
	let bodyBuffer: Buffer;
	let bodyText = "";
	try {
		bodyBuffer = await buffer(req.body!);
		bodyText = bodyBuffer.toString();
		await createWebhookLog("received", bodyText);
	} catch (e) {
		await createWebhookLog("failed", undefined, {
			error: "Failed to read body",
		});
		return new Response("Failed to read body", { status: 400 });
	}

	const sig = req.headers.get("stripe-signature");
	if (webhookSecret) {
		if (!sig) {
			await updateWebhookLog({
				status: "failed",
				error: "Missing signature",
				raw: parsedRawBody,
			});
			return new Response("Missing signature", { status: 400 });
		}
		try {
			event = stripe.webhooks.constructEvent(bodyBuffer, sig, webhookSecret);
			await updateWebhookLog({
				eventId: event.id || null,
				type: event.type || null,
				raw: parsedRawBody ?? safeParseJson(bodyText),
				status: "pending",
				error: null,
				verified: true,
			});
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Unknown error";
			console.error("Stripe signature verification failed", msg);
			await updateWebhookLog({
				status: "failed",
				error: `Webhook Error: ${msg}`,
				raw: parsedRawBody ?? safeParseJson(bodyText),
				verified: false,
			});
			return new Response(`Webhook Error: ${msg}`, { status: 400 });
		}
	} else {
		// Unsafe (dev only): directly parse JSON
		try {
			event = JSON.parse(bodyBuffer.toString()) as Stripe.Event;
			await updateWebhookLog({
				eventId: event.id || null,
				type: event.type || null,
				raw: parsedRawBody ?? event,
				status: "pending",
				error: null,
				verified: false,
			});
		} catch (e) {
			const msg = e instanceof Error ? e.message : "Invalid JSON";
			await updateWebhookLog({
				status: "failed",
				error: `Invalid JSON: ${msg}`,
				raw: parsedRawBody,
				verified: false,
			});
			return new Response(`Invalid JSON: ${msg}`, { status: 400 });
		}
	}

	// ---- Generic handling (all events) ----
	try {
		const extracted = extractStripeEventContext(event);
		let { userId, rootId, kind, related } = extracted;
		const db = await getDb();

		const paymentIntentIdForLookup = kind === "payment_intent" ? rootId : related.paymentIntentId;
		if (!userId && paymentIntentIdForLookup) {
			const draft = await db
				.collection<{ userId?: string }>("orderDrafts")
				.findOne({ paymentIntentId: paymentIntentIdForLookup }, { projection: { userId: 1 } });
			if (draft?.userId) userId = draft.userId;
		}

		if (!userId) {
			const ownershipFilters = buildUserOwnershipFilters(rootId, related);
			if (ownershipFilters.length > 0) {
				const owner = await db
					.collection<{ _id: ObjectId }>("users")
					.findOne({ $or: ownershipFilters }, { projection: { _id: 1 } });
				if (owner?._id) userId = owner._id.toHexString();
			}
		}

		if (!userId || !rootId) {
			await updateWebhookLog({
				eventId: event?.id || null,
				type: event?.type || null,
				status: "ignored",
				error: "Webhook missing userId or rootId for reconciliation",
				processedAt: new Date(),
			});
			return new Response("ignored", { status: 200 });
		}

		const rawObj = event.data.object as unknown;
		const derivedStatus = deriveStripeEventStatus(rawObj, event.type);

		interface UserPurchaseEventDoc {
			eventId: string; // Stripe event id
			type: string; // event.type
			status: string; // status captured at this point
			createdAt: Date; // when we processed (not Stripe timestamp)
			stripeCreated?: number; // Stripe event created (epoch seconds)
		}

		interface UserPurchaseItem {
			name: string | null;
			quantity: number;
			unitAmount: number | null;
			priceId: string | null;
			productId?: string | null;
			image?: string | null;
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
			shippingRate?: {
				providerCode: string;
				providerLabel: string;
				serviceCode: string;
				serviceName: string;
				fixed_amount: { amount: number };
				currency?: string;
				estimated_days?: number | null;
				quotedAt?: string | null;
			} | null;
			couponCode?: string | null;
			couponPromotionId?: string | null;
			couponCodeId?: string | null;
			deliveryMethod?: "saved-address" | "new-address" | "pickup";
			deliveryAddress?: PersistedOrderDeliveryAddress | null;
			items?: Array<{
				name: string;
				quantity: number;
				unitAmount: number;
				priceId: string;
				productId: string;
				image: string | null;
			}>;
		}

		interface PurchaseDoc {
			id: string;
			createdAt: Date;
			status: string;
			amountTotal: number;
			currency: string;
			items: UserPurchaseItem[];
			pricing?: {
				subtotal?: number;
				discountTotal?: number;
				finalSubtotal?: number;
				shippingTotal?: number;
				shippingRate?: {
					providerCode: string;
					providerLabel: string;
					serviceCode: string;
					serviceName: string;
					fixed_amount: { amount: number };
					currency?: string;
					estimated_days?: number | null;
					quotedAt?: string | null;
				} | null;
				couponCode?: string | null;
				couponPromotionId?: string | null;
				couponCodeId?: string | null;
			};
			deliveryMethod?: "saved-address" | "new-address" | "pickup" | null;
			deliveryAddress?: PersistedOrderDeliveryAddress | null;
			shippingRate?: PersistedOrderShippingRate | null;
			kind: string; // e.g. checkout.session | payment_intent | subscription
			events?: UserPurchaseEventDoc[];
			relatedIds?: {
				sessionId?: string;
				paymentIntentId?: string;
				chargeIds?: string[];
				invoiceId?: string;
				subscriptionId?: string;
				refundIds?: string[];
			};
		}

		interface UserDoc {
			_id: ObjectId;
			purchases?: PurchaseDoc[];
		}

		const usersCol = db.collection<UserDoc>("users");
		const userObjectId = new ObjectId(userId);

		// Only fetch line items if this is a checkout.session.* event AND the purchase does not yet exist.
		let items: UserPurchaseItem[] = [];
		let amountTotal = 0;
		let currency = "usd";
		let paymentIntentDraft: OrderDraftDoc | null = null;

		if (kind === "checkout.session") {
			const session = event.data.object as Stripe.Checkout.Session;
			currency = (session.currency || "usd").toLowerCase();
			if (typeof session.amount_total === "number") amountTotal = session.amount_total;
			const existing = await usersCol.findOne(
				{
					_id: userObjectId,
					$or: [{ "purchases.id": rootId }, { "purchases.relatedIds.sessionId": rootId }],
				},
				{ projection: { _id: 1 } },
			);
			if (!existing) {
				const lineItems = await stripe.checkout.sessions.listLineItems(rootId, { limit: 100 });
				items = lineItems.data.map((li) => ({
					name: li.description,
					quantity: li.quantity || 0,
					unitAmount: li.price?.unit_amount ?? null,
					priceId: li.price?.id ?? null,
				}));
				if (!amountTotal) {
					amountTotal = items.reduce(
						(sum, i) => sum + (typeof i.unitAmount === "number" ? i.unitAmount : 0) * i.quantity,
						0,
					);
				}
			}
		} else if (kind === "payment_intent") {
			const pi = event.data.object as Stripe.PaymentIntent;
			currency = (pi.currency || "usd").toLowerCase();
			amountTotal = typeof pi.amount === "number" ? pi.amount : 0;
			paymentIntentDraft = await db
				.collection<OrderDraftDoc>("orderDrafts")
				.findOne({ paymentIntentId: pi.id });
			if (paymentIntentDraft) {
				currency = paymentIntentDraft.currency || currency;
				amountTotal = paymentIntentDraft.amountTotal || amountTotal;
				items = (paymentIntentDraft.items || []).map((item) => ({
					name: item.name,
					quantity: item.quantity,
					unitAmount: item.unitAmount,
					priceId: item.priceId,
					productId: item.productId,
					image: item.image,
				}));
			}
		} else if (kind === "invoice") {
			const inv = event.data.object as Stripe.Invoice;
			currency = (inv.currency || "usd").toLowerCase();
			amountTotal = typeof inv.amount_paid === "number" ? inv.amount_paid : inv.amount_due || 0;
		} else if (kind === "subscription") {
			const sub = event.data.object as Stripe.Subscription;
			currency = (sub.currency || "usd").toLowerCase();
			amountTotal = 0; // subscription events usually not carry total paid directly here
		} else if (kind === "charge") {
			const charge = event.data.object as Stripe.Charge;
			currency = (charge.currency || "usd").toLowerCase();
			amountTotal = typeof charge.amount === "number" ? charge.amount : 0;
		} else if (kind === "refund") {
			const refund = event.data.object as Stripe.Refund;
			currency = (refund.currency || "usd").toLowerCase();
			amountTotal = typeof refund.amount === "number" ? refund.amount : 0;
		} else if (kind === "dispute") {
			const dispute = event.data.object as Stripe.Dispute;
			currency = (dispute.currency || "usd").toLowerCase();
			amountTotal = typeof dispute.amount === "number" ? dispute.amount : 0;
		}

		const eventDoc: UserPurchaseEventDoc = {
			eventId: event.id,
			type: event.type,
			status: derivedStatus,
			createdAt: new Date(),
			stripeCreated: event.created,
		};

		if (kind === "payment_intent" && rootId) {
			await db.collection("orderDrafts").updateOne(
				{ paymentIntentId: rootId },
				{
					$set: {
						status: derivedStatus,
						updatedAt: new Date(),
						lastStripeEventId: event.id,
						...(derivedStatus === "succeeded" ? { confirmedAt: new Date() } : {}),
					},
				},
			);
		}

		const shippingSnapshot = buildPersistedOrderShippingSnapshot({
			deliveryMethod: paymentIntentDraft?.deliveryMethod ?? null,
			deliveryAddress: paymentIntentDraft?.deliveryAddress ?? null,
			shippingRate: paymentIntentDraft?.shippingRate ?? null,
		});
		const userWithPurchases = await usersCol.findOne({ _id: userObjectId }, { projection: { purchases: 1 } });
		const existingPurchase = userWithPurchases?.purchases?.find((purchase) =>
			matchesStripeWebhookPurchase(purchase, rootId),
		);
		const prevStatus = existingPurchase?.status;
		const duplicateEvent = existingPurchase ? hasStripeWebhookEvent(existingPurchase, event.id) : false;
		const newPurchaseId = paymentIntentDraft?.orderId || rootId;
		const purchaseNotificationId = existingPurchase?.id || newPurchaseId;

		if (!existingPurchase) {
			const purchase: PurchaseDoc = {
				id: newPurchaseId,
				createdAt: new Date(),
				status: derivedStatus,
				amountTotal,
				currency,
				items,
				pricing: paymentIntentDraft
					? {
							subtotal: paymentIntentDraft.subtotal,
							discountTotal: paymentIntentDraft.discountTotal,
							finalSubtotal: paymentIntentDraft.amountTotal,
							shippingTotal: paymentIntentDraft.shippingRate?.fixed_amount.amount ?? 0,
							shippingRate: paymentIntentDraft.shippingRate ?? null,
							couponCode: paymentIntentDraft.couponCode ?? null,
							couponPromotionId: paymentIntentDraft.couponPromotionId ?? null,
							couponCodeId: paymentIntentDraft.couponCodeId ?? null,
						}
					: undefined,
				...shippingSnapshot,
				kind,
				events: [eventDoc],
				relatedIds: buildRelatedIds(related),
			};
			await usersCol.updateOne(
				{ _id: userObjectId, "purchases.id": { $ne: newPurchaseId } },
				{ $push: { purchases: purchase } },
			);
		} else {
			if (!duplicateEvent) {
				const existingPurchaseUpdate: {
					$set: Record<string, unknown>;
					$push: Record<string, unknown>;
					$addToSet?: Record<string, unknown>;
				} = {
					$set: {
						"purchases.$.status": derivedStatus,
					},
					$push: { "purchases.$.events": eventDoc },
				};
				if (related.sessionId) {
					existingPurchaseUpdate.$set["purchases.$.relatedIds.sessionId"] = related.sessionId;
				}
				if (related.paymentIntentId) {
					existingPurchaseUpdate.$set["purchases.$.relatedIds.paymentIntentId"] = related.paymentIntentId;
				}
				if (related.invoiceId) {
					existingPurchaseUpdate.$set["purchases.$.relatedIds.invoiceId"] = related.invoiceId;
				}
				if (related.subscriptionId) {
					existingPurchaseUpdate.$set["purchases.$.relatedIds.subscriptionId"] = related.subscriptionId;
				}
				if (paymentIntentDraft) {
					existingPurchaseUpdate.$set["purchases.$.pricing"] = {
						subtotal: paymentIntentDraft.subtotal,
						discountTotal: paymentIntentDraft.discountTotal,
						finalSubtotal: paymentIntentDraft.amountTotal,
						shippingTotal: paymentIntentDraft.shippingRate?.fixed_amount.amount ?? 0,
						shippingRate: paymentIntentDraft.shippingRate ?? null,
						couponCode: paymentIntentDraft.couponCode ?? null,
						couponPromotionId: paymentIntentDraft.couponPromotionId ?? null,
						couponCodeId: paymentIntentDraft.couponCodeId ?? null,
					};
					existingPurchaseUpdate.$set["purchases.$.deliveryMethod"] = shippingSnapshot.deliveryMethod ?? null;
					existingPurchaseUpdate.$set["purchases.$.deliveryAddress"] =
						shippingSnapshot.deliveryAddress ?? null;
					existingPurchaseUpdate.$set["purchases.$.shippingRate"] = shippingSnapshot.shippingRate ?? null;
				}

				const relatedArrayAddToSet: Record<string, unknown> = {};
				if (related.chargeId) {
					relatedArrayAddToSet["purchases.$.relatedIds.chargeIds"] = related.chargeId;
				}
				if (related.refundId) {
					relatedArrayAddToSet["purchases.$.relatedIds.refundIds"] = related.refundId;
				}
				if (Object.keys(relatedArrayAddToSet).length > 0) {
					existingPurchaseUpdate.$addToSet = relatedArrayAddToSet;
				}

				await usersCol.updateOne(
					{
						_id: userObjectId,
						"purchases.id": existingPurchase.id,
					},
					existingPurchaseUpdate,
				);
			}
		}

		const shouldAuditWebhookStatus =
			!duplicateEvent &&
			AUDITED_ORDER_STATUS_WEBHOOK_TYPES.has(event.type) &&
			(Boolean(prevStatus !== derivedStatus) ||
				!(await db.collection("orderAuditLogs").findOne({
					orderId: purchaseNotificationId,
					action: "order_payment_status_webhook_updated",
					"details.nextStatus": derivedStatus,
				})));

		if (shouldAuditWebhookStatus) {
			try {
				await recordOrderAuditEntry({
					orderId: purchaseNotificationId,
					action: "order_payment_status_webhook_updated",
					actorId: event.id,
					actorRole: "system",
					actorEmail: null,
					details: {
						source: "stripe_webhook",
						webhookType: event.type,
						webhookEventId: event.id,
						previousStatus: prevStatus ?? null,
						nextStatus: derivedStatus,
					},
					createdAt: new Date(),
				});
			} catch (err) {
				console.error("recordOrderAuditEntry failed (webhook status)", err);
			}
		}

		if (
			(kind === "payment_intent" || kind === "checkout.session") &&
			isOrderReceivedEligibleStatus(derivedStatus)
		) {
			try {
				await ensureOrderReceivedEmail(userId, purchaseNotificationId);
			} catch (err) {
				console.error("ensureOrderReceivedEmail failed (webhook)", err);
			}
		}

		if (!existingPurchase) {
			if (shouldNotifyCustomerOrderStatusChange(undefined, derivedStatus)) {
				try {
					await notifyOrderStatusChange(userId, purchaseNotificationId, derivedStatus);
				} catch (err) {
					console.error("notifyOrderStatusChange failed (webhook create)", err);
				}
			}
		} else if (!duplicateEvent && shouldNotifyCustomerOrderStatusChange(prevStatus, derivedStatus)) {
			try {
				await notifyOrderStatusChange(userId, purchaseNotificationId, derivedStatus);
			} catch (err) {
				console.error("notifyOrderStatusChange failed (webhook update)", err);
			}
		}

		if (kind === "payment_intent" && derivedStatus === "succeeded") {
			if (
				paymentIntentDraft?.couponPromotionId &&
				paymentIntentDraft.couponCodeId &&
				paymentIntentDraft.userId
			) {
				try {
					await recordPromotionRedemption({
						promotionId: paymentIntentDraft.couponPromotionId,
						promotionCodeId: paymentIntentDraft.couponCodeId,
						userId: paymentIntentDraft.userId,
						purchaseId: purchaseNotificationId,
						orderDraftId: paymentIntentDraft.paymentIntentId,
					});
				} catch (error) {
					console.error("recordPromotionRedemption failed", error);
				}
			}
			await usersCol.updateOne(
				{ _id: userObjectId },
				{ $unset: { cart: "" }, $set: { updatedAt: new Date() } },
			);
		}
	} catch (e) {
		console.error("Webhook handling error", e);
		await updateWebhookLog({
			eventId: event?.id || null,
			type: event?.type || null,
			status: "failed",
			error: e instanceof Error ? e.stack || e.message : String(e),
		});
		return new Response("Webhook handler failed", { status: 500 });
	}

	await updateWebhookLog({
		eventId: event?.id || null,
		type: event?.type || null,
		status: "processed",
		error: null,
		processedAt: new Date(),
	});

	return new Response("ok", { status: 200 });
}

export const runtime = "nodejs";

function safeParseJson(bodyText: string) {
	try {
		return JSON.parse(bodyText) as unknown;
	} catch {
		return bodyText;
	}
}

function extractStringField(value: unknown, key: string) {
	if (!value || typeof value !== "object") return null;
	const record = value as Record<string, unknown>;
	return typeof record[key] === "string" ? record[key] : null;
}
function buildRelatedIds(related: ExtractedStripeEventContext["related"]): PurchaseDoc["relatedIds"] {
	const out: PurchaseDoc["relatedIds"] = {};
	if (related.sessionId) out.sessionId = related.sessionId;
	if (related.paymentIntentId) out.paymentIntentId = related.paymentIntentId;
	if (related.invoiceId) out.invoiceId = related.invoiceId;
	if (related.subscriptionId) out.subscriptionId = related.subscriptionId;
	if (related.chargeId) out.chargeIds = [related.chargeId];
	if (related.refundId) out.refundIds = [related.refundId];
	return out;
}

function buildUserOwnershipFilters(rootId: string | null, related: ExtractedStripeEventContext["related"]) {
	const identifiers = [
		rootId,
		related.sessionId,
		related.paymentIntentId,
		related.invoiceId,
		related.subscriptionId,
		related.chargeId,
		related.refundId,
	].filter((value): value is string => Boolean(value));

	return identifiers.flatMap((identifier) => [
		{ "purchases.id": identifier },
		{ "purchases.relatedIds.sessionId": identifier },
		{ "purchases.relatedIds.paymentIntentId": identifier },
		{ "purchases.relatedIds.invoiceId": identifier },
		{ "purchases.relatedIds.subscriptionId": identifier },
		{ "purchases.relatedIds.chargeIds": identifier },
		{ "purchases.relatedIds.refundIds": identifier },
	]);
}

interface UserPurchaseEventDoc {
	eventId: string;
	type: string;
	status: string;
	createdAt: Date;
	stripeCreated?: number;
}
interface UserPurchaseItem {
	name: string | null;
	quantity: number;
	unitAmount: number | null;
	priceId: string | null;
}
interface PurchaseDoc {
	id: string;
	createdAt: Date;
	status: string;
	amountTotal: number;
	currency: string;
	items: UserPurchaseItem[];
	kind: string;
	events?: UserPurchaseEventDoc[];
	relatedIds?: {
		sessionId?: string;
		paymentIntentId?: string;
		chargeIds?: string[];
		invoiceId?: string;
		subscriptionId?: string;
		refundIds?: string[];
	};
}
