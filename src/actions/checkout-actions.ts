"use server";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { finalizeCheckoutCleanup } from "@/actions/order-actions";
import { env } from "@/env.mjs";
import { requireAuth } from "@/lib/api-auth";
import { getCheckoutSnapshot } from "@/lib/checkout/cart-snapshot";
import { type CheckoutBuyerDraft, normalizeCheckoutBuyer } from "@/lib/checkout-buyer";
import { createInternalOrderId } from "@/lib/order-identity";
import { resolveShippingQuotesForDestination, toShippingRate } from "@/lib/shipping";
import type { CheckoutAddress, CheckoutDeliveryMethod } from "@/lib/shipping-core";

const CHECKOUT_COOKIE = "asaas_checkout";
type CheckoutReceipt = {
	orderId: string;
	ownerKey: string;
	cartHash: string;
	cleaned: boolean;
};

async function receipt(orderId: string): Promise<CheckoutReceipt | null> {
	try {
		const [payload, signature] = ((await cookies()).get(CHECKOUT_COOKIE)?.value ?? "").split(".");
		if (!payload || !signature) return null;
		const expected = createHmac("sha256", env.FASTAPI_INTERNAL_API_KEY).update(payload).digest();
		const received = Buffer.from(signature, "base64url");
		if (received.length !== expected.length || !timingSafeEqual(expected, received)) return null;
		const value = JSON.parse(Buffer.from(payload, "base64url").toString()) as CheckoutReceipt | null;
		return value?.orderId === orderId ? value : null;
	} catch {
		return null;
	}
}

async function saveReceipt(value: CheckoutReceipt) {
	const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
	const signature = createHmac("sha256", env.FASTAPI_INTERNAL_API_KEY).update(payload).digest("base64url");
	(await cookies()).set(CHECKOUT_COOKIE, `${payload}.${signature}`, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: 60 * 60 * 24 * 7,
	});
}

type FastApiIntent = {
	order_id: string;
	status: string;
	asaas_charge_id: string | null;
	redirect_url: string | null;
	pix_copy_paste: string | null;
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

/**
 * Light quote used to auto-calculate shipping as soon as a CEP resolves, before
 * the buyer has filled in the rest of the form. Only needs a destination postal
 * code -- unlike createAsaasCheckout, it never touches Asaas or requires buyer
 * data or a full street address.
 */
export async function getShippingQuote(input: {
	deliveryMethod: CheckoutDeliveryMethod;
	address?: CheckoutAddress | null;
}) {
	const result = await getCheckoutSnapshot();
	if (!result.ok) return { error: result.error } as const;
	const snapshot = result.snapshot;
	if (!["saved-address", "new-address"].includes(input.deliveryMethod)) {
		return { error: "Escolha uma forma de entrega" } as const;
	}
	const address = normalizeAddress(
		input.deliveryMethod === "saved-address" ? snapshot.user.address : input.address,
	);
	if (!address) {
		return { error: "Informe um CEP válido para calcular o frete" } as const;
	}
	try {
		const baseTotal = Math.max(0, snapshot.subtotal - snapshot.discountTotal);
		const shipping = await resolveShippingQuotesForDestination({
			destination: address,
			deliveryMethod: input.deliveryMethod,
			subtotal: baseTotal,
			currency: snapshot.currency,
			items: snapshot.items.map((item) => ({
				...item,
				price: item.unitAmount,
			})),
		});
		if (shipping.error || !shipping.selected) {
			return { error: shipping.error || "Não foi possível cotar a entrega" } as const;
		}
		return {
			ok: true as const,
			amountTotal: baseTotal + shipping.selected.amount,
			shippingAmount: shipping.selected.amount,
			estimatedDays: shipping.selected.estimatedDays ?? null,
			currency: snapshot.currency,
		};
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : "Não foi possível calcular o frete",
		} as const;
	}
}

export async function createAsaasCheckout(input: {
	buyer: CheckoutBuyerDraft;
	deliveryMethod: CheckoutDeliveryMethod;
	address?: CheckoutAddress | null;
	confirmedAmount?: number;
}) {
	const result = await getCheckoutSnapshot();
	if (!result.ok) return { error: result.error } as const;
	const snapshot = result.snapshot;
	try {
		const buyer = normalizeCheckoutBuyer(input.buyer);
		if (!["saved-address", "new-address"].includes(input.deliveryMethod)) {
			return { error: "Escolha uma forma de entrega" } as const;
		}
		const address = normalizeAddress(
			input.deliveryMethod === "saved-address" ? snapshot.user.address : input.address,
		);
		if (
			!address ||
			!address.line1 ||
			!address.number ||
			!address.city ||
			!address.state ||
			!address.district
		) {
			return { error: "Informe o endereço completo para entrega" } as const;
		}
		const baseTotal = Math.max(0, snapshot.subtotal - snapshot.discountTotal);
		const shipping = await resolveShippingQuotesForDestination({
			destination: address,
			deliveryMethod: input.deliveryMethod,
			subtotal: baseTotal,
			currency: snapshot.currency,
			items: snapshot.items.map((item) => ({
				...item,
				price: item.unitAmount,
			})),
		});
		if (shipping.error || !shipping.selected) {
			return {
				error: shipping.error || "Não foi possível cotar a entrega",
			} as const;
		}
		const shippingRate = toShippingRate(shipping.selected);
		const amountTotal = baseTotal + shipping.selected.amount;
		if (input.confirmedAmount !== amountTotal) {
			return {
				needsConfirmation: true as const,
				amountTotal,
				shippingAmount: shipping.selected.amount,
				estimatedDays: shipping.selected.estimatedDays ?? null,
				currency: snapshot.currency,
			};
		}
		const cartHash = createHash("sha256")
			.update(
				JSON.stringify({
					cart: snapshot.cartHash,
					buyer,
					address,
					deliveryMethod: input.deliveryMethod,
					amountTotal,
				}),
			)
			.digest("hex");
		const remote = await fastApiRequest<FastApiIntent>("/checkout/intents", {
			method: "POST",
			body: JSON.stringify({
				order_id: createInternalOrderId(),
				checkout_owner_key: snapshot.checkoutOwnerKey,
				user_id: snapshot.userId,
				cart_hash: cartHash,
				buyer,
				amount_total: amountTotal,
				currency: snapshot.currency,
				items: snapshot.items,
				subtotal: snapshot.subtotal,
				discount_total: snapshot.discountTotal,
				shipping_rate: shippingRate,
				shipping_error: null,
				delivery_method: input.deliveryMethod,
				delivery_address: address,
				coupon_code: snapshot.couponCode,
			}),
		});
		if (!remote.redirect_url || !remote.asaas_charge_id) {
			return { error: "A Asaas não retornou a cobrança hospedada" } as const;
		}
		await saveReceipt({
			orderId: remote.order_id,
			ownerKey: snapshot.checkoutOwnerKey,
			cartHash: snapshot.cartHash,
			cleaned: false,
		});
		return {
			ok: true as const,
			orderId: remote.order_id,
			status: remote.status,
			asaasChargeId: remote.asaas_charge_id,
			redirectUrl: remote.redirect_url,
			pixCopyPaste: remote.pix_copy_paste,
		};
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : "Não foi possível iniciar o pagamento",
		} as const;
	}
}

export async function finalizeAsaasCheckout(input: { orderId: string }) {
	try {
		const currentReceipt = await receipt(input.orderId);
		const remote = await fastApiRequest<{
			status: string;
			setup_password_required?: boolean;
			account_email_sent?: boolean;
			billing_type?: string | null;
			credit_card_brand?: string | null;
			credit_card_last4?: string | null;
			card_save_available?: boolean;
		}>(`/checkout/intents/${encodeURIComponent(input.orderId)}/finalize`, {
			method: "POST",
			headers: {
				"X-Checkout-Owner-Key": currentReceipt?.ownerKey ?? (await checkoutOwnerKey()),
			},
		});
		let cartCleared = false;
		if (remote.status === "succeeded" && currentReceipt && !currentReceipt.cleaned) {
			const snapshot = await getCheckoutSnapshot();
			if (snapshot.ok && snapshot.snapshot.cartHash === currentReceipt.cartHash) {
				const cleanup = await finalizeCheckoutCleanup();
				cartCleared = "ok" in cleanup;
				if (cartCleared) await saveReceipt({ ...currentReceipt, cleaned: true });
			}
		}
		return {
			ok: true as const,
			status: remote.status,
			setupPasswordRequired: Boolean(remote.setup_password_required),
			cartCleared,
			accountEmailSent: Boolean(remote.account_email_sent),
			billingType: remote.billing_type ?? null,
			creditCardBrand: remote.credit_card_brand ?? null,
			creditCardLast4: remote.credit_card_last4 ?? null,
			cardSaveAvailable: Boolean(remote.card_save_available),
		};
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : "Não foi possível confirmar o pagamento",
		} as const;
	}
}

/**
 * Opt-in save of the card used for a just-finalized CREDIT_CARD checkout,
 * called from the post-payment processing page when `finalizeAsaasCheckout`
 * reported `cardSaveAvailable`. Reuses the same checkout-owner-key receipt as
 * finalize -- the backend authorizes this by owner key, not by a logged-in
 * user's session, since a guest checkout also gets an account created for it
 * during finalize.
 */
export async function saveCheckoutCard(input: { orderId: string }) {
	try {
		const currentReceipt = await receipt(input.orderId);
		const remote = await fastApiRequest<{
			id: string;
			provider: string;
			brand: string | null;
			last4: string | null;
		}>(`/checkout/intents/${encodeURIComponent(input.orderId)}/save-card`, {
			method: "POST",
			headers: {
				"X-Checkout-Owner-Key": currentReceipt?.ownerKey ?? (await checkoutOwnerKey()),
			},
		});
		return {
			ok: true as const,
			card: {
				id: remote.id,
				provider: remote.provider,
				brand: remote.brand,
				last4: remote.last4,
			},
		};
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : "Não foi possível salvar o cartão",
		} as const;
	}
}
