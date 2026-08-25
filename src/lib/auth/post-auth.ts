import "server-only";

import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import { isBackofficeRole } from "@/lib/authz";
import { clearCartId, getCartCookieItems, getCartCouponCode, getCartId } from "@/lib/cart-cookies";

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

export async function mergeGuestCartIntoUserCart(_userId: string) {
	const [, cookieItems, couponCode] = await Promise.all([
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
	if (incoming.size === 0) return;
	const token = (await cookies()).get("session")?.value;
	if (!token) throw new Error("Autenticação obrigatória");
	const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
	await Promise.all(
		aggregateItems(Array.from(incoming.values())).map(async (item) => {
			const response = await fetch(`${env.FASTAPI_API_URL}/carts/me/items`, {
				method: "POST",
				headers,
				body: JSON.stringify({
					product_id: item.productId,
					variant_id: item.variantId,
					quantity: item.quantity,
				}),
				cache: "no-store",
			});
			if (!response.ok) throw new Error("Não foi possível mesclar o carrinho");
		}),
	);
	if (couponCode) {
		await fetch(`${env.FASTAPI_API_URL}/carts/me/coupon`, {
			method: "PUT",
			headers,
			body: JSON.stringify({ coupon_code: couponCode }),
			cache: "no-store",
		});
	}
	await clearCartId();
}

export async function resolvePostAuthRedirect(userId: string, role?: string | null) {
	if (isBackofficeRole(role)) return "/admin";
	const cookieItems = await getCartCookieItems();
	if (cookieItems && cookieItems.length > 0) return "/checkout";
	const token = (await cookies()).get("session")?.value;
	if (token) {
		const response = await fetch(`${env.FASTAPI_API_URL}/carts/me`, {
			headers: { authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (response.ok && ((await response.json()) as { items?: unknown[] }).items?.length) return "/checkout";
	}
	return "/";
}
