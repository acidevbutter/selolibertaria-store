"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/api-auth";
import { canBuyOnSelolibertaria } from "@/lib/authz";
import {
	clearCartId,
	getCartCookieItems,
	getCartCouponCode,
	getCartId,
	persistCartSnapshot,
	setCartId,
} from "@/lib/cart-cookies";
import { buildPricedCartPayload } from "@/lib/cart-pricing";
import { commerce } from "@/lib/commerce-stripe";
import type { Cart } from "@/lib/commerce-types";
import { getDb } from "@/lib/mongodb";
import { normalizeCouponCode } from "@/lib/promotions";

interface MinimalItem {
	productId: string;
	variantId: string;
	quantity: number;
}

type SelolibertariaAuthContext = { kind: "guest" } | { kind: "blocked" } | { kind: "buyer"; userId: string };

async function getSelolibertariaAuthContext(): Promise<SelolibertariaAuthContext> {
	const auth = await requireAuth();
	if ("error" in auth) return { kind: "guest" };
	if (!canBuyOnSelolibertaria(auth.session.role)) return { kind: "blocked" };
	return { kind: "buyer", userId: auth.session.sub as string };
}

function toMinimalItems(items: { productId: string; variantId: string; quantity: number }[]): MinimalItem[] {
	const map = new Map<string, MinimalItem>();
	for (const item of items) {
		if (!item) continue;
		const { productId, variantId } = item;
		const quantity = Number.isFinite(item.quantity)
			? item.quantity
			: Number.parseInt(String(item.quantity), 10);
		if (!productId || !variantId || !Number.isFinite(quantity) || quantity <= 0) continue;
		const key = variantId;
		const existing = map.get(key);
		if (existing) existing.quantity += quantity;
		else map.set(key, { productId, variantId, quantity });
	}
	return Array.from(map.values());
}

async function buildCartFromMinimalItems(args: {
	cartId: string;
	items: MinimalItem[];
	couponCode?: string | null;
	userId?: string | null;
}): Promise<Cart | null> {
	if (args.items.length === 0) return null;
	const { cart } = await buildPricedCartPayload({
		cartId: args.cartId,
		minimalItems: args.items,
		couponCode: args.couponCode,
		userId: args.userId,
	});
	return cart;
}

export async function getCartAction(): Promise<Cart | null> {
	const authContext = await getSelolibertariaAuthContext();
	if (authContext.kind === "blocked") return null;
	if (authContext.kind === "buyer") {
		const userId = authContext.userId;
		const db = await getDb();
		const user = await db
			.collection("users")
			.findOne<{ cart?: { items: MinimalItem[]; couponCode?: string | null } }>(
				{ _id: new ObjectId(userId) },
				{ projection: { cart: 1 } },
			);

		if (user?.cart?.items && user.cart.items.length > 0) {
			return await buildCartFromMinimalItems({
				cartId: "user-cart",
				items: user.cart.items,
				couponCode: user.cart.couponCode ?? null,
				userId,
			});
		}

		const [cookieCartId, cookieItems, cookieCouponCode] = await Promise.all([
			getCartId(),
			getCartCookieItems(),
			getCartCouponCode(),
		]);

		if (cookieCartId || (cookieItems && cookieItems.length > 0)) {
			let minimal: MinimalItem[] | null = null;
			if (cookieCartId) {
				const cookieCart = commerce.cart.get({ cartId: cookieCartId });
				if (cookieCart && cookieCart.items.length > 0) {
					minimal = toMinimalItems(cookieCart.items);
					await persistCartSnapshot({ ...cookieCart, couponCode: cookieCouponCode });
				}
			}
			if ((!minimal || minimal.length === 0) && cookieItems && cookieItems.length > 0) {
				minimal = toMinimalItems(cookieItems);
			}
			if (minimal && minimal.length > 0) {
				await db.collection("users").updateOne(
					{ _id: new ObjectId(userId) },
					{
						$set: {
							cart: { items: minimal, couponCode: cookieCouponCode ?? null },
							updatedAt: new Date(),
						},
					},
				);
				if (cookieCartId) {
					try {
						await commerce.cart.clear({ cartId: cookieCartId });
					} catch {}
				}
				await clearCartId();
				return await buildCartFromMinimalItems({
					cartId: "user-cart",
					items: minimal,
					couponCode: cookieCouponCode ?? null,
					userId,
				});
			}
		}
		return null;
	}

	const [cartId, cookieItems, couponCode] = await Promise.all([
		getCartId(),
		getCartCookieItems(),
		getCartCouponCode(),
	]);
	if (!cartId && (!cookieItems || cookieItems.length === 0)) return null;

	let minimal: MinimalItem[] = [];
	if (cartId) {
		try {
			const cart = commerce.cart.get({ cartId });
			if (cart && cart.items.length > 0) {
				minimal = toMinimalItems(cart.items);
				await persistCartSnapshot({ ...cart, couponCode });
			}
		} catch {}
	}

	if (minimal.length === 0 && cookieItems && cookieItems.length > 0) {
		minimal = toMinimalItems(cookieItems);
	}

	if (minimal.length === 0) return null;

	return await buildCartFromMinimalItems({
		cartId: cartId || "guest-cookie",
		items: minimal,
		couponCode,
	});
}

export async function addToCartAction(variantId: string, quantity = 1): Promise<Cart | null> {
	const authContext = await getSelolibertariaAuthContext();
	if (authContext.kind === "blocked") return null;
	if (authContext.kind === "buyer") {
		const userId = authContext.userId;
		const db = await getDb();
		const user = await db
			.collection("users")
			.findOne<{ cart?: { items: MinimalItem[]; couponCode?: string | null } }>(
				{ _id: new ObjectId(userId) },
				{ projection: { cart: 1 } },
			);
		const items: MinimalItem[] = [...(user?.cart?.items || [])];
		let entry = items.find((item) => item.variantId === variantId);
		if (!entry) {
			entry = { productId: variantId, variantId, quantity: 0 };
			items.push(entry);
		}
		entry.quantity += quantity;
		if (entry.quantity <= 0) items.splice(items.indexOf(entry), 1);
		await db.collection("users").updateOne(
			{ _id: new ObjectId(userId) },
			{
				$set: {
					cart: { items, couponCode: user?.cart?.couponCode ?? null },
					updatedAt: new Date(),
				},
			},
		);
		return await buildCartFromMinimalItems({
			cartId: "user-cart",
			items,
			couponCode: user?.cart?.couponCode ?? null,
			userId,
		});
	}

	const [cartId, couponCode] = await Promise.all([getCartId(), getCartCouponCode()]);
	const cart = await commerce.cart.add({ cartId: cartId || undefined, variantId, quantity });
	await persistCartSnapshot({ ...cart, couponCode });
	return await buildCartFromMinimalItems({
		cartId: cart.id,
		items: toMinimalItems(cart.items),
		couponCode,
	});
}

export async function updateCartItemAction(variantId: string, quantity: number): Promise<Cart | null> {
	const authContext = await getSelolibertariaAuthContext();
	if (authContext.kind === "blocked") return null;
	if (authContext.kind === "buyer") {
		const userId = authContext.userId;
		const db = await getDb();
		const user = await db
			.collection("users")
			.findOne<{ cart?: { items: MinimalItem[]; couponCode?: string | null } }>(
				{ _id: new ObjectId(userId) },
				{ projection: { cart: 1 } },
			);
		if (!user?.cart?.items) return null;
		const items = [...user.cart.items];
		const index = items.findIndex((item) => item.variantId === variantId);
		if (index === -1) return await getCartAction();
		if (quantity <= 0) items.splice(index, 1);
		else items[index]!.quantity = quantity;
		await db.collection("users").updateOne(
			{ _id: new ObjectId(userId) },
			{
				$set: {
					cart: { items, couponCode: user.cart.couponCode ?? null },
					updatedAt: new Date(),
				},
			},
		);
		return await buildCartFromMinimalItems({
			cartId: "user-cart",
			items,
			couponCode: user.cart.couponCode ?? null,
			userId,
		});
	}

	const [cartId, couponCode] = await Promise.all([getCartId(), getCartCouponCode()]);
	if (!cartId) return null;
	const cart = await commerce.cart.update({ cartId, variantId, quantity });
	await persistCartSnapshot({ ...cart, couponCode });
	return await buildCartFromMinimalItems({
		cartId: cart.id,
		items: toMinimalItems(cart.items),
		couponCode,
	});
}

export async function removeFromCartAction(variantId: string): Promise<Cart | null> {
	return updateCartItemAction(variantId, 0);
}

export async function clearCartAction(): Promise<void> {
	const authContext = await getSelolibertariaAuthContext();
	if (authContext.kind === "blocked") return;
	if (authContext.kind === "buyer") {
		const userId = authContext.userId;
		const db = await getDb();
		await db
			.collection("users")
			.updateOne({ _id: new ObjectId(userId) }, { $unset: { cart: "" }, $set: { updatedAt: new Date() } });
		return;
	}
	const cartId = await getCartId();
	if (cartId) {
		await commerce.cart.clear({ cartId });
	}
	await clearCartId();
}

export async function applyCartCouponAction(rawCode: string): Promise<{ cart: Cart | null; error?: string }> {
	const code = normalizeCouponCode(rawCode);
	if (!code) return { cart: null, error: "Digite um cupom válido." };

	const authContext = await getSelolibertariaAuthContext();
	if (authContext.kind === "blocked") {
		return { cart: null, error: "Usuárias do backoffice não podem aplicar cupons nem realizar compras." };
	}

	if (authContext.kind === "buyer") {
		const userId = authContext.userId;
		const db = await getDb();
		const user = await db
			.collection("users")
			.findOne<{ cart?: { items: MinimalItem[]; couponCode?: string | null } }>(
				{ _id: new ObjectId(userId) },
				{ projection: { cart: 1 } },
			);
		const items = user?.cart?.items ?? [];
		if (items.length === 0) return { cart: null, error: "Seu carrinho está vazio." };
		try {
			const { cart } = await buildPricedCartPayload({
				cartId: "user-cart",
				minimalItems: items,
				couponCode: code,
				userId,
				strictCoupon: true,
			});
			await db
				.collection("users")
				.updateOne(
					{ _id: new ObjectId(userId) },
					{ $set: { cart: { items, couponCode: code }, updatedAt: new Date() } },
				);
			return { cart };
		} catch (error) {
			return { cart: null, error: error instanceof Error ? error.message : "Cupom inválido." };
		}
	}

	const [cartId, cookieItems] = await Promise.all([getCartId(), getCartCookieItems()]);
	const minimal =
		cookieItems && cookieItems.length > 0
			? toMinimalItems(cookieItems)
			: cartId
				? toMinimalItems((commerce.cart.get({ cartId })?.items ?? []) as MinimalItem[])
				: [];
	if (minimal.length === 0) return { cart: null, error: "Seu carrinho está vazio." };
	const nextCartId = cartId || "guest-cookie";
	try {
		const { cart } = await buildPricedCartPayload({
			cartId: nextCartId,
			minimalItems: minimal,
			couponCode: code,
			strictCoupon: true,
		});
		await setCartId(nextCartId, minimal, code);
		return { cart };
	} catch (error) {
		return { cart: null, error: error instanceof Error ? error.message : "Cupom inválido." };
	}
}

export async function removeCartCouponAction(): Promise<Cart | null> {
	const authContext = await getSelolibertariaAuthContext();
	if (authContext.kind === "blocked") return null;
	if (authContext.kind === "buyer") {
		const userId = authContext.userId;
		const db = await getDb();
		const user = await db
			.collection("users")
			.findOne<{ cart?: { items: MinimalItem[] } }>(
				{ _id: new ObjectId(userId) },
				{ projection: { cart: 1 } },
			);
		const items = user?.cart?.items ?? [];
		await db
			.collection("users")
			.updateOne({ _id: new ObjectId(userId) }, { $set: { "cart.couponCode": null, updatedAt: new Date() } });
		if (items.length === 0) return null;
		return await buildCartFromMinimalItems({
			cartId: "user-cart",
			items,
			couponCode: null,
			userId,
		});
	}

	const [cartId, cookieItems] = await Promise.all([getCartId(), getCartCookieItems()]);
	if (!cartId && (!cookieItems || cookieItems.length === 0)) return null;
	const minimal =
		cookieItems && cookieItems.length > 0
			? toMinimalItems(cookieItems)
			: toMinimalItems((commerce.cart.get({ cartId: cartId! })?.items ?? []) as MinimalItem[]);
	const nextCartId = cartId || "guest-cookie";
	await setCartId(nextCartId, minimal, null);
	if (minimal.length === 0) return null;
	return await buildCartFromMinimalItems({
		cartId: nextCartId,
		items: minimal,
		couponCode: null,
	});
}

export async function getCartItemCount(): Promise<number> {
	const cart = await getCartAction();
	return cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
}

export async function mergeGuestCartIntoUser(): Promise<Cart | null> {
	const authContext = await getSelolibertariaAuthContext();
	if (authContext.kind !== "buyer") return null;
	const userId = authContext.userId;
	const [cookieCartId, cookieItems, cookieCouponCode] = await Promise.all([
		getCartId(),
		getCartCookieItems(),
		getCartCouponCode(),
	]);
	if (!cookieCartId && (!cookieItems || cookieItems.length === 0)) return null;

	let guestItems: MinimalItem[] = [];
	if (cookieCartId) {
		try {
			const cookieCart = commerce.cart.get({ cartId: cookieCartId });
			if (cookieCart && cookieCart.items.length > 0) {
				guestItems = toMinimalItems(cookieCart.items);
			}
		} catch (error) {
			console.warn("[cart merge] failed to read guest cart", error);
		}
	}
	if (guestItems.length === 0 && cookieItems && cookieItems.length > 0) {
		guestItems = toMinimalItems(cookieItems);
	}
	if (guestItems.length === 0) {
		await clearCartId();
		return null;
	}

	const db = await getDb();
	const user = await db
		.collection("users")
		.findOne<{ cart?: { items: MinimalItem[]; couponCode?: string | null } }>(
			{ _id: new ObjectId(userId) },
			{ projection: { cart: 1 } },
		);

	const mergedMap = new Map<string, MinimalItem>();
	for (const existing of user?.cart?.items || []) {
		mergedMap.set(existing.variantId, { ...existing });
	}
	for (const line of guestItems) {
		const current = mergedMap.get(line.variantId);
		if (current) current.quantity += line.quantity;
		else mergedMap.set(line.variantId, { ...line });
	}
	const mergedItems = Array.from(mergedMap.values()).filter((item) => item.quantity > 0);
	const mergedCouponCode = cookieCouponCode ?? user?.cart?.couponCode ?? null;

	await db.collection("users").updateOne(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				cart: { items: mergedItems, couponCode: mergedCouponCode },
				updatedAt: new Date(),
			},
		},
	);

	try {
		if (cookieCartId) await commerce.cart.clear({ cartId: cookieCartId });
	} catch {}
	await clearCartId();

	return await buildCartFromMinimalItems({
		cartId: "user-cart",
		items: mergedItems,
		couponCode: mergedCouponCode,
		userId,
	});
}
