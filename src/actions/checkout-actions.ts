"use server";

import { ObjectId } from "mongodb";
import { env } from "@/env.mjs";
import { type CheckoutSnapshot, getCheckoutSnapshot } from "@/lib/checkout/cart-snapshot";
import { buildMercadoPagoPaymentAttemptIdempotencyKey } from "@/lib/checkout/mercado-pago-idempotency";
import { type CheckoutBuyerDraft, normalizeCheckoutBuyer } from "@/lib/checkout-buyer";
import type { Cart } from "@/lib/commerce-types";
import {
	createMercadoPagoPayment,
	getMercadoPagoNotificationUrl,
	isMercadoPagoPixPayment,
	type MercadoPagoCreatePaymentInput,
	mapMercadoPagoStatus,
	validateMercadoPagoPaymentResponse,
} from "@/lib/mercado-pago";
import { getDb } from "@/lib/mongodb";
import { createInternalOrderId } from "@/lib/order-identity";
import { resolveShippingQuotesForDestination, toShippingRate } from "@/lib/shipping";
import type { CheckoutAddress, CheckoutDeliveryMethod } from "@/lib/shipping-core";

export interface TransparentCheckoutIntent {
	paymentProvider: "mercado_pago";
	publishableKey: string;
	paymentReferenceId: string;
	orderId: string;
	isAuthenticated: boolean;
	buyer: CheckoutBuyerDraft;
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
}

interface OrderDraftDoc {
	_id: ObjectId;
	orderId: string;
	checkoutOwnerKey: string;
	userId?: string | null;
	paymentReferenceId?: string | null;
	paymentProvider: "mercado_pago";
	mercadoPagoPaymentId?: string | null;
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
}

function getDefaultBuyer(snapshot: CheckoutSnapshot, draft?: OrderDraftDoc | null): CheckoutBuyerDraft {
	return {
		fullName: draft?.buyer?.fullName ?? snapshot.user.name ?? "",
		email: draft?.buyer?.email ?? snapshot.user.email ?? "",
		cpf: draft?.buyer?.cpf ?? snapshot.user.cpf ?? "",
		phone: draft?.buyer?.phone ?? snapshot.user.phone ?? "",
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
		country: address.country?.trim().toUpperCase() || "BR",
	};
	return value.postalCode && value.country === "BR" ? value : null;
}

function splitBuyerName(fullName: string) {
	const parts = fullName.trim().split(/\s+/).filter(Boolean);
	return parts.length <= 1
		? { firstName: parts[0] ?? fullName.trim(), lastName: "" }
		: { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
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

async function resolveDraftAccess(input: {
	paymentReferenceId?: string | null;
	orderId?: string | null;
}): Promise<{ draft: OrderDraftDoc; snapshot: CheckoutSnapshot } | { error: string }> {
	const snapshotResult = await getCheckoutSnapshot();
	if (!snapshotResult.ok) return { error: snapshotResult.error };
	const snapshot = snapshotResult.snapshot;
	const db = await getDb();
	const draft = input.orderId?.startsWith("ord_")
		? await db.collection<OrderDraftDoc>("orderDrafts").findOne({ orderId: input.orderId })
		: input.paymentReferenceId
			? await db
					.collection<OrderDraftDoc>("orderDrafts")
					.findOne({ paymentReferenceId: input.paymentReferenceId })
			: null;
	if (!draft) return { error: "Rascunho de pedido não encontrado" };
	if (draft.checkoutOwnerKey !== snapshot.checkoutOwnerKey) return { error: "O acesso ao checkout expirou" };
	return { draft, snapshot };
}

function validateCheckoutDraft(draft: OrderDraftDoc, snapshot: CheckoutSnapshot) {
	if (draft.currency.toUpperCase() !== "BRL" || snapshot.currency.toUpperCase() !== "BRL") {
		return "O Mercado Pago aceita apenas BRL";
	}
	if (draft.currency.toUpperCase() !== snapshot.currency.toUpperCase()) {
		return "A moeda do carrinho mudou; atualize o checkout";
	}
	if (draft.cartHash !== snapshot.cartHash) {
		return "O carrinho mudou; atualize o checkout antes de pagar";
	}
	const shippingAmount = draft.shippingRate?.fixed_amount.amount ?? 0;
	const expectedAmount = Math.max(0, snapshot.subtotal - snapshot.discountTotal) + shippingAmount;
	if (draft.amountTotal !== expectedAmount) {
		return "O total do pedido mudou; atualize o checkout antes de pagar";
	}
	return null;
}

async function createMercadoPagoCheckoutIntent(): Promise<TransparentCheckoutIntent | { error: string }> {
	if (!env.MERCADO_PAGO_ACCESS_TOKEN) return { error: "Mercado Pago não configurado" };
	if (!env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) return { error: "Public Key do Mercado Pago ausente" };
	const result = await getCheckoutSnapshot();
	if (!result.ok) return { error: result.error };
	const snapshot = result.snapshot;
	if (snapshot.currency.toUpperCase() !== "BRL") return { error: "O Mercado Pago aceita apenas BRL" };

	const db = await getDb();
	const drafts = db.collection<OrderDraftDoc>("orderDrafts");
	const existing = await drafts.findOne(
		{
			checkoutOwnerKey: snapshot.checkoutOwnerKey,
			cartHash: snapshot.cartHash,
			paymentProvider: "mercado_pago",
		},
		{ sort: { createdAt: -1 } },
	);
	const deliveryMethod: CheckoutDeliveryMethod = existing?.deliveryMethod ?? "new-address";
	const deliveryAddress = normalizeCheckoutAddress(
		existing?.deliveryAddress ?? snapshot.user.address ?? null,
	);
	const shippingRate = existing?.shippingRate ?? snapshot.shippingRate ?? null;
	const orderId = existing?.orderId ?? createInternalOrderId();
	const paymentReferenceId = existing?.paymentReferenceId ?? `mp_draft_${orderId}`;
	const draftId = existing?._id ?? new ObjectId();
	const now = new Date();
	await drafts.updateOne(
		{ _id: draftId },
		{
			$setOnInsert: { _id: draftId, createdAt: now },
			$set: {
				checkoutOwnerKey: snapshot.checkoutOwnerKey,
				userId: snapshot.userId ?? null,
				orderId,
				paymentReferenceId,
				paymentProvider: "mercado_pago",
				mercadoPagoPaymentId: existing?.mercadoPagoPaymentId ?? null,
				buyer: getDefaultBuyer(snapshot, existing),
				cartHash: snapshot.cartHash,
				status: existing?.status ?? "requires_payment_method",
				subtotal: snapshot.subtotal,
				discountTotal: snapshot.discountTotal,
				amountTotal: existing?.amountTotal ?? snapshot.amountTotal,
				currency: snapshot.currency,
				items: snapshot.items,
				shippingRate,
				shippingError: existing?.shippingError ?? snapshot.shippingError ?? null,
				deliveryMethod,
				deliveryAddress,
				couponCode: snapshot.couponCode ?? null,
				couponPromotionId: snapshot.couponPromotionId ?? null,
				couponCodeId: snapshot.couponCodeId ?? null,
				updatedAt: now,
				confirmedAt: null,
			},
		},
		{ upsert: true },
	);

	return {
		paymentProvider: "mercado_pago",
		publishableKey: env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY,
		paymentReferenceId,
		orderId,
		isAuthenticated: snapshot.isAuthenticated,
		buyer: getDefaultBuyer(snapshot, existing),
		subtotal: existing?.subtotal ?? snapshot.subtotal,
		discountTotal: existing?.discountTotal ?? snapshot.discountTotal,
		amountTotal: existing?.amountTotal ?? snapshot.amountTotal,
		currency: snapshot.currency,
		items: snapshot.items,
		couponCode: snapshot.couponCode ?? null,
		shippingRate,
		shippingError: existing?.shippingError ?? snapshot.shippingError ?? null,
		deliveryMethod,
		deliveryAddress,
	};
}

export async function createTransparentCheckoutIntent() {
	return createMercadoPagoCheckoutIntent();
}

export async function submitMercadoPagoCheckoutPayment(input: {
	orderId: string;
	paymentData: {
		payment_method_id?: string;
		token?: string;
		installments?: number;
		issuer_id?: string;
		payer?: { email?: string; identification?: { type?: string; number?: string } };
	};
}) {
	if (!env.MERCADO_PAGO_ACCESS_TOKEN) return { error: "Mercado Pago não configurado" } as const;
	if (!input.orderId.startsWith("ord_")) return { error: "Pedido inválido" } as const;
	const access = await resolveDraftAccess({ orderId: input.orderId });
	if ("error" in access) return { error: access.error } as const;
	const { draft, snapshot } = access;
	const draftValidationError = validateCheckoutDraft(draft, snapshot);
	if (draftValidationError) return { error: draftValidationError } as const;
	if (draft.mercadoPagoPaymentId && (draft.status === "processing" || draft.status === "succeeded")) {
		return { error: "Já existe um pagamento Mercado Pago em processamento para este pedido" } as const;
	}
	const paymentMethodId = input.paymentData.payment_method_id?.trim();
	if (!paymentMethodId) return { error: "Meio de pagamento ausente" } as const;
	const isPix = isMercadoPagoPixPayment(paymentMethodId);
	const paymentToken = input.paymentData.token?.trim();
	if (!isPix && !paymentToken)
		return { error: "Não foi possível tokenizar o cartão. Confira os dados e tente novamente." } as const;
	let buyer: CheckoutBuyerDraft;
	try {
		buyer = normalizeCheckoutBuyer(draft.buyer ?? snapshot.user);
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Dados da compra inválidos" } as const;
	}
	const { firstName, lastName } = splitBuyerName(buyer.fullName);
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
				type: buyer.cpf.replace(/\D/g, "").length === 14 ? "CNPJ" : "CPF",
				number: buyer.cpf.replace(/\D/g, ""),
			},
		},
		metadata: { orderId: draft.orderId, checkoutOwnerKey: draft.checkoutOwnerKey, cartHash: draft.cartHash },
	};
	if (paymentToken) body.token = paymentToken;
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
		if (!paymentId) return { error: "Mercado Pago não retornou o ID do pagamento" } as const;
		const paymentValidation = validateMercadoPagoPaymentResponse(payment, {
			amountInCents: draft.amountTotal,
			currency: draft.currency,
			externalReference: draft.orderId,
		});
		if (!paymentValidation.ok) {
			await dbUpdateDraft(draft.orderId, {
				status: "failed",
				"mercadoPago.lastError": paymentValidation.error,
				updatedAt: new Date(),
			});
			return { error: paymentValidation.error } as const;
		}
		const status = mapMercadoPagoStatus(payment.status);
		await dbUpdateDraft(draft.orderId, {
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
		});
		const qrData = payment.point_of_interaction?.transaction_data;
		return {
			ok: true as const,
			orderId: draft.orderId,
			paymentId,
			status,
			qrCode: qrData?.qr_code ?? null,
			qrCodeBase64: qrData?.qr_code_base64 ?? null,
			ticketUrl: qrData?.ticket_url ?? null,
			expiresAt: payment.date_of_expiration ?? null,
		};
	} catch (error) {
		await dbUpdateDraft(draft.orderId, {
			status: "failed",
			"mercadoPago.lastError": error instanceof Error ? error.message : "Falha no pagamento",
			updatedAt: new Date(),
		});
		return { error: "Não foi possível criar o pagamento no Mercado Pago" } as const;
	}
}

async function dbUpdateDraft(orderId: string, update: Record<string, unknown>) {
	await (await getDb()).collection<OrderDraftDoc>("orderDrafts").updateOne({ orderId }, { $set: update });
}

export async function updateCheckoutBuyerData(input: {
	paymentReferenceId?: string;
	orderId?: string | null;
	buyer: CheckoutBuyerDraft;
}) {
	let buyer: CheckoutBuyerDraft;
	try {
		buyer = normalizeCheckoutBuyer(input.buyer);
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Dados inválidos" } as const;
	}
	const access = await resolveDraftAccess({
		orderId: input.orderId,
		paymentReferenceId: input.paymentReferenceId,
	});
	if ("error" in access) return { error: access.error } as const;
	await dbUpdateDraft(access.draft.orderId, {
		buyer,
		userId: access.snapshot.userId ?? access.draft.userId ?? null,
		updatedAt: new Date(),
	});
	return { ok: true as const, buyer };
}

export async function updateCheckoutDeliverySelection(input: {
	paymentReferenceId?: string;
	orderId?: string | null;
	deliveryMethod: CheckoutDeliveryMethod;
	address?: CheckoutAddress | null;
}) {
	const access = await resolveDraftAccess({
		orderId: input.orderId,
		paymentReferenceId: input.paymentReferenceId,
	});
	if ("error" in access) return { error: access.error } as const;
	const { draft, snapshot } = access;
	const selectedAddress =
		input.deliveryMethod === "new-address"
			? normalizeCheckoutAddress(input.address ?? null)
			: input.deliveryMethod === "saved-address"
				? normalizeCheckoutAddress(snapshot.user.address ?? null)
				: null;
	if (input.deliveryMethod === "new-address" && !selectedAddress)
		return { error: "Informe um endereço válido" } as const;
	if (input.deliveryMethod === "saved-address" && !selectedAddress)
		return { error: "Endereço salvo não encontrado" } as const;
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
	const rawShippingRate = shippingResolution.selected ? toShippingRate(shippingResolution.selected) : null;
	const shippingRate = rawShippingRate
		? {
				...rawShippingRate,
				fixed_amount: {
					...rawShippingRate.fixed_amount,
					currency: rawShippingRate.currency ?? draft.currency,
				},
			}
		: null;
	const shippingAmount = shippingRate?.fixed_amount.amount ?? 0;
	const amountTotal = baseTotal + shippingAmount;
	await dbUpdateDraft(draft.orderId, {
		deliveryMethod: input.deliveryMethod,
		deliveryAddress: selectedAddress,
		shippingRate,
		shippingError: shippingResolution.error ?? null,
		amountTotal,
		updatedAt: new Date(),
	});
	return {
		ok: true as const,
		orderId: draft.orderId,
		paymentReferenceId: draft.paymentReferenceId ?? "",
		deliveryMethod: input.deliveryMethod,
		deliveryAddress: selectedAddress,
		shippingRate,
		shippingError: shippingResolution.error ?? null,
		subtotal: draft.subtotal ?? baseTotal,
		discountTotal: draft.discountTotal ?? 0,
		amountTotal,
		currency: draft.currency,
	};
}

export type { Cart };
