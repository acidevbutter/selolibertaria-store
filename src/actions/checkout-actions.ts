"use server";

import { ObjectId } from "mongodb";
import Stripe from "stripe";
import { env, publicUrl } from "@/env.mjs";
import { requireAuth } from "@/lib/api-auth";
import { canBuyOnSelolibertaria } from "@/lib/authz";
import { type CheckoutSnapshot, getCheckoutSnapshot } from "@/lib/checkout/cart-snapshot";
import { buildMercadoPagoPaymentAttemptIdempotencyKey } from "@/lib/checkout/mercado-pago-idempotency";
import { buildTransparentCheckoutIdempotencyKey } from "@/lib/checkout/transparent-checkout-idempotency";
import { type CheckoutBuyerDraft, normalizeCheckoutBuyer } from "@/lib/checkout-buyer";
import { commerce } from "@/lib/commerce-stripe";
import type { Cart } from "@/lib/commerce-types";
import { getUserPreferredCurrencyById } from "@/lib/currency-preference";
import {
	createMercadoPagoPayment,
	getMercadoPagoNotificationUrl,
	type MercadoPagoCreatePaymentInput,
	mapMercadoPagoStatus,
} from "@/lib/mercado-pago";
import { getDb } from "@/lib/mongodb";
import { createInternalOrderId } from "@/lib/order-identity";
import { listSavedCardPaymentMethods, type SavedPaymentMethodSummary } from "@/lib/saved-payment-methods";
import { resolveShippingQuotesForDestination, toShippingRate } from "@/lib/shipping";
import type { CheckoutAddress, CheckoutDeliveryMethod } from "@/lib/shipping-core";

export interface TransparentCheckoutIntent {
	paymentProvider?: "stripe" | "mercado_pago";
	publishableKey: string;
	clientSecret?: string;
	orderId: string;
	paymentIntentId: string;
	isAuthenticated: boolean;
	buyer: {
		fullName: string;
		email: string;
		cpf: string;
		phone: string;
	};
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
	checkoutOwnerKey: string;
	userId?: string | null;
	paymentIntentId?: string | null;
	paymentProvider?: "stripe" | "mercado_pago";
	mercadoPagoPaymentId?: string | null;
	stripeCustomerId?: string | null;
	cartHash: string;
	status: string;
	buyer?: CheckoutBuyerDraft | null;
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
	lastMercadoPagoEventId?: string | null;
	savePaymentMethod?: boolean;
	paymentMethodSetupUsage?: "on_session" | "off_session" | null;
}

const reusablePaymentIntentStatuses = new Set<Stripe.PaymentIntent.Status>([
	"requires_payment_method",
	"requires_confirmation",
	"requires_action",
]);

async function getOrCreateStripeCustomer(
	stripe: Stripe,
	snapshot: CheckoutSnapshot,
): Promise<string | undefined> {
	if (!snapshot.isAuthenticated || !snapshot.userId) return undefined;
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

function getDefaultBuyer(snapshot: CheckoutSnapshot, draft?: OrderDraftDoc | null) {
	return {
		fullName: draft?.buyer?.fullName ?? snapshot.user.name ?? "",
		email: draft?.buyer?.email ?? snapshot.user.email ?? "",
		cpf: draft?.buyer?.cpf ?? snapshot.user.cpf ?? "",
		phone: draft?.buyer?.phone ?? snapshot.user.phone ?? "",
	};
}

async function resolveDraftAccess(input: {
	paymentIntentId?: string | null;
	orderId?: string | null;
}): Promise<{ draft: OrderDraftDoc; snapshot: CheckoutSnapshot } | { error: string }> {
	const snapshotResult = await getCheckoutSnapshot();
	if (!snapshotResult.ok) {
		return { error: snapshotResult.error };
	}

	const snapshot = snapshotResult.snapshot;
	const db = await getDb();
	const draft = input.orderId?.startsWith("ord_")
		? await db.collection<OrderDraftDoc>("orderDrafts").findOne({ orderId: input.orderId })
		: input.paymentIntentId
			? await db.collection<OrderDraftDoc>("orderDrafts").findOne({ paymentIntentId: input.paymentIntentId })
			: null;

	if (!draft) {
		return { error: "Payment intent not found" };
	}

	if (draft.checkoutOwnerKey !== snapshot.checkoutOwnerKey) {
		return { error: "Checkout access is no longer valid" };
	}

	return { draft, snapshot };
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

function normalizeBrazilOnlyCheckoutAddress(address?: CheckoutAddress | null): CheckoutAddress | null {
	const normalized = normalizeCheckoutAddress(address);
	if (!normalized) return null;
	return {
		...normalized,
		country: "BR",
	};
}

function splitBuyerName(fullName: string) {
	const parts = fullName.trim().split(/\s+/).filter(Boolean);
	if (parts.length <= 1) return { firstName: parts[0] ?? fullName.trim(), lastName: "" };
	return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function toMercadoPagoAmount(amountInCents: number) {
	return Number((Math.max(0, amountInCents) / 100).toFixed(2));
}

function toShippingQuoteItems(items: CheckoutSnapshot["items"]) {
	return items.map((item) => ({
		productId: item.productId,
		variantId: item.variantId,
		quantity: item.quantity,
		price: item.unitAmount,
		productType: item.productType ?? null,
		format: item.format ?? null,
	}));
}

async function createMercadoPagoTransparentCheckoutIntent(): Promise<
	TransparentCheckoutIntent | { error: string }
> {
	if (!env.MERCADO_PAGO_ACCESS_TOKEN) return { error: "Mercado Pago não configurado" };
	if (!env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) return { error: "Public Key do Mercado Pago ausente" };

	const snapshotResult = await getCheckoutSnapshot();
	if (!snapshotResult.ok) {
		return { error: snapshotResult.error };
	}

	const snapshot = snapshotResult.snapshot;
	if (snapshot.currency.toUpperCase() !== "BRL") {
		return { error: "Mercado Pago está disponível apenas para pagamentos em BRL" };
	}

	const db = await getDb();
	const drafts = db.collection<OrderDraftDoc>("orderDrafts");
	const existingDraft = await drafts.findOne(
		{
			checkoutOwnerKey: snapshot.checkoutOwnerKey,
			cartHash: snapshot.cartHash,
			paymentProvider: "mercado_pago",
		},
		{ sort: { createdAt: -1 } },
	);

	const savedDeliveryAddress = normalizeCheckoutAddress(snapshot.user.address ?? null);
	const existingDraftAddress = normalizeBrazilOnlyCheckoutAddress(existingDraft?.deliveryAddress ?? null);
	const draftDeliveryMethod =
		existingDraft?.deliveryMethod === "pickup"
			? "pickup"
			: existingDraft?.deliveryMethod === "saved-address"
				? savedDeliveryAddress?.country === "BR"
					? "saved-address"
					: "new-address"
				: existingDraft?.deliveryMethod === "new-address"
					? "new-address"
					: savedDeliveryAddress?.country === "BR"
						? "saved-address"
						: "new-address";
	const draftDeliveryAddress =
		draftDeliveryMethod === "pickup"
			? null
			: draftDeliveryMethod === "saved-address"
				? savedDeliveryAddress
				: existingDraftAddress;
	const draftShippingRate =
		draftDeliveryMethod === "pickup" || draftDeliveryAddress
			? (existingDraft?.shippingRate ?? snapshot.shippingRate ?? null)
			: null;
	const draftShippingError =
		draftDeliveryMethod === "pickup" || draftDeliveryAddress
			? (existingDraft?.shippingError ?? snapshot.shippingError ?? null)
			: null;
	const draftAmountTotal = existingDraft?.amountTotal ?? snapshot.amountTotal;
	const buyer = getDefaultBuyer(snapshot, existingDraft);
	const orderDraftId = existingDraft?._id ?? new ObjectId();
	const internalOrderId = existingDraft?.orderId || createInternalOrderId();
	const paymentReferenceId = existingDraft?.paymentIntentId || `mp_draft_${internalOrderId}`;

	await drafts.updateOne(
		{ _id: orderDraftId },
		{
			$setOnInsert: {
				_id: orderDraftId,
				createdAt: new Date(),
			},
			$set: {
				checkoutOwnerKey: snapshot.checkoutOwnerKey,
				userId: snapshot.userId ?? null,
				orderId: internalOrderId,
				paymentIntentId: paymentReferenceId,
				paymentProvider: "mercado_pago",
				mercadoPagoPaymentId: existingDraft?.mercadoPagoPaymentId ?? null,
				buyer,
				cartHash: existingDraft?.cartHash ?? snapshot.cartHash,
				status: existingDraft?.status ?? "requires_payment_method",
				subtotal: existingDraft?.subtotal ?? snapshot.subtotal,
				discountTotal: existingDraft?.discountTotal ?? snapshot.discountTotal,
				amountTotal: draftAmountTotal,
				currency: existingDraft?.currency ?? snapshot.currency,
				items: snapshot.items,
				shippingRate: draftShippingRate,
				shippingError: draftShippingError,
				deliveryMethod: draftDeliveryMethod,
				deliveryAddress: draftDeliveryAddress,
				couponCode: snapshot.couponCode ?? null,
				couponPromotionId: snapshot.couponPromotionId ?? null,
				couponCodeId: snapshot.couponCodeId ?? null,
				updatedAt: new Date(),
				confirmedAt: null,
				savePaymentMethod: false,
				paymentMethodSetupUsage: null,
			},
		},
		{ upsert: true },
	);

	return {
		paymentProvider: "mercado_pago",
		publishableKey: env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY,
		orderId: internalOrderId,
		paymentIntentId: paymentReferenceId,
		isAuthenticated: snapshot.isAuthenticated,
		buyer,
		subtotal: existingDraft?.subtotal ?? snapshot.subtotal,
		discountTotal: existingDraft?.discountTotal ?? snapshot.discountTotal,
		amountTotal: draftAmountTotal,
		currency: existingDraft?.currency ?? snapshot.currency,
		items: snapshot.items,
		couponCode: snapshot.couponCode ?? null,
		shippingRate: draftShippingRate,
		shippingError: draftShippingError,
		deliveryMethod: draftDeliveryMethod,
		deliveryAddress: draftDeliveryAddress,
		canSavePaymentMethod: false,
		savePaymentMethod: false,
		savedPaymentMethods: [],
	};
}

export async function submitMercadoPagoCheckoutPayment(input: {
	orderId: string;
	paymentData: {
		payment_method_id?: string;
		token?: string;
		installments?: number;
		issuer_id?: string;
		payer?: {
			email?: string;
			identification?: {
				type?: string;
				number?: string;
			};
		};
	};
}): Promise<
	| {
			ok: true;
			orderId: string;
			paymentId: string;
			status: string;
			qrCode?: string | null;
			qrCodeBase64?: string | null;
			ticketUrl?: string | null;
	  }
	| { error: string }
> {
	if (env.CHECKOUT_PAYMENT_PROVIDER !== "mercado_pago") return { error: "Mercado Pago não está ativo" };
	if (!env.MERCADO_PAGO_ACCESS_TOKEN) return { error: "Mercado Pago não configurado" };
	if (!input.orderId.startsWith("ord_")) return { error: "Pedido inválido" };

	const access = await resolveDraftAccess({ orderId: input.orderId, paymentIntentId: null });
	if ("error" in access) return { error: access.error };

	const { draft, snapshot } = access;
	if (draft.paymentProvider !== "mercado_pago") return { error: "Pedido não pertence ao Mercado Pago" };
	if (draft.status === "succeeded" || draft.status === "paid") return { error: "Pagamento já confirmado" };
	if (draft.status === "processing") return { error: "Pagamento em processamento" };

	let buyer: CheckoutBuyerDraft;
	try {
		buyer = normalizeCheckoutBuyer(draft.buyer ?? snapshot.user);
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Dados da compra inválidos" };
	}

	const paymentMethodId = input.paymentData.payment_method_id?.trim();
	if (!paymentMethodId) return { error: "Meio de pagamento ausente" };

	const { firstName, lastName } = splitBuyerName(buyer.fullName);
	const cpf = buyer.cpf.replace(/\D/g, "");
	const body: MercadoPagoCreatePaymentInput = {
		transaction_amount: toMercadoPagoAmount(draft.amountTotal),
		description: `Pedido ${draft.orderId} - Selo Libertária`,
		payment_method_id: paymentMethodId,
		external_reference: draft.orderId,
		notification_url: getMercadoPagoNotificationUrl(),
		payer: {
			email: buyer.email,
			first_name: firstName,
			last_name: lastName,
			identification: {
				type: input.paymentData.payer?.identification?.type || "CPF",
				number: input.paymentData.payer?.identification?.number?.replace(/\D/g, "") || cpf,
			},
		},
		metadata: {
			orderId: draft.orderId,
			checkoutOwnerKey: draft.checkoutOwnerKey,
			cartHash: draft.cartHash,
			integration: "transparent_checkout_mercado_pago",
			...(draft.userId ? { userId: draft.userId } : {}),
			...(draft.couponCode ? { couponCode: draft.couponCode } : {}),
			...(draft.couponPromotionId ? { couponPromotionId: draft.couponPromotionId } : {}),
			...(draft.couponCodeId ? { couponCodeId: draft.couponCodeId } : {}),
		},
	};

	if (input.paymentData.token) body.token = input.paymentData.token;
	if (input.paymentData.installments) body.installments = input.paymentData.installments;
	if (input.paymentData.issuer_id) body.issuer_id = input.paymentData.issuer_id;

	const idempotencyKey = buildMercadoPagoPaymentAttemptIdempotencyKey({
		orderId: draft.orderId,
		checkoutOwnerKey: draft.checkoutOwnerKey,
		cartHash: draft.cartHash,
		amountTotal: draft.amountTotal,
		currency: draft.currency,
		paymentMethodId,
		buyerEmail: buyer.email,
		deliveryMethod: draft.deliveryMethod ?? null,
		deliveryAddress: draft.deliveryAddress ?? null,
		shippingRate: draft.shippingRate ?? null,
	});

	try {
		const payment = await createMercadoPagoPayment(body, idempotencyKey);
		const paymentId = payment.id ? String(payment.id) : "";
		if (!paymentId) return { error: "Mercado Pago não retornou ID do pagamento" };
		const status = mapMercadoPagoStatus(payment.status);
		const qrData = payment.point_of_interaction?.transaction_data;

		await (await getDb()).collection<OrderDraftDoc>("orderDrafts").updateOne(
			{ orderId: draft.orderId },
			{
				$set: {
					userId: snapshot.userId ?? draft.userId ?? null,
					buyer,
					status,
					mercadoPagoPaymentId: paymentId,
					"mercadoPago.status": payment.status ?? null,
					"mercadoPago.statusDetail": payment.status_detail ?? null,
					"mercadoPago.paymentMethodId": payment.payment_method_id ?? paymentMethodId,
					"mercadoPago.idempotencyKey": idempotencyKey,
					updatedAt: new Date(),
					confirmedAt: status === "succeeded" ? new Date() : null,
				},
			},
		);

		return {
			ok: true,
			orderId: draft.orderId,
			paymentId,
			status,
			qrCode: qrData?.qr_code ?? null,
			qrCodeBase64: qrData?.qr_code_base64 ?? null,
			ticketUrl: qrData?.ticket_url ?? null,
		};
	} catch (error) {
		await (await getDb()).collection<OrderDraftDoc>("orderDrafts").updateOne(
			{ orderId: draft.orderId },
			{
				$set: {
					status: "failed",
					"mercadoPago.lastError": error instanceof Error ? error.message : "Falha no pagamento",
					updatedAt: new Date(),
				},
			},
		);
		return { error: "Não foi possível criar o pagamento no Mercado Pago" };
	}
}

export async function createTransparentCheckoutIntent(): Promise<
	TransparentCheckoutIntent | { error: string }
> {
	if (env.CHECKOUT_PAYMENT_PROVIDER === "mercado_pago") {
		return createMercadoPagoTransparentCheckoutIntent();
	}

	if (!env.STRIPE_SECRET_KEY) return { error: "Missing Stripe secret key" };
	if (!env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) return { error: "Missing Stripe publishable key" };

	const snapshotResult = await getCheckoutSnapshot();
	if (!snapshotResult.ok) {
		return { error: snapshotResult.error };
	}

	const snapshot = snapshotResult.snapshot;
	const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: undefined });
	const stripeCustomerId = await getOrCreateStripeCustomer(stripe, snapshot).catch((error) => {
		console.error("Failed create stripe customer", error);
		return undefined;
	});
	const savedPaymentMethods =
		snapshot.isAuthenticated && stripeCustomerId
			? await listSavedCardPaymentMethods(stripe, stripeCustomerId).catch((error) => {
					console.warn("Failed list saved payment methods", error);
					return [];
				})
			: [];

	const db = await getDb();
	const drafts = db.collection<OrderDraftDoc>("orderDrafts");
	const existingDraft = await drafts.findOne(
		{
			checkoutOwnerKey: snapshot.checkoutOwnerKey,
			cartHash: snapshot.cartHash,
		},
		{ sort: { createdAt: -1 } },
	);

	const savedDeliveryAddress = normalizeCheckoutAddress(snapshot.user.address ?? null);
	const existingDraftAddress = normalizeBrazilOnlyCheckoutAddress(existingDraft?.deliveryAddress ?? null);
	const draftDeliveryMethod =
		existingDraft?.deliveryMethod === "pickup"
			? "pickup"
			: existingDraft?.deliveryMethod === "saved-address"
				? savedDeliveryAddress?.country === "BR"
					? "saved-address"
					: "new-address"
				: existingDraft?.deliveryMethod === "new-address"
					? "new-address"
					: savedDeliveryAddress?.country === "BR"
						? "saved-address"
						: "new-address";
	const draftDeliveryAddress =
		draftDeliveryMethod === "pickup"
			? null
			: draftDeliveryMethod === "saved-address"
				? savedDeliveryAddress
				: existingDraftAddress;
	const draftShippingRate =
		draftDeliveryMethod === "pickup" || draftDeliveryAddress
			? (existingDraft?.shippingRate ?? snapshot.shippingRate ?? null)
			: null;
	const draftShippingError =
		draftDeliveryMethod === "pickup" || draftDeliveryAddress
			? (existingDraft?.shippingError ?? snapshot.shippingError ?? null)
			: null;
	const draftAmountTotal = existingDraft?.amountTotal ?? snapshot.amountTotal;
	const buyer = getDefaultBuyer(snapshot, existingDraft);

	if (existingDraft?.paymentIntentId) {
		if (existingDraft.status === "processing") {
			return {
				error: "Payment is already processing. Check your orders for latest status.",
			};
		}
		if (existingDraft.status === "succeeded") {
			return {
				error: "Payment was already confirmed. Check your orders for latest status.",
			};
		}

		try {
			const existingIntent = await stripe.paymentIntents.retrieve(existingDraft.paymentIntentId);
			if (existingIntent.status === "processing") {
				return {
					error: "Payment is already processing. Check your orders for latest status.",
				};
			}
			if (existingIntent.status === "succeeded") {
				return {
					error: "Payment was already confirmed. Check your orders for the latest status.",
				};
			}

			if (
				existingIntent.client_secret &&
				reusablePaymentIntentStatuses.has(existingIntent.status) &&
				existingIntent.currency.toUpperCase() === snapshot.currency
			) {
				if (existingIntent.amount !== draftAmountTotal) {
					await stripe.paymentIntents.update(existingIntent.id, {
						amount: draftAmountTotal,
						receipt_email: buyer.email || undefined,
						metadata: {
							...existingIntent.metadata,
							...(snapshot.userId ? { userId: snapshot.userId } : {}),
							checkoutOwnerKey: snapshot.checkoutOwnerKey,
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
					paymentProvider: "stripe",
					publishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
					clientSecret: existingIntent.client_secret,
					orderId: existingDraft.orderId,
					paymentIntentId: existingIntent.id,
					isAuthenticated: snapshot.isAuthenticated,
					buyer,
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
					canSavePaymentMethod: snapshot.isAuthenticated && Boolean(existingIntent.customer),
					savePaymentMethod: existingIntent.setup_future_usage === "on_session",
					savedPaymentMethods,
				};
			}
		} catch (error) {
			console.warn("Failed reuse payment intent", error);
		}
	}

	const orderDraftId = new ObjectId();
	const internalOrderId = existingDraft?.orderId || createInternalOrderId();
	const intent = await stripe.paymentIntents.create(
		{
			amount: draftAmountTotal,
			currency: snapshot.currency.toLowerCase(),
			customer: stripeCustomerId,
			receipt_email: buyer.email || undefined,
			automatic_payment_methods: { enabled: true },
			metadata: {
				...(snapshot.userId ? { userId: snapshot.userId } : {}),
				checkoutOwnerKey: snapshot.checkoutOwnerKey,
				orderDraftId: orderDraftId.toHexString(),
				orderId: internalOrderId,
				cartHash: snapshot.cartHash,
				integration: "transparent_checkout",
				...(snapshot.couponCode ? { couponCode: snapshot.couponCode } : {}),
				...(snapshot.couponPromotionId ? { couponPromotionId: snapshot.couponPromotionId } : {}),
				...(snapshot.couponCodeId ? { couponCodeId: snapshot.couponCodeId } : {}),
				...(existingDraft?.deliveryMethod ? { deliveryMethod: existingDraft.deliveryMethod } : {}),
				...(draftDeliveryAddress?.country
					? {
							deliveryCountry: draftDeliveryAddress.country,
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
		},
		{
			idempotencyKey: buildTransparentCheckoutIdempotencyKey({
				checkoutOwnerKey: snapshot.checkoutOwnerKey,
				cartHash: snapshot.cartHash,
				amountTotal: draftAmountTotal,
				currency: snapshot.currency,
				customer: stripeCustomerId ?? null,
				receiptEmail: buyer.email || null,
				couponCode: snapshot.couponCode ?? null,
				deliveryMethod: draftDeliveryMethod,
				deliveryAddress: draftDeliveryAddress,
				shippingRate: draftShippingRate,
			}),
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
				checkoutOwnerKey: snapshot.checkoutOwnerKey,
				userId: snapshot.userId ?? null,
				orderId: existingDraft?.orderId || internalOrderId,
				paymentIntentId: intent.id,
				stripeCustomerId: stripeCustomerId || null,
				buyer,
				cartHash: existingDraft?.cartHash ?? snapshot.cartHash,
				status: intent.status,
				subtotal: existingDraft?.subtotal ?? snapshot.subtotal,
				discountTotal: existingDraft?.discountTotal ?? snapshot.discountTotal,
				amountTotal: draftAmountTotal,
				currency: existingDraft?.currency ?? snapshot.currency,
				items: snapshot.items,
				shippingRate: draftShippingRate,
				shippingError: draftShippingError,
				deliveryMethod: draftDeliveryMethod,
				deliveryAddress: draftDeliveryAddress,
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
		paymentProvider: "stripe",
		publishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
		clientSecret: intent.client_secret,
		orderId: existingDraft?.orderId || internalOrderId,
		paymentIntentId: intent.id,
		isAuthenticated: snapshot.isAuthenticated,
		buyer,
		subtotal: existingDraft?.subtotal ?? snapshot.subtotal,
		discountTotal: existingDraft?.discountTotal ?? snapshot.discountTotal,
		amountTotal: draftAmountTotal,
		currency: existingDraft?.currency ?? snapshot.currency,
		items: snapshot.items,
		couponCode: snapshot.couponCode ?? null,
		shippingRate: draftShippingRate,
		shippingError: draftShippingError,
		deliveryMethod: draftDeliveryMethod,
		deliveryAddress: draftDeliveryAddress,
		canSavePaymentMethod: snapshot.isAuthenticated && Boolean(intent.customer),
		savePaymentMethod: false,
		savedPaymentMethods,
	};
}

export async function updateCheckoutBuyerData(input: {
	paymentIntentId: string;
	orderId?: string | null;
	buyer: CheckoutBuyerDraft;
}): Promise<{ ok: true; buyer: CheckoutBuyerDraft } | { error: string }> {
	if (!input.paymentIntentId.startsWith("pi_") && !input.orderId?.startsWith("ord_")) {
		return { error: "Invalid payment intent" };
	}

	let buyer: CheckoutBuyerDraft;
	try {
		buyer = normalizeCheckoutBuyer(input.buyer);
	} catch (error) {
		const message =
			error &&
			typeof error === "object" &&
			"issues" in error &&
			Array.isArray((error as { issues?: unknown[] }).issues)
				? ((error as { issues: Array<{ message?: string }> }).issues[0]?.message ??
					"Invalid checkout buyer data")
				: error instanceof Error
					? error.message
					: "Invalid checkout buyer data";
		return { error: message };
	}

	const access = await resolveDraftAccess({
		orderId: input.orderId,
		paymentIntentId: input.paymentIntentId,
	});
	if ("error" in access) {
		return { error: access.error };
	}

	const { draft, snapshot } = access;
	if (draft.paymentProvider !== "mercado_pago") {
		if (!env.STRIPE_SECRET_KEY) return { error: "Missing Stripe secret key" };
		if (!input.paymentIntentId.startsWith("pi_")) return { error: "Invalid payment intent" };
		const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: undefined });
		const intent = await stripe.paymentIntents.retrieve(input.paymentIntentId);
		if (!reusablePaymentIntentStatuses.has(intent.status)) {
			return { error: "Buyer data can no longer be changed" };
		}

		await stripe.paymentIntents.update(input.paymentIntentId, {
			receipt_email: buyer.email,
			metadata: {
				...intent.metadata,
				...(snapshot.userId ? { userId: snapshot.userId } : {}),
				checkoutOwnerKey: snapshot.checkoutOwnerKey,
				buyerEmail: buyer.email,
				buyerName: buyer.fullName,
			},
		});
	}

	await (await getDb())
		.collection<OrderDraftDoc>("orderDrafts")
		.updateOne(
			input.orderId?.startsWith("ord_")
				? { orderId: input.orderId }
				: { paymentIntentId: input.paymentIntentId },
			{
				$set: {
					checkoutOwnerKey: snapshot.checkoutOwnerKey,
					userId: snapshot.userId ?? draft.userId ?? null,
					buyer,
					updatedAt: new Date(),
				},
			},
		);

	return { ok: true, buyer };
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
> {
	if (!input.paymentIntentId.startsWith("pi_") && !input.orderId?.startsWith("ord_")) {
		return { error: "Invalid payment intent" };
	}

	const access = await resolveDraftAccess({
		orderId: input.orderId,
		paymentIntentId: input.paymentIntentId,
	});
	if ("error" in access) {
		return { error: access.error };
	}

	const { draft, snapshot } = access;
	let stripe: Stripe | null = null;
	let intent: Stripe.PaymentIntent | null = null;
	if (draft.paymentProvider !== "mercado_pago") {
		if (!env.STRIPE_SECRET_KEY) return { error: "Missing Stripe secret key" };
		if (!input.paymentIntentId.startsWith("pi_")) return { error: "Invalid payment intent" };
		stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: undefined });
		intent = await stripe.paymentIntents.retrieve(input.paymentIntentId);
		if (!reusablePaymentIntentStatuses.has(intent.status)) {
			return { error: "Delivery selection can no longer be changed" };
		}
	}

	const savedAddress = normalizeCheckoutAddress(snapshot.user.address ?? null);
	const selectedAddress =
		input.deliveryMethod === "saved-address"
			? savedAddress?.country === "BR"
				? savedAddress
				: null
			: input.deliveryMethod === "new-address"
				? normalizeBrazilOnlyCheckoutAddress(input.address ?? null)
				: null;

	if (input.deliveryMethod === "saved-address" && !savedAddress) {
		return { error: "No saved delivery address found" };
	}
	if (input.deliveryMethod === "new-address" && !selectedAddress) {
		return { error: "Please fill a valid delivery address" };
	}

	const baseTotal = Math.max(0, (draft.subtotal ?? draft.amountTotal) - (draft.discountTotal ?? 0));
	const shippingResolution =
		input.deliveryMethod === "pickup"
			? { selected: null, error: null }
			: selectedAddress
				? await resolveShippingQuotesForDestination({
						items: toShippingQuoteItems(draft.items),
						destination: selectedAddress,
						currency: draft.currency,
						subtotal: baseTotal,
						deliveryMethod: input.deliveryMethod,
					})
				: { selected: null, error: null };
	const quotedShippingRate = (() => {
		if (!shippingResolution.selected) return null;
		const rate = toShippingRate(shippingResolution.selected);
		if (!rate) return null;
		return {
			...rate,
			quotedAt: rate.quotedAt ?? undefined,
			fixed_amount: {
				amount: rate.fixed_amount.amount,
				currency: draft.currency,
			},
		};
	})();
	const shippingAmount = quotedShippingRate?.fixed_amount.amount ?? 0;
	const nextAmountTotal = baseTotal + shippingAmount;
	const shippingError = shippingResolution.error ?? null;

	if (stripe && intent) {
		await stripe.paymentIntents.update(input.paymentIntentId, {
			amount: nextAmountTotal,
			metadata: {
				...intent.metadata,
				...(snapshot.userId ? { userId: snapshot.userId } : {}),
				checkoutOwnerKey: snapshot.checkoutOwnerKey,
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
	}

	await (await getDb())
		.collection<OrderDraftDoc>("orderDrafts")
		.updateOne(
			input.orderId?.startsWith("ord_")
				? { orderId: input.orderId }
				: { paymentIntentId: input.paymentIntentId },
			{
				$set: {
					checkoutOwnerKey: snapshot.checkoutOwnerKey,
					userId: snapshot.userId ?? draft.userId ?? null,
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
	if (!canBuyOnSelolibertaria(auth.session.role)) {
		return { error: "Backoffice users cannot perform purchases." };
	}

	const userId = auth.session.sub as string;
	const db = await getDb();
	const draft = await db.collection<OrderDraftDoc>("orderDrafts").findOne({ paymentIntentId });
	if (!draft || draft.userId !== userId) return { error: "Payment intent not found" };
	if (!reusablePaymentIntentStatuses.has(draft.status as Stripe.PaymentIntent.Status)) {
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
	if (!canBuyOnSelolibertaria(auth.session.role)) {
		return { error: "Backoffice users cannot perform purchases." };
	}

	const userId = auth.session.sub as string;
	const db = await getDb();
	const user = await db.collection("users").findOne<{
		cart?: {
			items: { productId: string; variantId: string; quantity: number }[];
		};
		email?: string;
		name?: string;
		phone?: string;
		stripeCustomerId?: string;
		verified?: boolean;
		purchases?: Array<unknown>;
	}>(
		{ _id: new ObjectId(userId) },
		{
			projection: {
				cart: 1,
				email: 1,
				name: 1,
				phone: 1,
				stripeCustomerId: 1,
				verified: 1,
				purchases: 1,
			},
		},
	);

	if (user && user.verified === false) {
		const hasPurchases = Array.isArray(user.purchases) && user.purchases.length > 0;
		if (hasPurchases) {
			return {
				error: "E-mail não verificado. Confirme seu e-mail para realizar novas compras.",
			};
		}
	}

	const minimal = user?.cart?.items || [];
	if (minimal.length === 0) {
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
						else {
							aggregated.set(key, {
								productId: line.productId,
								variantId: line.variantId,
								quantity: line.quantity,
							});
						}
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
		} catch (error) {
			console.warn("Guest cart fallback import failed", error);
		}

		return { error: "Empty cart" };
	}

	const enrichedItems: Cart["items"] = [];
	for (const item of minimal) {
		const resolved = await commerce.variant
			.resolve({ id: item.variantId })
			.catch(async () => commerce.variant.resolve({ id: item.productId }).catch(() => null));
		if (!resolved) continue;

		const { product, variant } = resolved;
		enrichedItems.push({
			id: item.variantId,
			productId: product.id,
			variantId: variant.id,
			quantity: item.quantity,
			price: variant.price || product.price || 0,
			product: {
				id: product.id,
				name: product.name,
				images: product.images,
				summary: product.summary,
			},
		});
	}

	if (enrichedItems.length === 0) return { error: "Empty cart" };

	const currency = (env.STRIPE_CURRENCY || "USD").toUpperCase();
	const cart: Cart = {
		id: "user-cart",
		items: enrichedItems,
		total: enrichedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
		currency,
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
		} catch (error) {
			console.error("Failed create stripe customer", error);
		}
	}

	const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.items.map((item) => ({
		price: item.variantId || item.productId,
		quantity: item.quantity,
	}));

	try {
		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			line_items: lineItems,
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
	} catch (error) {
		console.error("Error creating checkout session", error);
		return { error: (error as Error).message };
	}
}
