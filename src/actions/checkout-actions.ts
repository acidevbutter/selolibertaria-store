"use server";

import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import { requireAuth } from "@/lib/api-auth";
import { type CheckoutSnapshot, getCheckoutSnapshot } from "@/lib/checkout/cart-snapshot";
import { buildMercadoPagoPaymentAttemptIdempotencyKey } from "@/lib/checkout/mercado-pago-idempotency";
import { type CheckoutBuyerDraft, normalizeCheckoutBuyer } from "@/lib/checkout-buyer";
import type { Cart } from "@/lib/commerce-types";
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
	savedCards: SavedMercadoPagoCard[];
}

type FastApiIntent = {
	payment_reference_id: string;
	order_id: string;
	user_id: string | null;
	buyer: CheckoutBuyerDraft | null;
	amount_total: number;
	currency: string;
	items: CheckoutSnapshot["items"];
	subtotal: number | null;
	discount_total: number | null;
	shipping_rate: CheckoutSnapshot["shippingRate"] | null;
	shipping_error: string | null;
	delivery_method: CheckoutDeliveryMethod | null;
	delivery_address: CheckoutAddress | null;
	coupon_code: string | null;
	status: string;
};

type FastApiPayment = {
	order_id: string;
	payment_id: string;
	status: string;
	provider_status: string;
	status_detail: string | null;
	qr_code: string | null;
	qr_code_base64: string | null;
	ticket_url: string | null;
	expires_at: string | null;
	/** Boleto "linha digitável" — present only when the backend supports boleto. */
	barcode?: string | null;
};

type SavedMercadoPagoCard = {
	id: string;
	brand: string | null;
	lastFourDigits: string | null;
	expirationMonth: number | null;
	expirationYear: number | null;
};

async function checkoutOwnerKey() {
	const auth = await requireAuth();
	if (!("error" in auth)) return `user:${auth.session.sub}`;
	const { getCartId } = await import("@/lib/cart-cookies");
	const cartId = await getCartId();
	return `guest:${cartId || "cookie-cart"}`;
}

async function fastApiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
	const sessionToken = (await cookies()).get("session")?.value;
	const headers = new Headers(init.headers);
	headers.set("Content-Type", "application/json");
	headers.set("X-Internal-API-Key", env.FASTAPI_INTERNAL_API_KEY);
	if (sessionToken) headers.set("Authorization", `Bearer ${sessionToken}`);
	const response = await fetch(`${env.FASTAPI_API_URL}${path}`, {
		...init,
		headers,
		cache: "no-store",
	});
	const payload = (await response.json().catch(() => null)) as T | { detail?: string } | null;
	if (!response.ok) {
		throw new Error(
			payload && typeof payload === "object" && "detail" in payload && typeof payload.detail === "string"
				? payload.detail
				: "Não foi possível comunicar com o checkout",
		);
	}
	return payload as T;
}

function toIntent(remote: FastApiIntent, snapshot: CheckoutSnapshot): TransparentCheckoutIntent {
	return {
		paymentProvider: "mercado_pago",
		publishableKey: env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ?? "",
		paymentReferenceId: remote.payment_reference_id,
		orderId: remote.order_id,
		isAuthenticated: Boolean(snapshot.userId),
		buyer: remote.buyer ?? {
			fullName: snapshot.user.name ?? "",
			email: snapshot.user.email ?? "",
			cpf: snapshot.user.cpf ?? "",
			phone: snapshot.user.phone ?? "",
		},
		subtotal: remote.subtotal ?? snapshot.subtotal,
		discountTotal: remote.discount_total ?? snapshot.discountTotal,
		amountTotal: remote.amount_total,
		currency: remote.currency,
		items: remote.items,
		couponCode: remote.coupon_code,
		shippingRate: remote.shipping_rate,
		shippingError: remote.shipping_error,
		deliveryMethod: remote.delivery_method ?? "new-address",
		deliveryAddress: remote.delivery_address,
		savedCards: [],
	};
}

function normalizeAddress(address?: CheckoutAddress | null): CheckoutAddress | null {
	if (!address) return null;
	const normalized = {
		...address,
		line1: address.line1?.trim() ?? "",
		line2: address.line2?.trim() ?? "",
		number: address.number?.trim() ?? "",
		complement: address.complement?.trim() ?? "",
		district: address.district?.trim() ?? "",
		city: address.city?.trim() ?? "",
		state: address.state?.trim() ?? "",
		postalCode: address.postalCode?.trim() ?? "",
		country: address.country?.trim().toUpperCase() || "BR",
	};
	return normalized.postalCode && normalized.country === "BR" ? normalized : null;
}

export async function createTransparentCheckoutIntent() {
	if (!env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) {
		return { error: "Public Key do Mercado Pago ausente" } as const;
	}
	const result = await getCheckoutSnapshot();
	if (!result.ok) return { error: result.error } as const;
	const snapshot = result.snapshot;
	try {
		const remote = await fastApiRequest<FastApiIntent>("/checkout/intents", {
			method: "POST",
			body: JSON.stringify({
				order_id: createInternalOrderId(),
				checkout_owner_key: snapshot.checkoutOwnerKey,
				user_id: snapshot.userId,
				cart_hash: snapshot.cartHash,
				buyer: {
					fullName: snapshot.user.name ?? "",
					email: snapshot.user.email ?? "",
					cpf: snapshot.user.cpf ?? "",
					phone: snapshot.user.phone ?? "",
				},
				amount_total: snapshot.amountTotal,
				currency: snapshot.currency,
				items: snapshot.items,
				subtotal: snapshot.subtotal,
				discount_total: snapshot.discountTotal,
				shipping_rate: snapshot.shippingRate,
				shipping_error: snapshot.shippingError,
				delivery_method: "new-address",
				delivery_address: normalizeAddress(snapshot.user.address),
				coupon_code: snapshot.couponCode,
			}),
		});
		return toIntent(remote, snapshot);
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : "Não foi possível preparar o checkout",
		} as const;
	}
}

export async function submitMercadoPagoCheckoutPayment(input: {
	orderId: string;
	paymentData: {
		payment_method_id?: string;
		token?: string;
		installments?: number;
		savedCardId?: string;
	};
}) {
	if (input.paymentData.savedCardId) return { error: "Cartões salvos ainda estão em migração" } as const;
	const paymentMethodId = input.paymentData.payment_method_id?.trim();
	if (!paymentMethodId) return { error: "Meio de pagamento ausente" } as const;
	const snapshotResult = await getCheckoutSnapshot();
	if (!snapshotResult.ok) return { error: snapshotResult.error } as const;
	const snapshot = snapshotResult.snapshot;
	const method = paymentMethodId.toLowerCase();
	const isPix = method === "pix";
	// Boleto is opt-in via admin; the backend must accept `type: "boleto"`.
	const isBoleto = method === "boleto" || method === "bolbradesco";
	const isOffline = isPix || isBoleto;
	try {
		const remote = await fastApiRequest<FastApiPayment>(
			`/checkout/intents/${encodeURIComponent(input.orderId)}/payment`,
			{
				method: "POST",
				headers: { "X-Checkout-Owner-Key": snapshot.checkoutOwnerKey },
				body: JSON.stringify({
					payment_method: {
						type: isPix ? "pix" : isBoleto ? "boleto" : "card",
						id: isPix ? "pix" : isBoleto ? "boleto" : paymentMethodId,
						token: isOffline ? null : input.paymentData.token,
						installments: isOffline ? null : (input.paymentData.installments ?? null),
					},
					idempotency_key: buildMercadoPagoPaymentAttemptIdempotencyKey({
						orderId: input.orderId,
						checkoutOwnerKey: snapshot.checkoutOwnerKey,
						cartHash: snapshot.cartHash,
						amountTotal: snapshot.amountTotal,
						currency: snapshot.currency,
						paymentMethodId,
						buyerEmail: snapshot.user.email,
						attemptId: input.paymentData.token ?? paymentMethodId,
					}),
				}),
			},
		);
		return {
			ok: true as const,
			orderId: remote.order_id,
			paymentId: remote.payment_id,
			status: remote.status,
			providerStatus: remote.provider_status,
			statusDetail: remote.status_detail,
			qrCode: remote.qr_code,
			qrCodeBase64: remote.qr_code_base64,
			ticketUrl: remote.ticket_url,
			expiresAt: remote.expires_at,
			barcode: remote.barcode ?? null,
		};
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Não foi possível criar o pagamento" } as const;
	}
}

export async function getPendingMercadoPagoPixPayment(input: { orderId: string }) {
	try {
		const remote = await fastApiRequest<FastApiPayment>(
			`/checkout/intents/${encodeURIComponent(input.orderId)}/payment`,
			{ headers: { "X-Checkout-Owner-Key": await checkoutOwnerKey() } },
		);
		return {
			ok: true as const,
			payment: {
				paymentId: remote.payment_id,
				status: remote.status,
				qrCode: remote.qr_code,
				qrCodeBase64: remote.qr_code_base64,
				ticketUrl: remote.ticket_url,
				expiresAt: remote.expires_at,
			},
		};
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : "Não foi possível recuperar o pagamento Pix",
		} as const;
	}
}

export async function continuePendingMercadoPagoPixCheckout(input: { orderId: string }) {
	try {
		const remote = await fastApiRequest<{ status: string; setup_password_required: boolean }>(
			`/checkout/intents/${encodeURIComponent(input.orderId)}/finalize`,
			{
				method: "POST",
				headers: { "X-Checkout-Owner-Key": await checkoutOwnerKey() },
			},
		);
		if (remote.status !== "processing" && remote.status !== "succeeded") {
			return { error: "O pagamento Pix não está pendente de confirmação" } as const;
		}
		const params = new URLSearchParams({ section: "purchases", order: input.orderId, pendingPayment: "1" });
		if (remote.setup_password_required) params.set("setupPassword", "1");
		return { ok: true as const, redirectUrl: `/user?${params.toString()}` };
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : "Não foi possível preparar o acompanhamento do Pix",
		} as const;
	}
}

export async function updateCheckoutBuyerData(input: {
	paymentReferenceId?: string;
	orderId?: string | null;
	buyer: CheckoutBuyerDraft;
}) {
	if (!input.orderId) return { error: "Rascunho de pedido não encontrado" } as const;
	try {
		const buyer = normalizeCheckoutBuyer(input.buyer);
		await fastApiRequest(`/checkout/intents/${encodeURIComponent(input.orderId)}`, {
			method: "PATCH",
			headers: { "X-Checkout-Owner-Key": await checkoutOwnerKey() },
			body: JSON.stringify({ buyer }),
		});
		return { ok: true as const, buyer };
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Dados inválidos" } as const;
	}
}

export async function updateCheckoutDeliverySelection(input: {
	paymentReferenceId?: string;
	orderId?: string | null;
	deliveryMethod: CheckoutDeliveryMethod;
	address?: CheckoutAddress | null;
}) {
	if (!input.orderId) return { error: "Rascunho de pedido não encontrado" } as const;
	const address = input.deliveryMethod === "new-address" ? normalizeAddress(input.address) : null;
	if (input.deliveryMethod === "new-address" && !address)
		return { error: "Informe um endereço válido" } as const;
	try {
		const snapshotResult = await getCheckoutSnapshot();
		if (!snapshotResult.ok) return { error: snapshotResult.error } as const;
		const snapshot = snapshotResult.snapshot;
		const baseTotal = Math.max(0, snapshot.subtotal - snapshot.discountTotal);
		const shippingResolution =
			input.deliveryMethod === "pickup"
				? { selected: null, error: null }
				: address
					? await resolveShippingQuotesForDestination({
							items: snapshot.items.map((item) => ({
								productId: item.productId,
								variantId: item.variantId,
								quantity: item.quantity,
								price: item.unitAmount,
								productType: item.productType ?? null,
								format: item.format ?? null,
							})),
							destination: address,
							currency: snapshot.currency,
							subtotal: baseTotal,
							deliveryMethod: input.deliveryMethod,
						})
					: { selected: null, error: null };
		const shippingRate = shippingResolution.selected ? toShippingRate(shippingResolution.selected) : null;
		const amountTotal = baseTotal + (shippingRate?.fixed_amount.amount ?? 0);
		await fastApiRequest(`/checkout/intents/${encodeURIComponent(input.orderId)}`, {
			method: "PATCH",
			headers: { "X-Checkout-Owner-Key": await checkoutOwnerKey() },
			body: JSON.stringify({
				delivery_method: input.deliveryMethod,
				delivery_address: address,
				shipping_rate: shippingRate,
				shipping_error: shippingResolution.error,
				amount_total: amountTotal,
			}),
		});
		return {
			ok: true as const,
			orderId: input.orderId,
			paymentReferenceId: input.paymentReferenceId ?? "",
			deliveryMethod: input.deliveryMethod,
			deliveryAddress: address,
			shippingRate,
			shippingError: shippingResolution.error ?? null,
			subtotal: snapshot.subtotal,
			discountTotal: snapshot.discountTotal,
			amountTotal,
			currency: snapshot.currency,
		};
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : "Não foi possível atualizar a entrega",
		} as const;
	}
}

export async function removeSavedMercadoPagoCard(_cardId: string) {
	return { error: "Cartões salvos ainda estão em migração" } as const;
}

export type { Cart };
