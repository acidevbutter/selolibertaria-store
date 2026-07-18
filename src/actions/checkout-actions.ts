"use server";

import { ObjectId } from "mongodb";
import { env } from "@/env.mjs";
import { type CheckoutSnapshot, getCheckoutSnapshot } from "@/lib/checkout/cart-snapshot";
import { buildMercadoPagoPaymentAttemptIdempotencyKey } from "@/lib/checkout/mercado-pago-idempotency";
import { type CheckoutBuyerDraft, normalizeCheckoutBuyer } from "@/lib/checkout-buyer";
import type { Cart } from "@/lib/commerce-types";
import {
	addMercadoPagoCustomerCard,
	createMercadoPagoCustomer,
	createMercadoPagoPayment,
	getMercadoPagoNotificationUrl,
	getMercadoPagoPixPaymentData,
	isMercadoPagoPixPayment,
	listMercadoPagoCustomerCards,
	type MercadoPagoCreatePaymentInput,
	type MercadoPagoSavedCard,
	mapMercadoPagoSavedCard,
	mapMercadoPagoStatus,
	removeMercadoPagoCustomerCard,
	retrieveMercadoPagoCustomerCard,
	retrieveMercadoPagoPayment,
	validateMercadoPagoPaymentResponse,
} from "@/lib/mercado-pago";
import { getDb } from "@/lib/mongodb";
import { createInternalOrderId } from "@/lib/order-identity";
import { auth } from "@/lib/session";
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
	savedCards: MercadoPagoSavedCard[];
}

interface OrderDraftDoc {
	_id: ObjectId;
	orderId: string;
	checkoutOwnerKey: string;
	userId?: string | null;
	paymentReferenceId?: string | null;
	paymentProvider: "mercado_pago";
	mercadoPagoPaymentId?: string | null;
	mercadoPago?: {
		attemptId?: string | null;
		idempotencyKey?: string | null;
		paymentMethodId?: string | null;
	};
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

async function ensureMercadoPagoCustomer(input: {
	userId?: string | null;
	email?: string;
	fullName?: string;
	cpf?: string;
}) {
	if (!input.userId || !input.email) return null;
	const db = await getDb();
	const users = db.collection("users");
	const user = await users.findOne<{ mercadoPagoCustomerId?: string | null }>({
		_id: new ObjectId(input.userId),
	});
	if (user?.mercadoPagoCustomerId) return user.mercadoPagoCustomerId;
	const { firstName, lastName } = splitBuyerName(input.fullName ?? "");
	const customer = await createMercadoPagoCustomer({
		email: input.email,
		firstName,
		lastName,
		identification: input.cpf
			? {
					type: input.cpf.replace(/\D/g, "").length === 14 ? "CNPJ" : "CPF",
					number: input.cpf.replace(/\D/g, ""),
				}
			: undefined,
	});
	if (!customer.id) throw new Error("Mercado Pago não retornou o cliente");
	const customerId = String(customer.id);
	await users.updateOne(
		{
			_id: new ObjectId(input.userId),
			$or: [{ mercadoPagoCustomerId: { $exists: false } }, { mercadoPagoCustomerId: null }],
		},
		{ $set: { mercadoPagoCustomerId: customerId, updatedAt: new Date() } },
	);
	const current = await users.findOne<{ mercadoPagoCustomerId?: string | null }>({
		_id: new ObjectId(input.userId),
	});
	return current?.mercadoPagoCustomerId ?? customerId;
}

async function getSavedCardsForUser(userId: string | null | undefined) {
	if (!userId) return [];
	const db = await getDb();
	const user = await db
		.collection("users")
		.findOne<{ mercadoPagoCustomerId?: string | null }>(
			{ _id: new ObjectId(userId) },
			{ projection: { mercadoPagoCustomerId: 1 } },
		);
	if (!user?.mercadoPagoCustomerId) return [];
	const cards = await listMercadoPagoCustomerCards(user.mercadoPagoCustomerId);
	return cards.map(mapMercadoPagoSavedCard).filter((card): card is MercadoPagoSavedCard => Boolean(card));
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

	let savedCards: MercadoPagoSavedCard[] = [];
	if (snapshot.isAuthenticated && snapshot.userId) {
		try {
			const buyer = getDefaultBuyer(snapshot, existing);
			await ensureMercadoPagoCustomer({
				userId: snapshot.userId,
				email: buyer.email,
				fullName: buyer.fullName,
				cpf: buyer.cpf,
			});
			savedCards = await getSavedCardsForUser(snapshot.userId);
		} catch (error) {
			console.warn(
				"[mercado-pago] saved cards unavailable",
				error instanceof Error ? error.message : "unknown error",
			);
		}
	}

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
		savedCards,
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
		savedCardId?: string;
		savePaymentMethod?: boolean;
	};
}) {
	if (!env.MERCADO_PAGO_ACCESS_TOKEN) return { error: "Mercado Pago não configurado" } as const;
	if (!input.orderId.startsWith("ord_")) return { error: "Pedido inválido" } as const;
	const access = await resolveDraftAccess({ orderId: input.orderId });
	if ("error" in access) return { error: access.error } as const;
	let { draft } = access;
	const { snapshot } = access;
	const draftValidationError = validateCheckoutDraft(draft, snapshot);
	if (draftValidationError) return { error: draftValidationError } as const;
	if (draft.mercadoPagoPaymentId && (draft.status === "processing" || draft.status === "succeeded")) {
		return { error: "Já existe um pagamento Mercado Pago em processamento para este pedido" } as const;
	}
	if (draft.mercadoPagoPaymentId && draft.status === "failed") {
		const resetResult = await resetConfirmedFailedMercadoPagoAttempt(draft);
		if ("error" in resetResult) return { error: resetResult.error } as const;
		if (resetResult.pending) {
			return { error: "O Mercado Pago ainda está processando este pagamento" } as const;
		}
		draft = {
			...draft,
			status: "requires_payment_method",
			mercadoPagoPaymentId: null,
			mercadoPago: { ...draft.mercadoPago, attemptId: null, idempotencyKey: null },
		};
	}
	let paymentMethodId = input.paymentData.payment_method_id?.trim();
	if (!paymentMethodId) return { error: "Meio de pagamento ausente" } as const;
	const isPix = isMercadoPagoPixPayment(paymentMethodId);
	let paymentToken = input.paymentData.token?.trim();
	const savePaymentMethod = input.paymentData.savePaymentMethod === true;
	if (savePaymentMethod && !snapshot.isAuthenticated)
		return { error: "Entre na sua conta para salvar um cartão" } as const;
	if (input.paymentData.savedCardId && (!snapshot.isAuthenticated || !snapshot.userId))
		return { error: "Entre na sua conta para usar um cartão salvo" } as const;
	if (!isPix && input.paymentData.savedCardId) {
		const db = await getDb();
		const user = await db
			.collection("users")
			.findOne<{ mercadoPagoCustomerId?: string | null }>(
				{ _id: new ObjectId(snapshot.userId!) },
				{ projection: { mercadoPagoCustomerId: 1 } },
			);
		if (!user?.mercadoPagoCustomerId) return { error: "Nenhum cartão salvo está disponível" } as const;
		try {
			const savedCard = await retrieveMercadoPagoCustomerCard(
				user.mercadoPagoCustomerId,
				input.paymentData.savedCardId,
			);
			paymentToken = savedCard.token?.trim();
			paymentMethodId = savedCard.payment_method?.id?.trim() || undefined;
		} catch {
			return { error: "Este cartão salvo não está mais disponível" } as const;
		}
	}
	if (!isPix && (!paymentToken || !paymentMethodId))
		return { error: "Não foi possível tokenizar o cartão. Confira os dados e tente novamente." } as const;
	if (!paymentMethodId) return { error: "Meio de pagamento ausente" } as const;
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
	if (snapshot.isAuthenticated && snapshot.userId) {
		const db = await getDb();
		const user = await db
			.collection("users")
			.findOne<{ mercadoPagoCustomerId?: string | null }>(
				{ _id: new ObjectId(snapshot.userId) },
				{ projection: { mercadoPagoCustomerId: 1 } },
			);
		if (user?.mercadoPagoCustomerId) body.customer_id = user.mercadoPagoCustomerId;
	}
	if (savePaymentMethod && paymentToken && snapshot.userId) {
		const customerId =
			(body.customer_id as string | undefined) ??
			(await ensureMercadoPagoCustomer({
				userId: snapshot.userId,
				email: buyer.email,
				fullName: buyer.fullName,
				cpf: buyer.cpf,
			}));
		if (!customerId) return { error: "Não foi possível preparar o cartão salvo" } as const;
		try {
			const savedCard = await addMercadoPagoCustomerCard(customerId, paymentToken);
			paymentToken = savedCard.token?.trim();
			if (!paymentToken) return { error: "Mercado Pago não confirmou o cartão salvo" } as const;
			body.customer_id = customerId;
		} catch {
			return { error: "Não foi possível salvar o cartão no Mercado Pago" } as const;
		}
	}
	if (paymentToken) body.token = paymentToken;
	if (input.paymentData.installments) body.installments = input.paymentData.installments;
	if (input.paymentData.issuer_id) body.issuer_id = input.paymentData.issuer_id;
	const attemptId = await ensureMercadoPagoPaymentAttempt(draft);
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
		attemptId,
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
		const pixPayment = getMercadoPagoPixPaymentData(payment);
		return {
			ok: true as const,
			orderId: draft.orderId,
			paymentId,
			status,
			qrCode: pixPayment?.qrCode ?? null,
			qrCodeBase64: pixPayment?.qrCodeBase64 ?? null,
			ticketUrl: pixPayment?.ticketUrl ?? null,
			expiresAt: pixPayment?.expiresAt ?? null,
		};
	} catch (error) {
		console.error(
			"[submitMercadoPagoCheckoutPayment]",
			error instanceof Error ? error.message : "unknown error",
		);
		await dbUpdateDraft(draft.orderId, {
			status: "failed",
			"mercadoPago.lastError": error instanceof Error ? error.message : "Falha no pagamento",
			updatedAt: new Date(),
		});
		return { error: "Não foi possível criar o pagamento no Mercado Pago" } as const;
	}
}

async function ensureMercadoPagoPaymentAttempt(draft: OrderDraftDoc) {
	if (draft.mercadoPago?.attemptId) return draft.mercadoPago.attemptId;
	const attemptId = new ObjectId().toHexString();
	const drafts = (await getDb()).collection<OrderDraftDoc>("orderDrafts");
	const claimed = await drafts.updateOne(
		{
			_id: draft._id,
			$or: [{ "mercadoPago.attemptId": { $exists: false } }, { "mercadoPago.attemptId": null }],
		},
		{ $set: { "mercadoPago.attemptId": attemptId, updatedAt: new Date() } },
	);
	if (claimed.matchedCount) return attemptId;
	const current = await drafts.findOne({ _id: draft._id }, { projection: { mercadoPago: 1 } });
	if (current?.mercadoPago?.attemptId) return current.mercadoPago.attemptId;
	throw new Error("Não foi possível preparar a tentativa de pagamento");
}

async function resetConfirmedFailedMercadoPagoAttempt(draft: OrderDraftDoc) {
	try {
		const payment = await retrieveMercadoPagoPayment(draft.mercadoPagoPaymentId!);
		const validation = validateMercadoPagoPaymentResponse(payment, {
			amountInCents: draft.amountTotal,
			currency: draft.currency,
			externalReference: draft.orderId,
		});
		if (!validation.ok) return { error: validation.error } as const;
		const status = mapMercadoPagoStatus(payment.status);
		if (status === "processing" || status === "succeeded") return { pending: true } as const;
		if (status !== "failed") return { error: "O estado do pagamento Mercado Pago é inválido" } as const;
		const reset = await (await getDb()).collection<OrderDraftDoc>("orderDrafts").updateOne(
			{ _id: draft._id, mercadoPagoPaymentId: draft.mercadoPagoPaymentId, status: "failed" },
			{
				$set: { status: "requires_payment_method", updatedAt: new Date(), confirmedAt: null },
				$unset: {
					mercadoPagoPaymentId: "",
					"mercadoPago.attemptId": "",
					"mercadoPago.idempotencyKey": "",
				},
			},
		);
		if (!reset.matchedCount) return { error: "O estado do pagamento mudou; atualize o checkout" } as const;
		return { pending: false } as const;
	} catch (error) {
		console.error(
			"[resetConfirmedFailedMercadoPagoAttempt]",
			error instanceof Error ? error.message : "unknown error",
		);
		return { error: "Não foi possível confirmar o estado do Pix anterior" } as const;
	}
}

export async function getPendingMercadoPagoPixPayment(input: { orderId: string }) {
	if (!input.orderId.startsWith("ord_")) return { error: "Pedido inválido" } as const;
	const access = await resolveDraftAccess({ orderId: input.orderId });
	if ("error" in access) return { error: access.error } as const;
	const { draft } = access;
	if (!draft.mercadoPagoPaymentId) return { ok: true as const, payment: null };

	try {
		const payment = await retrieveMercadoPagoPayment(draft.mercadoPagoPaymentId);
		const validation = validateMercadoPagoPaymentResponse(payment, {
			amountInCents: draft.amountTotal,
			currency: draft.currency,
			externalReference: draft.orderId,
		});
		if (!validation.ok) return { error: validation.error } as const;
		const pixPayment = getMercadoPagoPixPaymentData(payment);
		if (!pixPayment) return { ok: true as const, payment: null };
		await dbUpdateDraft(draft.orderId, {
			status: pixPayment.status,
			"mercadoPago.status": payment.status ?? null,
			"mercadoPago.statusDetail": payment.status_detail ?? null,
			updatedAt: new Date(),
			confirmedAt: pixPayment.status === "succeeded" ? new Date() : null,
		});
		return { ok: true as const, payment: pixPayment };
	} catch (error) {
		console.error(
			"[getPendingMercadoPagoPixPayment]",
			error instanceof Error ? error.message : "unknown error",
		);
		return { error: "Não foi possível recuperar o pagamento Pix" } as const;
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

export async function removeSavedMercadoPagoCard(cardId: string) {
	const session = await auth();
	if (!session?.user.id) return { error: "Entre na sua conta para remover um cartão" } as const;
	if (!/^[a-zA-Z0-9_-]+$/.test(cardId.trim())) return { error: "Cartão inválido" } as const;
	const db = await getDb();
	const user = await db
		.collection("users")
		.findOne<{ mercadoPagoCustomerId?: string | null }>(
			{ _id: new ObjectId(session.user.id) },
			{ projection: { mercadoPagoCustomerId: 1 } },
		);
	if (!user?.mercadoPagoCustomerId) return { error: "Cartão não encontrado" } as const;
	try {
		await removeMercadoPagoCustomerCard(user.mercadoPagoCustomerId, cardId.trim());
		return { ok: true as const };
	} catch {
		return { error: "Não foi possível remover este cartão" } as const;
	}
}

export type { Cart };
