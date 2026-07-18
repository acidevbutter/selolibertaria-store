import "server-only";

import { createHash } from "node:crypto";
import { ObjectId } from "mongodb";
import { env } from "@/env.mjs";
import { requireAuth } from "@/lib/api-auth";
import { canBuyOnSelolibertaria } from "@/lib/authz";
import { getCartCookieItems, getCartCouponCode, getCartId } from "@/lib/cart-cookies";
import { buildPricedCartPayload } from "@/lib/cart-pricing";
import { commerce } from "@/lib/commerce-stripe";
import type { AppliedPromotion } from "@/lib/commerce-types";
import { getUserPreferredCurrencyById } from "@/lib/currency-preference";
import { getDb } from "@/lib/mongodb";

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
		stripeCustomerId?: string;
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
			const guestCart = commerce.cart.get({ cartId });
			if (guestCart && guestCart.items.length > 0) {
				for (const item of normalizeMinimalItems(guestCart.items)) {
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
	const db = await getDb();

	const user = userId
		? await db.collection("users").findOne<{
				cart?: { items: MinimalItem[]; couponCode?: string | null };
				email?: string;
				name?: string;
				cpf?: string;
				phone?: string;
				stripeCustomerId?: string;
				address?: CheckoutUserAddress;
			}>(
				{ _id: new ObjectId(userId) },
				{
					projection: {
						cart: 1,
						email: 1,
						name: 1,
						cpf: 1,
						phone: 1,
						stripeCustomerId: 1,
						address: 1,
					},
				},
			)
		: null;

	const [guestCartId, guestCartItems, guestCouponCode] = await Promise.all([
		getCartId(),
		getCartCookieItems(),
		getCartCouponCode(),
	]);
	const sourceItems = user?.cart?.items?.length ? user.cart.items : (guestCartItems ?? []);
	const minimalItems = normalizeMinimalItems(await resolveCheckoutItems(sourceItems));

	if (minimalItems.length === 0) {
		return { ok: false, error: "Empty cart" };
	}

	const preferredCurrency = userId ? await getUserPreferredCurrencyById(userId) : null;
	const priced = await buildPricedCartPayload({
		cartId: userId ? "checkout-snapshot" : guestCartId || "guest-checkout-snapshot",
		minimalItems,
		couponCode: user?.cart?.couponCode ?? guestCouponCode ?? null,
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
				stripeCustomerId: user?.stripeCustomerId,
				preferredCurrency: preferredCurrency ?? undefined,
				address: user?.address,
			},
			items: checkoutItems,
			subtotal: cart.subtotal ?? cart.total,
			discountTotal: cart.discountTotal ?? 0,
			amountTotal: cart.total,
			currency: cart.currency || (env.STRIPE_CURRENCY || "USD").toUpperCase(),
			couponCode: cart.couponCode ?? null,
			couponPromotionId: couponContext?.promotionId ?? null,
			couponCodeId: couponContext?.promotionCodeId ?? null,
			shippingRate: cart.shippingRate
				? {
						...cart.shippingRate,
						fixed_amount: {
							amount: cart.shippingRate.fixed_amount.amount,
							currency:
								cart.shippingRate.currency || cart.currency || (env.STRIPE_CURRENCY || "USD").toUpperCase(),
						},
					}
				: null,
			shippingError: cart.shippingError ?? null,
			cartHash: buildCartHash(
				checkoutItems,
				cart.subtotal ?? cart.total,
				cart.discountTotal ?? 0,
				cart.currency || (env.STRIPE_CURRENCY || "USD").toUpperCase(),
			),
		},
	};
}
