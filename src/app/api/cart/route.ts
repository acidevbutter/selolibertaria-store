import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/env.mjs";
import { getUserIdFromAuthHeader } from "@/lib/api-auth-helpers";
import { getCartCookieItems, getCartCouponCode, getCartId } from "@/lib/cart-cookies";
import { buildPricedCartPayload } from "@/lib/cart-pricing";
import { commerce } from "@/lib/commerce-stripe";
import { getRequestPreferredCurrency, getUserPreferredCurrencyById } from "@/lib/currency-preference";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

async function getAuthenticatedUserId(): Promise<string | null> {
	let userId = await getUserIdFromAuthHeader();
	if (!userId) {
		try {
			const sessionToken = (await cookies()).get("session")?.value;
			if (sessionToken) {
				const { decrypt } = await import("@/lib/session");
				const data = await decrypt(sessionToken);
				if (data && data.expires > Date.now()) userId = data.user.id;
			}
		} catch {}
	}
	return userId;
}

function toMinimalItems(items: { productId: string; variantId: string; quantity: number }[]) {
	return items
		.map((item) => ({
			productId: item.productId,
			variantId: item.variantId,
			quantity: item.quantity,
		}))
		.filter(
			(item) => item.productId && item.variantId && Number.isFinite(item.quantity) && item.quantity > 0,
		);
}

export async function GET() {
	try {
		const userId = await getAuthenticatedUserId();
		const guestPreferredCurrency = !userId ? await getRequestPreferredCurrency() : null;

		if (!userId) {
			const [cookieCartId, cookieItems, couponCode] = await Promise.all([
				getCartId(),
				getCartCookieItems(),
				getCartCouponCode(),
			]);
			let minimal = cookieItems ? toMinimalItems(cookieItems) : [];
			const cartId = cookieCartId || "guest-cookie";
			if (minimal.length === 0 && cookieCartId) {
				const guestCart = commerce.cart.get({ cartId: cookieCartId });
				if (guestCart?.items?.length) {
					minimal = toMinimalItems(guestCart.items);
				}
			}
			if (minimal.length === 0) {
				return NextResponse.json({
					cart: {
						id: cartId,
						items: [],
						total: 0,
						currency: (env.STRIPE_CURRENCY || "USD").toUpperCase(),
						subtotal: 0,
						discountTotal: 0,
						couponCode: couponCode ?? null,
						couponError: null,
						appliedPromotions: [],
					},
				});
			}
			const payload = await buildPricedCartPayload({
				cartId,
				minimalItems: minimal,
				couponCode,
				preferredCurrency: guestPreferredCurrency,
			});
			return NextResponse.json({ cart: payload.cart });
		}

		const db = await getDb();
		const { ObjectId } = await import("mongodb");
		const user = await db.collection("users").findOne<{
			cart?: {
				items: { productId: string; variantId: string; quantity: number }[];
				couponCode?: string | null;
			};
		}>({ _id: new ObjectId(userId) }, { projection: { cart: 1 } });
		const minimal = user?.cart?.items || [];
		if (minimal.length === 0) {
			return NextResponse.json({
				cart: {
					id: `user-${userId}-empty`,
					items: [],
					total: 0,
					currency: (env.STRIPE_CURRENCY || "USD").toUpperCase(),
					subtotal: 0,
					discountTotal: 0,
					couponCode: user?.cart?.couponCode ?? null,
					couponError: null,
					appliedPromotions: [],
				},
			});
		}
		const payload = await buildPricedCartPayload({
			cartId: `user-${userId}`,
			minimalItems: minimal,
			couponCode: user?.cart?.couponCode ?? null,
			userId,
			preferredCurrency: await getUserPreferredCurrencyById(userId),
		});
		return NextResponse.json({ cart: payload.cart });
	} catch (error) {
		console.error("GET /api/cart error", error);
		return NextResponse.json({ error: "Failed to load cart" }, { status: 500 });
	}
}
