"use server";

import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import { requireAuth } from "@/lib/api-auth";
import { canBuyOnSelolibertaria } from "@/lib/authz";
import { clearCartId, getCartCookieItems, getCartCouponCode, getCartId, setCartId } from "@/lib/cart-cookies";
import type { Cart } from "@/lib/commerce-types";

interface FastApiCartItem {
	product_id: string;
	variant_id: string;
	product_name: string;
	variant_label: string | null;
	unit_amount: number;
	currency: string;
	quantity: number;
}

interface FastApiCart {
	id: string;
	coupon_code: string | null;
	items: FastApiCartItem[];
}

type CartAuth = { kind: "guest" } | { kind: "blocked" } | { kind: "buyer"; token: string };

function normalizeCouponCode(value: string) {
	return value.trim().toUpperCase();
}

function isCartId(value: string | null): value is string {
	return Boolean(
		value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
	);
}

async function getCartAuth(): Promise<CartAuth> {
	const auth = await requireAuth();
	if ("error" in auth) return { kind: "guest" };
	if (!canBuyOnSelolibertaria(auth.session.role)) return { kind: "blocked" };
	const token = (await cookies()).get("session")?.value;
	return token ? { kind: "buyer", token } : { kind: "guest" };
}

async function api<T>(path: string, options: RequestInit = {}, token?: string): Promise<T | null> {
	const headers = new Headers(options.headers);
	if (options.body) headers.set("content-type", "application/json");
	if (token) headers.set("authorization", `Bearer ${token}`);
	const response = await fetch(`${env.FASTAPI_API_URL}${path}`, { ...options, headers, cache: "no-store" });
	if (response.status === 404 || response.status === 204) return null;
	if (!response.ok) {
		const body = (await response.json().catch(() => null)) as { detail?: string } | null;
		throw new Error(body?.detail || "Carrinho indisponível");
	}
	return (await response.json()) as T;
}

function toCart(cart: FastApiCart): Cart | null {
	if (!cart.items.length) return null;
	const subtotal = cart.items.reduce((sum, item) => sum + item.unit_amount * item.quantity, 0);
	return {
		id: cart.id,
		items: cart.items.map((item) => ({
			id: item.variant_id,
			productId: item.product_id,
			variantId: item.variant_id,
			quantity: item.quantity,
			price: item.unit_amount,
			product: { id: item.product_id, name: item.product_name, images: [] },
		})),
		total: subtotal,
		subtotal,
		discountTotal: 0,
		currency: cart.items[0]?.currency.toUpperCase() || "BRL",
		couponCode: cart.coupon_code,
		couponError: null,
		appliedPromotions: [],
	};
}

async function persistGuest(cart: FastApiCart): Promise<Cart | null> {
	const result = toCart(cart);
	if (!result) {
		await clearCartId();
		return null;
	}
	await setCartId(
		cart.id,
		result.items.map((item) => ({
			productId: item.productId,
			variantId: item.variantId,
			quantity: item.quantity,
		})),
		cart.coupon_code,
	);
	return result;
}

async function createGuestFromCookie(): Promise<FastApiCart> {
	const [items, couponCode] = await Promise.all([getCartCookieItems(), getCartCouponCode()]);
	let cart = await api<FastApiCart>("/carts/guest", { method: "POST" });
	if (!cart) throw new Error("Não foi possível criar o carrinho");
	for (const item of items ?? []) {
		cart = await api<FastApiCart>(`/carts/guest/${cart.id}/items`, {
			method: "POST",
			body: JSON.stringify({ variant_id: item.variantId, quantity: item.quantity }),
		});
		if (!cart) throw new Error("Não foi possível recuperar o carrinho");
	}
	if (couponCode) {
		cart = await api<FastApiCart>(`/carts/guest/${cart.id}/coupon`, {
			method: "PUT",
			body: JSON.stringify({ coupon_code: couponCode }),
		});
		if (!cart) throw new Error("Não foi possível recuperar o carrinho");
	}
	return cart;
}

async function getGuest(): Promise<FastApiCart | null> {
	const cartId = await getCartId();
	if (isCartId(cartId)) {
		const cart = await api<FastApiCart>(`/carts/guest/${cartId}`);
		if (cart) return cart;
	}
	return (await getCartCookieItems())?.length ? createGuestFromCookie() : null;
}

async function ensureGuest(): Promise<FastApiCart> {
	return (await getGuest()) ?? (await createGuestFromCookie());
}

export async function getCartAction(): Promise<Cart | null> {
	const auth = await getCartAuth();
	if (auth.kind === "blocked") return null;
	if (auth.kind === "buyer") {
		const cart = await api<FastApiCart>("/carts/me", {}, auth.token);
		return cart ? toCart(cart) : null;
	}
	const cart = await getGuest();
	return cart ? persistGuest(cart) : null;
}

export async function addToCartAction(variantId: string, quantity = 1): Promise<Cart | null> {
	const auth = await getCartAuth();
	if (auth.kind === "blocked") return null;
	const payload = { method: "POST", body: JSON.stringify({ variant_id: variantId, quantity }) };
	if (auth.kind === "buyer") {
		const cart = await api<FastApiCart>("/carts/me/items", payload, auth.token);
		return cart ? toCart(cart) : null;
	}
	const guest = await ensureGuest();
	const cart = await api<FastApiCart>(`/carts/guest/${guest.id}/items`, payload);
	return cart ? persistGuest(cart) : null;
}

export async function updateCartItemAction(variantId: string, quantity: number): Promise<Cart | null> {
	const auth = await getCartAuth();
	if (auth.kind === "blocked") return null;
	const payload = { method: "PUT", body: JSON.stringify({ quantity }) };
	if (auth.kind === "buyer") {
		const cart = await api<FastApiCart>(
			`/carts/me/items/${encodeURIComponent(variantId)}`,
			payload,
			auth.token,
		);
		return cart ? toCart(cart) : null;
	}
	const guest = await getGuest();
	if (!guest) return null;
	const cart = await api<FastApiCart>(
		`/carts/guest/${guest.id}/items/${encodeURIComponent(variantId)}`,
		payload,
	);
	return cart ? persistGuest(cart) : null;
}

export async function removeFromCartAction(variantId: string): Promise<Cart | null> {
	return updateCartItemAction(variantId, 0);
}

export async function clearCartAction(): Promise<void> {
	const auth = await getCartAuth();
	if (auth.kind === "blocked") return;
	if (auth.kind === "buyer") await api("/carts/me", { method: "DELETE" }, auth.token);
	else {
		const guest = await getGuest();
		if (guest) await api(`/carts/guest/${guest.id}`, { method: "DELETE" });
	}
	await clearCartId();
}

export async function applyCartCouponAction(rawCode: string): Promise<{ cart: Cart | null; error?: string }> {
	const couponCode = normalizeCouponCode(rawCode);
	if (!couponCode) return { cart: null, error: "Digite um cupom válido." };
	const auth = await getCartAuth();
	if (auth.kind === "blocked") return { cart: null, error: "Usuárias do backoffice não podem comprar." };
	try {
		if (auth.kind === "buyer") {
			const cart = await api<FastApiCart>(
				"/carts/me/coupon",
				{ method: "PUT", body: JSON.stringify({ coupon_code: couponCode }) },
				auth.token,
			);
			return { cart: cart ? toCart(cart) : null };
		}
		const guest = await ensureGuest();
		const cart = await api<FastApiCart>(`/carts/guest/${guest.id}/coupon`, {
			method: "PUT",
			body: JSON.stringify({ coupon_code: couponCode }),
		});
		return { cart: cart ? await persistGuest(cart) : null };
	} catch (error) {
		return { cart: null, error: error instanceof Error ? error.message : "Cupom inválido." };
	}
}

export async function removeCartCouponAction(): Promise<Cart | null> {
	const auth = await getCartAuth();
	if (auth.kind === "blocked") return null;
	if (auth.kind === "buyer") {
		const cart = await api<FastApiCart>(
			"/carts/me/coupon",
			{ method: "PUT", body: JSON.stringify({ coupon_code: null }) },
			auth.token,
		);
		return cart ? toCart(cart) : null;
	}
	const guest = await getGuest();
	if (!guest) return null;
	const cart = await api<FastApiCart>(`/carts/guest/${guest.id}/coupon`, {
		method: "PUT",
		body: JSON.stringify({ coupon_code: null }),
	});
	return cart ? persistGuest(cart) : null;
}

export async function getCartItemCount(): Promise<number> {
	const cart = await getCartAction();
	return cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
}

export async function mergeGuestCartIntoUser(): Promise<Cart | null> {
	const auth = await getCartAuth();
	if (auth.kind !== "buyer") return null;
	const guest = await getGuest();
	if (!guest) return getCartAction();
	const cart = await api<FastApiCart>(
		"/carts/me/merge",
		{ method: "POST", body: JSON.stringify({ guest_cart_id: guest.id }) },
		auth.token,
	);
	await clearCartId();
	return cart ? toCart(cart) : null;
}
