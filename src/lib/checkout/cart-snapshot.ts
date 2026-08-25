import "server-only";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import { requireAuth } from "@/lib/api-auth";
import { canBuyOnSelolibertaria } from "@/lib/authz";
import { getCartCookieItems, getCartCouponCode, getCartId } from "@/lib/cart-cookies";
import { buildPricedCartPayload } from "@/lib/cart-pricing";
import type { AppliedPromotion } from "@/lib/commerce-types";
import { resolveSupportedCurrency } from "@/lib/currency";

interface MinimalItem {
	productId: string;
	variantId: string;
	quantity: number;
}

interface CheckoutUserAddress {
	line1?: string;
	line2?: string;
	number?: string;
	complement?: string;
	district?: string;
	city?: string;
	state?: string;
	postalCode?: string;
	country?: string;
}

export interface CheckoutSnapshotItem {
	id: string;
	productId: string;
	variantId: string;
	priceId: string;
	name: string;
	image: string | null;
	quantity: number;
	productSlug: string;
	categorySlug?: string | null;
	variantLabel?: string | null;
	productType?: string | null;
	format?: string | null;
	baseUnitAmount: number;
	unitAmount: number;
	lineBaseTotal: number;
	lineDiscountTotal: number;
	lineFinalTotal: number;
	appliedPromotions: AppliedPromotion[];
}

export interface CheckoutSnapshot {
	checkoutOwnerKey: string;
	isAuthenticated: boolean;
	userId?: string | null;
	user: {
		email?: string;
		name?: string;
		cpf?: string;
		phone?: string;
		preferredCurrency?: string;
		address?: CheckoutUserAddress;
	};
	items: CheckoutSnapshotItem[];
	subtotal: number;
	discountTotal: number;
	amountTotal: number;
	currency: string;
	cartHash: string;
	couponCode?: string | null;
	couponPromotionId?: string | null;
	couponCodeId?: string | null;
	shippingRate?: {
		providerCode: string;
		providerLabel: string;
		serviceCode: string;
		serviceName: string;
		fixed_amount: {
			amount: number;
			currency: string;
		};
		estimated_days?: number | null;
		quotedAt?: string;
	} | null;
	shippingError?: string | null;
}

export type CheckoutSnapshotResult = { ok: true; snapshot: CheckoutSnapshot } | { ok: false; error: string };

function normalizeMinimalItems(items: MinimalItem[]): MinimalItem[] {
	const map = new Map<string, MinimalItem>();

	for (const item of items) {
		const quantity = Number.isFinite(item.quantity)
			? item.quantity
			: Number.parseInt(String(item.quantity), 10);

		if (!item.productId || !item.variantId || !Number.isFinite(quantity) || quantity <= 0) continue;

		const current = map.get(item.variantId);
		if (current) {
			current.quantity += quantity;
			continue;
		}

		map.set(item.variantId, {
			productId: item.productId,
			variantId: item.variantId,
			quantity,
		});
	}

	return Array.from(map.values()).sort((a, b) => a.variantId.localeCompare(b.variantId));
}

function buildCartHash(
	items: CheckoutSnapshotItem[],
	subtotal: number,
	discountTotal: number,
	currency: string,
) {
	const canonical = {
		subtotal,
		discountTotal,
		currency: currency.toUpperCase(),
		items: items
			.map((item) => ({
				priceId: item.priceId,
				productId: item.productId,
				quantity: item.quantity,
				appliedPromotions: item.appliedPromotions.map((promotion) => ({
					promotionId: promotion.promotionId,
					label: promotion.label,
					kind: promotion.kind,
					code: promotion.code ?? null,
					discountAmount: promotion.discountAmount,
				})),
				unitAmount: item.unitAmount,
				variantId: item.variantId,
			}))
			.sort((a, b) => a.variantId.localeCompare(b.variantId)),
	};

	return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

async function resolveCheckoutItems(existingItems: MinimalItem[]) {
	if (existingItems.length > 0) return existingItems;

	const [cartId, cookieItems] = await Promise.all([getCartId(), getCartCookieItems()]);
	const imported = new Map<string, MinimalItem>();

	if (cookieItems && cookieItems.length > 0) {
		for (const item of normalizeMinimalItems(cookieItems)) {
			imported.set(item.variantId, item);
		}
	}

	if (cartId) {
		try {
			const response = await fetch(`${env.FASTAPI_API_URL}/carts/guest/${encodeURIComponent(cartId)}`, {
				cache: "no-store",
			});
			const guestCart = response.ok
				? ((await response.json()) as {
						items?: Array<{ product_id: string; variant_id: string; quantity: number; unit_amount: number }>;
					})
				: null;
			if (guestCart?.items && guestCart.items.length > 0) {
				for (const item of normalizeMinimalItems(
					guestCart.items.map((entry) => ({
						id: entry.variant_id,
						productId: entry.product_id,
						variantId: entry.variant_id,
						quantity: entry.quantity,
						price: entry.unit_amount,
					})),
				)) {
					const current = imported.get(item.variantId);
					if (current) current.quantity += item.quantity;
					else imported.set(item.variantId, item);
				}
			}
		} catch (error) {
			console.warn("[checkout snapshot] failed to read guest cart", error);
		}
	}

	return Array.from(imported.values());
}

export async function getCheckoutSnapshot(): Promise<CheckoutSnapshotResult> {
	const auth = await requireAuth();
	const isAuthenticated = !("error" in auth);

	if (isAuthenticated && !canBuyOnSelolibertaria(auth.session.role)) {
		return { ok: false, error: "Backoffice users cannot perform purchases." };
	}

	const userId = isAuthenticated ? (auth.session.sub as string) : null;
	const token = userId ? (await cookies()).get("session")?.value : null;
	const headers = token ? { authorization: `Bearer ${token}` } : undefined;
	const [userResponse, cartResponse] =
		userId && headers
			? await Promise.all([
					fetch(`${env.FASTAPI_API_URL}/users/${encodeURIComponent(userId)}`, { headers, cache: "no-store" }),
					fetch(`${env.FASTAPI_API_URL}/carts/me`, { headers, cache: "no-store" }),
				])
			: [null, null];
	const remoteUser = userResponse?.ok ? ((await userResponse.json()) as Record<string, unknown>) : null;
	const remoteCart = cartResponse?.ok
		? ((await cartResponse.json()) as {
				coupon_code?: string | null;
				items?: Array<{ product_id: string; variant_id: string; quantity: number }>;
			})
		: null;
	const user = remoteUser
		? {
				email: remoteUser.email as string | undefined,
				name: remoteUser.name as string | undefined,
				cpf: remoteUser.cpf as string | undefined,
				phone: remoteUser.phone as string | undefined,
				preferredCurrency: resolveSupportedCurrency(
					typeof remoteUser.preferred_currency === "string" ? remoteUser.preferred_currency : null,
				),
				address: {
					line1: remoteUser.address_line1 as string | undefined,
					line2: remoteUser.address_line2 as string | undefined,
					number: remoteUser.address_number as string | undefined,
					complement: remoteUser.address_complement as string | undefined,
					district: remoteUser.address_district as string | undefined,
					city: remoteUser.address_city as string | undefined,
					state: remoteUser.address_state as string | undefined,
					postalCode: remoteUser.address_postal_code as string | undefined,
					country: remoteUser.address_country as string | undefined,
				},
			}
		: null;

	const [guestCartId, guestCartItems, guestCouponCode] = await Promise.all([
		getCartId(),
		getCartCookieItems(),
		getCartCouponCode(),
	]);
	const sourceItems = remoteCart?.items?.length
		? remoteCart.items.map((item) => ({
				productId: item.product_id,
				variantId: item.variant_id,
				quantity: item.quantity,
			}))
		: (guestCartItems ?? []);
	const minimalItems = normalizeMinimalItems(await resolveCheckoutItems(sourceItems));

	if (minimalItems.length === 0) {
		return { ok: false, error: "Empty cart" };
	}

	const preferredCurrency = user?.preferredCurrency ?? null;
	const priced = await buildPricedCartPayload({
		cartId: userId ? "checkout-snapshot" : guestCartId || "guest-checkout-snapshot",
		minimalItems,
		couponCode: remoteCart?.coupon_code ?? guestCouponCode ?? null,
		userId,
		strictCoupon: true,
		preferredCurrency,
	}).catch((error) => ({
		error: error instanceof Error ? error.message : "Invalid coupon",
	}));

	if ("error" in priced) {
		return { ok: false, error: priced.error };
	}

	const { cart, checkoutItems, couponContext } = priced;
	if (checkoutItems.length === 0 || cart.total <= 0) {
		return { ok: false, error: "Empty cart" };
	}

	return {
		ok: true,
		snapshot: {
			checkoutOwnerKey: userId ? `user:${userId}` : `guest:${guestCartId || "cookie-cart"}`,
			isAuthenticated,
			userId,
			user: {
				email: user?.email,
				name: user?.name,
				cpf: user?.cpf,
				phone: user?.phone,
				preferredCurrency: preferredCurrency ?? undefined,
				address: user?.address,
			},
			items: checkoutItems,
			subtotal: cart.subtotal ?? cart.total,
			discountTotal: cart.discountTotal ?? 0,
			amountTotal: cart.total,
			currency: cart.currency || "BRL",
			couponCode: cart.couponCode ?? null,
			couponPromotionId: couponContext?.promotionId ?? null,
			couponCodeId: couponContext?.promotionCodeId ?? null,
			shippingRate: cart.shippingRate
				? {
						...cart.shippingRate,
						fixed_amount: {
							amount: cart.shippingRate.fixed_amount.amount,
							currency: cart.shippingRate.currency || cart.currency || "BRL",
						},
					}
				: null,
			shippingError: cart.shippingError ?? null,
			cartHash: buildCartHash(
				checkoutItems,
				cart.subtotal ?? cart.total,
				cart.discountTotal ?? 0,
				cart.currency || "BRL",
			),
		},
	};
}
