"use server";

import { ObjectId } from "mongodb";
import Stripe from "stripe";
import { env, publicUrl } from "@/env.mjs";
import { requireAuth } from "@/lib/api-auth";
import { canBuyOnSelolibertaria } from "@/lib/authz";
import { type CheckoutSnapshot, getCheckoutSnapshot } from "@/lib/checkout/cart-snapshot";
import { commerce } from "@/lib/commerce-stripe";
import type { Cart } from "@/lib/commerce-types";
import { getUserPreferredCurrencyById } from "@/lib/currency-preference";
import { getDb } from "@/lib/mongodb";
import { createInternalOrderId } from "@/lib/order-identity";
import { listSavedCardPaymentMethods, type SavedPaymentMethodSummary } from "@/lib/saved-payment-methods";
import { resolveShippingQuotesForDestination, toShippingRate } from "@/lib/shipping";
import type { CheckoutAddress, CheckoutDeliveryMethod } from "@/lib/shipping-core";

export interface TransparentCheckoutIntent {
	publishableKey: string;
	clientSecret: string;
	orderId: string;
	paymentIntentId: string;
	subtotal: number;
	discountTotal: number;
	amountTotal: number;
	currency: string;
	items: CheckoutSnapshot["items"];
	couponCode?: string | null;
	shippingRate?: CheckoutSnapshot["shippingRate"] | null;
	shippingError?: string | null;
	deliveryMethod: CheckoutDeliveryMethod;
	deliveryAddress?: CheckoutAddress | null;
	canSavePaymentMethod: boolean;
	savePaymentMethod: boolean;
	savedPaymentMethods: SavedPaymentMethodSummary[];
}

interface OrderDraftDoc {
	_id: ObjectId;
	orderId: string;
	userId: string;
	paymentIntentId: string;
	stripeCustomerId?: string | null;
	cartHash: string;
	status: string;
	amountTotal: number;
	currency: string;
	items: CheckoutSnapshot["items"];
	shippingRate?: CheckoutSnapshot["shippingRate"] | null;
	shippingError?: string | null;
	deliveryMethod?: CheckoutDeliveryMethod;
	deliveryAddress?: CheckoutAddress | null;
	subtotal?: number;
	discountTotal?: number;
	couponCode?: string | null;
	couponPromotionId?: string | null;
	couponCodeId?: string | null;
	createdAt: Date;
	updatedAt: Date;
	confirmedAt?: Date | null;
	lastStripeEventId?: string | null;
	savePaymentMethod?: boolean;
	paymentMethodSetupUsage?: "on_session" | "off_session" | null;
}

const reusablePaymentIntentStatuses = new Set([
	"requires_payment_method",
	"requires_confirmation",
	"requires_action",
]);

async function getOrCreateStripeCustomer(
	stripe: Stripe,
	snapshot: CheckoutSnapshot,
): Promise<string | undefined> {
	if (snapshot.user.stripeCustomerId) return snapshot.user.stripeCustomerId;
	if (!snapshot.user.email) return undefined;

	const customer = await stripe.customers.create({
		email: snapshot.user.email,
		name: snapshot.user.name,
		phone: snapshot.user.phone,
		metadata: {
			userId: snapshot.userId,
			...(snapshot.user.preferredCurrency ? { preferredCurrency: snapshot.user.preferredCurrency } : {}),
		},
	});

	const db = await getDb();
	await db
		.collection("users")
		.updateOne(
			{ _id: new ObjectId(snapshot.userId) },
			{ $set: { stripeCustomerId: customer.id, updatedAt: new Date() } },
		);

	return customer.id;
}

export async function createTransparentCheckoutIntent(): Promise<
	TransparentCheckoutIntent | { error: string } | { requireAuth: true }
> {
	if (!env.STRIPE_SECRET_KEY) return { error: "Missing Stripe secret key" };
	if (!env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) return { error: "Missing Stripe publishable key" };

	const snapshotResult = await getCheckoutSnapshot();
	if (!snapshotResult.ok) {
		if ("requireAuth" in snapshotResult) return { requireAuth: true };
		return { error: snapshotResult.error };
	}

	const snapshot = snapshotResult.snapshot;
	const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: undefined });
	const stripeCustomerId = await getOrCreateStripeCustomer(stripe, snapshot).catch((error) => {
		console.error("Failed to create stripe customer", error);
		return undefined;
	});
	const savedPaymentMethods = await listSavedCardPaymentMethods(stripe, stripeCustomerId).catch((error) => {
		console.warn("Failed to list saved payment methods", error);
		return [];
	});

	const db = await getDb();
	const drafts = db.collection<OrderDraftDoc>("orderDrafts");
	const existingDraft = await drafts.findOne(
		{
			userId: snapshot.userId,
			cartHash: snapshot.cartHash,
		},
		{ sort: { createdAt: -1 } },
	);

	if (existingDraft?.paymentIntentId) {
		if (existingDraft.status === "processing") {
			return { error: "Payment is already processing. Check your orders for the latest status." };
		}
		if (existingDraft.status === "succeeded") {
			return { error: "Payment was already confirmed. Check your orders for the latest status." };
		}

		try {
			const existingIntent = await stripe.paymentIntents.retrieve(existingDraft.paymentIntentId);
			if (existingIntent.status === "processing") {
				return { error: "Payment is already processing. Check your orders for the latest status." };
			}
			if (existingIntent.status === "succeeded") {
				return { error: "Payment was already confirmed. Check your orders for the latest status." };
			}
			const draftDeliveryMethod =
				existingDraft.deliveryMethod ?? (snapshot.user.address ? "saved-address" : "new-address");
			const draftDeliveryAddress = existingDraft.deliveryAddress ?? snapshot.user.address ?? null;
			const draftShippingRate = existingDraft.shippingRate ?? snapshot.shippingRate ?? null;
			const draftShippingError = existingDraft.shippingError ?? snapshot.shippingError ?? null;
			const draftAmountTotal = existingDraft.amountTotal ?? snapshot.amountTotal;
			if (
				existingIntent.client_secret &&
				reusablePaymentIntentStatuses.has(existingIntent.status) &&
				existingIntent.currency.toUpperCase() === snapshot.currency
			) {
				if (existingIntent.amount !== draftAmountTotal) {
					await stripe.paymentIntents.update(existingIntent.id, {
						amount: draftAmountTotal,
						metadata: {
							...existingIntent.metadata,
							deliveryMethod: draftDeliveryMethod,
							...(draftDeliveryAddress
								? {
										deliveryCountry: draftDeliveryAddress.country ?? "",
										deliveryPostalCode: draftDeliveryAddress.postalCode ?? "",
									}
								: {}),
							...(draftShippingRate
								? {
										shippingProviderCode: draftShippingRate.providerCode,
										shippingServiceCode: draftShippingRate.serviceCode,
									}
								: {}),
						},
					});
				}
				return {
					publishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
					clientSecret: existingIntent.client_secret,
					orderId: existingDraft.orderId,
					paymentIntentId: existingIntent.id,
					subtotal: existingDraft.subtotal ?? snapshot.subtotal,
					discountTotal: existingDraft.discountTotal ?? snapshot.discountTotal,
					amountTotal: draftAmountTotal,
					currency: existingDraft.currency ?? snapshot.currency,
					items: snapshot.items,
					couponCode: existingDraft.couponCode ?? snapshot.couponCode ?? null,
					shippingRate: draftShippingRate,
					shippingError: draftShippingError,
					deliveryMethod: draftDeliveryMethod,
					deliveryAddress: draftDeliveryAddress,
					canSavePaymentMethod: Boolean(existingIntent.customer),
					savePaymentMethod: existingIntent.setup_future_usage === "on_session",
					savedPaymentMethods,
				};
			}
		} catch (error) {
			console.warn("Failed to retrieve reusable payment intent", error);
		}
	}

	const orderDraftId = new ObjectId();
	const internalOrderId = createInternalOrderId();
	const intent = await stripe.paymentIntents.create(
		{
			amount: existingDraft?.amountTotal ?? snapshot.amountTotal,
			currency: snapshot.currency.toLowerCase(),
			customer: stripeCustomerId,
			receipt_email: stripeCustomerId ? undefined : snapshot.user.email,
			automatic_payment_methods: { enabled: true },
			metadata: {
				userId: snapshot.userId,
				orderDraftId: orderDraftId.toHexString(),
				orderId: internalOrderId,
				cartHash: snapshot.cartHash,
				integration: "transparent_checkout",
				...(snapshot.couponCode ? { couponCode: snapshot.couponCode } : {}),
				...(snapshot.couponPromotionId ? { couponPromotionId: snapshot.couponPromotionId } : {}),
				...(snapshot.couponCodeId ? { couponCodeId: snapshot.couponCodeId } : {}),
				...(existingDraft?.deliveryMethod ? { deliveryMethod: existingDraft.deliveryMethod } : {}),
				...(existingDraft?.deliveryAddress?.country
					? {
							deliveryCountry: existingDraft.deliveryAddress.country,
							deliveryPostalCode: existingDraft.deliveryAddress.postalCode ?? "",
						}
					: snapshot.user.address?.country
						? {
								deliveryCountry: snapshot.user.address.country ?? "",
								deliveryPostalCode: snapshot.user.address.postalCode ?? "",
							}
						: {}),
				...(existingDraft?.shippingRate
					? {
							shippingProviderCode: existingDraft.shippingRate.providerCode,
							shippingServiceCode: existingDraft.shippingRate.serviceCode,
						}
					: snapshot.shippingRate
						? {
								shippingProviderCode: snapshot.shippingRate.providerCode,
								shippingServiceCode: snapshot.shippingRate.serviceCode,
							}
						: {}),
			},
		},
		{
			idempotencyKey: `transparent-checkout:${snapshot.userId}:${snapshot.cartHash}`,
		},
	);

	if (!intent.client_secret) return { error: "Could not create payment intent" };

	const persistedDraftId = intent.metadata.orderDraftId
		? new ObjectId(intent.metadata.orderDraftId)
		: orderDraftId;

	await drafts.updateOne(
		{ _id: persistedDraftId },
		{
			$setOnInsert: {
				_id: persistedDraftId,
				createdAt: new Date(),
			},
			$set: {
				userId: snapshot.userId,
				orderId: existingDraft?.orderId || internalOrderId,
				paymentIntentId: intent.id,
				stripeCustomerId: stripeCustomerId || null,
				cartHash: existingDraft?.cartHash ?? snapshot.cartHash,
				status: intent.status,
				subtotal: existingDraft?.subtotal ?? snapshot.subtotal,
				discountTotal: existingDraft?.discountTotal ?? snapshot.discountTotal,
				amountTotal: existingDraft?.amountTotal ?? snapshot.amountTotal,
				currency: existingDraft?.currency ?? snapshot.currency,
				items: snapshot.items,
				shippingRate: existingDraft?.shippingRate ?? snapshot.shippingRate ?? null,
				shippingError: existingDraft?.shippingError ?? snapshot.shippingError ?? null,
				deliveryMethod:
					existingDraft?.deliveryMethod ?? (snapshot.user.address ? "saved-address" : "new-address"),
				deliveryAddress: existingDraft?.deliveryAddress ?? snapshot.user.address ?? null,
				couponCode: snapshot.couponCode ?? null,
				couponPromotionId: snapshot.couponPromotionId ?? null,
				couponCodeId: snapshot.couponCodeId ?? null,
				updatedAt: new Date(),
				confirmedAt: intent.status === "succeeded" ? new Date() : null,
				lastStripeEventId: null,
				savePaymentMethod: false,
				paymentMethodSetupUsage: null,
			},
		},
		{ upsert: true },
	);

	return {
		publishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
		clientSecret: intent.client_secret,
		orderId: existingDraft?.orderId || internalOrderId,
		paymentIntentId: intent.id,
		subtotal: existingDraft?.subtotal ?? snapshot.subtotal,
		discountTotal: existingDraft?.discountTotal ?? snapshot.discountTotal,
		amountTotal: existingDraft?.amountTotal ?? snapshot.amountTotal,
		currency: existingDraft?.currency ?? snapshot.currency,
		items: snapshot.items,
		couponCode: snapshot.couponCode ?? null,
		shippingRate: existingDraft?.shippingRate ?? snapshot.shippingRate ?? null,
		shippingError: existingDraft?.shippingError ?? snapshot.shippingError ?? null,
		deliveryMethod:
			existingDraft?.deliveryMethod ?? (snapshot.user.address ? "saved-address" : "new-address"),
		deliveryAddress: existingDraft?.deliveryAddress ?? snapshot.user.address ?? null,
		canSavePaymentMethod: Boolean(intent.customer),
		savePaymentMethod: false,
		savedPaymentMethods,
	};
}

function normalizeCheckoutAddress(address?: CheckoutAddress | null): CheckoutAddress | null {
	if (!address) return null;
	const value = {
		line1: address.line1?.trim() || "",
		line2: address.line2?.trim() || "",
		number: address.number?.trim() || "",
		complement: address.complement?.trim() || "",
		district: address.district?.trim() || "",
		city: address.city?.trim() || "",
		state: address.state?.trim() || "",
		postalCode: address.postalCode?.trim() || "",
		country: address.country?.trim().toUpperCase() || "",
	};
	if (!value.country || !value.postalCode) return null;
	return value;
}

export async function updateCheckoutDeliverySelection(input: {
	paymentIntentId: string;
	orderId?: string | null;
	deliveryMethod: CheckoutDeliveryMethod;
	address?: CheckoutAddress | null;
}): Promise<
	| {
			ok: true;
			orderId: string;
			paymentIntentId: string;
			deliveryMethod: CheckoutDeliveryMethod;
			deliveryAddress: CheckoutAddress | null;
			shippingRate: CheckoutSnapshot["shippingRate"] | null;
			shippingError: string | null;
			subtotal: number;
			discountTotal: number;
			amountTotal: number;
			currency: string;
	  }
	| { error: string }
	| { requireAuth: true }
> {
	if (!env.STRIPE_SECRET_KEY) return { error: "Missing Stripe secret key" };
	if (!input.paymentIntentId.startsWith("pi_")) return { error: "Invalid payment intent" };

	const auth = await requireAuth();
	if ("error" in auth) return { requireAuth: true };
	if (!canBuyOnSelolibertaria(auth.session.role))
		return { error: "Backoffice users cannot perform purchases." };

	const userId = auth.session.sub as string;
	const db = await getDb();
	const draft = input.orderId?.startsWith("ord_")
		? await db.collection<OrderDraftDoc>("orderDrafts").findOne({ orderId: input.orderId, userId })
		: await db.collection<OrderDraftDoc>("orderDrafts").findOne({ paymentIntentId: input.paymentIntentId });
	if (!draft || draft.userId !== userId) return { error: "Payment intent not found" };

	const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: undefined });
	const intent = await stripe.paymentIntents.retrieve(input.paymentIntentId);
	if (intent.metadata?.userId && intent.metadata.userId !== userId) {
		return { error: "Payment intent does not belong to user" };
	}
	if (!reusablePaymentIntentStatuses.has(intent.status)) {
		return { error: "Delivery selection can no longer be changed" };
	}

	const user = await db.collection("users").findOne<{
		address?: CheckoutAddress | null;
	}>({ _id: new ObjectId(userId) }, { projection: { address: 1 } });

	const savedAddress = normalizeCheckoutAddress(user?.address ?? null);
	const selectedAddress =
		input.deliveryMethod === "saved-address"
			? savedAddress
			: input.deliveryMethod === "new-address"
				? normalizeCheckoutAddress(input.address ?? null)
				: null;
	if (input.deliveryMethod === "saved-address" && !savedAddress) {
		return { error: "No saved delivery address found" };
	}
	if (input.deliveryMethod === "new-address" && !selectedAddress) {
		return { error: "Please fill a valid delivery address" };
	}

	const baseTotal = Math.max(0, (draft.subtotal ?? draft.amountTotal) - (draft.discountTotal ?? 0));
	const shippingResolution = await resolveShippingQuotesForDestination({
		destination: selectedAddress,
		subtotal: baseTotal,
		currency: draft.currency,
		items: (draft.items ?? []).map((item) => ({
			productId: item.productId,
			variantId: item.variantId,
			quantity: item.quantity,
			price: item.unitAmount,
		})),
		deliveryMethod: input.deliveryMethod,
	});
	const shippingRate = toShippingRate(shippingResolution.selected);
	const quotedShippingRate = shippingRate
		? {
				...shippingRate,
				quotedAt: new Date().toISOString(),
			}
		: null;
	const shippingAmount = quotedShippingRate?.fixed_amount.amount ?? 0;
	const nextAmountTotal = baseTotal + shippingAmount;
	const shippingError = shippingResolution.error ?? null;

	await stripe.paymentIntents.update(input.paymentIntentId, {
		amount: nextAmountTotal,
		metadata: {
			...intent.metadata,
			deliveryMethod: input.deliveryMethod,
			...(selectedAddress
				? {
						deliveryCountry: selectedAddress.country ?? "",
						deliveryPostalCode: selectedAddress.postalCode ?? "",
					}
				: {}),
			...(quotedShippingRate
				? {
						shippingProviderCode: quotedShippingRate.providerCode,
						shippingServiceCode: quotedShippingRate.serviceCode,
					}
				: {}),
		},
	});

	await db.collection<OrderDraftDoc>("orderDrafts").updateOne(
		{ paymentIntentId: input.paymentIntentId },
		{
			$set: {
				deliveryMethod: input.deliveryMethod,
				deliveryAddress: selectedAddress,
				shippingRate: quotedShippingRate,
				shippingError,
				amountTotal: nextAmountTotal,
				updatedAt: new Date(),
			},
		},
	);

	return {
		ok: true,
		orderId: draft.orderId,
		paymentIntentId: input.paymentIntentId,
		deliveryMethod: input.deliveryMethod,
		deliveryAddress: selectedAddress,
		shippingRate: quotedShippingRate,
		shippingError,
		subtotal: draft.subtotal ?? baseTotal,
		discountTotal: draft.discountTotal ?? 0,
		amountTotal: nextAmountTotal,
		currency: draft.currency,
	};
}

export async function updatePaymentMethodSavingPreference({
	paymentIntentId,
	savePaymentMethod,
}: {
	paymentIntentId: string;
	savePaymentMethod: boolean;
}): Promise<{ ok: true } | { error: string } | { requireAuth: true }> {
	if (!env.STRIPE_SECRET_KEY) return { error: "Missing Stripe secret key" };
	if (!paymentIntentId.startsWith("pi_")) return { error: "Invalid payment intent" };

	const auth = await requireAuth();
	if ("error" in auth) return { requireAuth: true };
	if (!canBuyOnSelolibertaria(auth.session.role))
		return { error: "Backoffice users cannot perform purchases." };

	const userId = auth.session.sub as string;
	const db = await getDb();
	const draft = await db.collection<OrderDraftDoc>("orderDrafts").findOne({ paymentIntentId });
	if (!draft || draft.userId !== userId) return { error: "Payment intent not found" };
	if (!reusablePaymentIntentStatuses.has(draft.status)) {
		return { error: "Payment method preference can no longer be changed" };
	}

	const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: undefined });
	const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
	if (intent.metadata?.userId && intent.metadata.userId !== userId) {
		return { error: "Payment intent does not belong to user" };
	}
	if (!intent.customer) return { error: "Missing Stripe customer for payment method saving" };
	if (!reusablePaymentIntentStatuses.has(intent.status)) {
		return { error: "Payment method preference can no longer be changed" };
	}

	await stripe.paymentIntents.update(paymentIntentId, {
		setup_future_usage: savePaymentMethod ? "on_session" : undefined,
		payment_method_options: {
			card: {
				setup_future_usage: savePaymentMethod ? "on_session" : "none",
			},
		},
		metadata: {
			...intent.metadata,
			savePaymentMethod: savePaymentMethod ? "true" : "false",
			paymentMethodSetupUsage: savePaymentMethod ? "on_session" : "none",
		},
	});

	await db.collection("orderDrafts").updateOne(
		{ paymentIntentId },
		{
			$set: {
				savePaymentMethod,
				paymentMethodSetupUsage: savePaymentMethod ? "on_session" : null,
				updatedAt: new Date(),
			},
		},
	);

	return { ok: true };
}

export async function createCheckoutSession(): Promise<
	{ url: string } | { error: string } | { requireAuth: true }
> {
	if (!env.STRIPE_SECRET_KEY) {
		return { error: "Missing Stripe secret key" };
	}

	const auth = await requireAuth();
	if ("error" in auth) return { requireAuth: true };
	if (!canBuyOnSelolibertaria(auth.session.role))
		return { error: "Backoffice users cannot perform purchases." };

	const userId = auth.session.sub as string;
	const db = await getDb();
	const user = await db.collection("users").findOne<{
		cart?: { items: { productId: string; variantId: string; quantity: number }[] };
		email?: string;
		name?: string;
		phone?: string;
		stripeCustomerId?: string;
		verified?: boolean;
		purchases?: Array<unknown>;
	}>(
		{ _id: new ObjectId(userId) },
		{ projection: { cart: 1, email: 1, name: 1, phone: 1, stripeCustomerId: 1, verified: 1, purchases: 1 } },
	);

	// If user is unverified and already has purchases, block further checkout attempts
	if (user && user.verified === false) {
		const hasPurchases = Array.isArray(user.purchases) && user.purchases.length > 0;
		if (hasPurchases)
			return { error: "E-mail não verificado. Confirme seu e-mail para realizar novas compras." };
	}
	const minimal = user?.cart?.items || [];
	if (minimal.length === 0) {
		// Fallback: attempt to import cookie cart (guest cart) on first checkout after signup/login
		try {
			const { getCartId, clearCartId, getCartCookieItems } = await import("@/lib/cart-cookies");
			const [cartId, cookieItems] = await Promise.all([getCartId(), getCartCookieItems()]);
			const aggregated = new Map<string, { productId: string; variantId: string; quantity: number }>();
			if (cookieItems && cookieItems.length > 0) {
				for (const item of cookieItems) {
					const key = item.variantId;
					const current = aggregated.get(key);
					if (current) current.quantity += item.quantity;
					else aggregated.set(key, { ...item });
				}
			}
			if (cartId) {
				const guestCart = commerce.cart.get({ cartId });
				if (guestCart && guestCart.items.length > 0) {
					for (const line of guestCart.items) {
						const key = line.variantId;
						const current = aggregated.get(key);
						if (current) current.quantity += line.quantity;
						else
							aggregated.set(key, {
								productId: line.productId,
								variantId: line.variantId,
								quantity: line.quantity,
							});
					}
				}
			}
			if (aggregated.size > 0) {
				const mergedItems = Array.from(aggregated.values());
				await db
					.collection("users")
					.updateOne(
						{ _id: new ObjectId(userId) },
						{ $set: { cart: { items: mergedItems }, updatedAt: new Date() } },
					);
				await clearCartId();
				return await createCheckoutSession();
			}
		} catch (e) {
			console.warn("Guest cart fallback import failed", e);
		}
		return { error: "Empty cart" };
	}

	const enrichedItems: Cart["items"] = [];
	for (const m of minimal) {
		const resolved = await commerce.variant
			.resolve({ id: m.variantId })
			.catch(async () => commerce.variant.resolve({ id: m.productId }).catch(() => null));
		if (!resolved) continue;
		const { product, variant } = resolved;
		enrichedItems.push({
			id: m.variantId,
			productId: product.id,
			variantId: variant.id,
			quantity: m.quantity,
			price: variant.price || product.price || 0,
			product: { id: product.id, name: product.name, images: product.images, summary: product.summary },
		});
	}
	if (enrichedItems.length === 0) return { error: "Empty cart" };
	const currency = (env.STRIPE_CURRENCY || "USD").toUpperCase();
	const cart: Cart = {
		id: "user-cart",
		items: enrichedItems,
		total: enrichedItems.reduce((s, i) => s + i.price * i.quantity, 0),
		currency: currency.toUpperCase(),
	};

	const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: undefined });
	const baseUrl = process.env.NEXT_PUBLIC_URL || publicUrl;

	let stripeCustomerId = user?.stripeCustomerId;
	if (!stripeCustomerId && user?.email) {
		const preferredCurrency = await getUserPreferredCurrencyById(userId);
		try {
			const customer = await stripe.customers.create({
				email: user.email,
				name: user.name,
				phone: user.phone,
				metadata: {
					userId,
					...(preferredCurrency ? { preferredCurrency } : {}),
				},
			});
			stripeCustomerId = customer.id;
			await db
				.collection("users")
				.updateOne({ _id: new ObjectId(userId) }, { $set: { stripeCustomerId, updatedAt: new Date() } });
		} catch (e) {
			console.error("Failed to create stripe customer", e);
		}
	}

	const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.items.map((item) => ({
		price: item.variantId || item.productId,
		quantity: item.quantity,
	}));

	try {
		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			line_items,
			customer: stripeCustomerId,
			customer_email: !stripeCustomerId ? user?.email : undefined,
			phone_number_collection: user?.phone ? { enabled: true } : undefined,
			metadata: { userId },
			payment_intent_data: { metadata: { userId } },
			success_url: `${baseUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${baseUrl}/?checkout=cancel`,
		});
		if (!session.url) {
			return { error: "Could not create checkout session" };
		}
		return { url: session.url };
	} catch (err) {
		console.error("Error creating checkout session", err);
		return { error: (err as Error).message };
	}
}
