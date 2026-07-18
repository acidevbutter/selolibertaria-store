import "server-only";

import { ObjectId } from "mongodb";
import { isBackofficeRole } from "@/lib/authz";
import { clearCartId, getCartCookieItems, getCartCouponCode, getCartId } from "@/lib/cart-cookies";
import { commerce } from "@/lib/commerce";
import { getDb } from "@/lib/mongodb";

type MinimalItem = { productId: string; variantId: string; quantity: number };

function aggregateItems(items: MinimalItem[]) {
	const aggregated = new Map<string, MinimalItem>();
	for (const item of items) {
		if (!item?.productId || !item?.variantId || !Number.isFinite(item.quantity) || item.quantity <= 0)
			continue;
		const current = aggregated.get(item.variantId);
		if (current) current.quantity += item.quantity;
		else aggregated.set(item.variantId, { ...item });
	}
	return Array.from(aggregated.values());
}

export async function mergeGuestCartIntoUserCart(userId: string) {
	const db = await getDb();
	const [cartId, cookieItems, couponCode] = await Promise.all([
		getCartId(),
		getCartCookieItems(),
		getCartCouponCode(),
	]);
	const incoming = new Map<string, MinimalItem>();
	const append = (items: MinimalItem[]) => {
		for (const item of items) {
			const existing = incoming.get(item.variantId);
			if (existing) existing.quantity += item.quantity;
			else incoming.set(item.variantId, { ...item });
		}
	};

	if (cookieItems && cookieItems.length > 0) append(cookieItems);
	if (cartId) {
		try {
			const guestCart = commerce.cart.get({ cartId });
			if (guestCart && guestCart.items.length > 0) {
				append(
					guestCart.items.map((item) => ({
						productId: item.productId,
						variantId: item.variantId,
						quantity: item.quantity,
					})),
				);
			}
		} catch (error) {
			console.warn("[oauth auth] failed to read guest cart", error);
		}
	}

	if (incoming.size === 0) return;

	const user = await db
		.collection("users")
		.findOne<{ cart?: { items?: MinimalItem[]; couponCode?: string | null } }>(
			{ _id: new ObjectId(userId) },
			{ projection: { cart: 1 } },
		);
	if (user?.cart?.items?.length) append(user.cart.items);

	const merged = aggregateItems(Array.from(incoming.values()));
	await db.collection("users").updateOne(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				cart: {
					items: merged,
					couponCode: couponCode ?? user?.cart?.couponCode ?? null,
				},
				updatedAt: new Date(),
			},
		},
	);

	try {
		if (cartId) await commerce.cart.clear({ cartId });
	} catch {}
	await clearCartId();
}

export async function resolvePostAuthRedirect(userId: string, role?: string | null) {
	if (isBackofficeRole(role)) return "/admin";
	const db = await getDb();
	const cookieItems = await getCartCookieItems();
	if (cookieItems && cookieItems.length > 0) return "/checkout";
	const user = await db
		.collection("users")
		.findOne<{ cart?: { items?: MinimalItem[] } }>(
			{ _id: new ObjectId(userId) },
			{ projection: { cart: 1 } },
		);
	if (user?.cart?.items?.length) return "/checkout";
	return "/";
}
