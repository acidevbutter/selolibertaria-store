import "server-only";

import { createHash } from "node:crypto";
import { ObjectId } from "mongodb";
import { env } from "@/env.mjs";
import { requireAuth } from "@/lib/api-auth";
import { canBuyOnStorefront } from "@/lib/authz";
import { getCartCookieItems, getCartId } from "@/lib/cart-cookies";
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
	baseUnitAmount: number;
	unitAmount: number;
	lineBaseTotal: number;
	lineDiscountTotal: number;
	lineFinalTotal: number;
	appliedPromotions: AppliedPromotion[];
}

export interface CheckoutSnapshot {
	userId: string;
	user: {
		email?: string;
		name?: string;
		phone?: string;
		stripeCustomerId?: string;
		preferredCurrency?: string;
		address?: {
			line1?: string;
			line2?: string;
			number?: string;
			complement?: string;
			district?: string;
			city?: string;
			state?: string;
			postalCode?: string;
			country?: string;
		};
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
		fixed_amount: { amount: number };
		currency?: string;
		estimated_days?: number | null;
	} | null;
	shippingError?: string | null;
}

export type CheckoutSnapshotResult =
	| { ok: true; snapshot: CheckoutSnapshot }
	| { ok: false; requireAuth: true }
	| { ok: false; error: string };

function normalizeMinimalItems(items: MinimalItem[]): MinimalItem[] {
	const map = new Map<string, MinimalItem>();
	for (const item of items) {
		const quantity = Number.isFinite(item.quantity)
			? item.quantity
			: Number.parseInt(String(item.quantity), 10);
		if (!item.productId || !item.variantId || !Number.isFinite(quantity) || quantity <= 0) continue;
		const current = map.get(item.variantId);
		if (current) current.quantity += quantity;
		else map.set(item.variantId, { productId: item.productId, variantId: item.variantId, quantity });
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
	if ("error" in auth) return { ok: false, requireAuth: true };
	if (!canBuyOnStorefront(auth.session.role)) {
		return { ok: false, error: "Backoffice users cannot perform purchases." };
	}

	const userId = auth.session.sub as string;
	const db = await getDb();
	const user = await db.collection("users").findOne<{
		cart?: { items: MinimalItem[]; couponCode?: string | null };
		email?: string;
		name?: string;
		phone?: string;
		stripeCustomerId?: string;
		verified?: boolean;
		address?: {
			line1?: string;
			line2?: string;
			number?: string;
			complement?: string;
			district?: string;
			city?: string;
			state?: string;
			postalCode?: string;
			country?: string;
		};
		purchases?: Array<unknown>;
	}>(
		{ _id: new ObjectId(userId) },
		{ projection: { cart: 1, email: 1, name: 1, phone: 1, stripeCustomerId: 1, verified: 1, purchases: 1 } },
	);

	if (user?.verified === false && Array.isArray(user.purchases) && user.purchases.length > 0) {
		return { ok: false, error: "Email not verified. Please verify your email to make more purchases." };
	}

	const minimalItems = normalizeMinimalItems(await resolveCheckoutItems(user?.cart?.items || []));
	if (minimalItems.length === 0) return { ok: false, error: "Empty cart" };
	const priced = await buildPricedCartPayload({
		cartId: "checkout-snapshot",
		minimalItems,
		couponCode: user?.cart?.couponCode ?? null,
		userId,
		strictCoupon: true,
		preferredCurrency: await getUserPreferredCurrencyById(userId),
	}).catch((error) => ({ error: error instanceof Error ? error.message : "Invalid coupon" }));
	if ("error" in priced) return { ok: false, error: priced.error };
	const { cart, checkoutItems, couponContext } = priced;
	if (checkoutItems.length === 0 || cart.total <= 0) return { ok: false, error: "Empty cart" };

	return {
		ok: true,
		snapshot: {
			userId,
			user: {
				email: user?.email,
				name: user?.name,
				phone: user?.phone,
				stripeCustomerId: user?.stripeCustomerId,
				preferredCurrency: (await getUserPreferredCurrencyById(userId)) ?? undefined,
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
			shippingRate: cart.shippingRate ?? null,
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
