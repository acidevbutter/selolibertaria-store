import { cookies, headers } from "next/headers";
import type { Cart } from "@/lib/commerce-types";

export const CART_COOKIE = "yns_cart_id";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * `cookies().set()` throws when called during render (outside a Server Action or
 * Route Handler). Some read paths — e.g. the checkout page calling
 * `createTransparentCheckoutIntent()` during render — try to refresh the cart
 * cookie opportunistically; that failure is expected and harmless (the cookie is
 * written for real by /checkout/prepare and the cart actions), so it should not
 * surface as an error.
 */
function isReadOnlyCookieError(error: unknown): boolean {
	return error instanceof Error && /can only be modified in a Server Action/i.test(error.message);
}

export interface CartCookieItem {
	productId: string;
	variantId: string;
	quantity: number;
}

interface CartCookiePayload {
	id: string;
	items?: CartCookieItem[];
	couponCode?: string | null;
}

async function shouldUseSecureCartCookie(): Promise<boolean> {
	if (process.env.NODE_ENV !== "production") {
		return false;
	}

	try {
		const headerStore = await headers();
		const forwardedProto = headerStore.get("x-forwarded-proto");
		const origin = headerStore.get("origin");
		const referer = headerStore.get("referer");
		const host = headerStore.get("host");
		const isLocalHost = Boolean(host && /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host));
		const hintedHttps =
			forwardedProto === "https" || origin?.startsWith("https://") || referer?.startsWith("https://");

		if (isLocalHost && !hintedHttps) {
			return false;
		}

		if (forwardedProto) {
			return forwardedProto === "https";
		}

		if (origin) {
			return origin.startsWith("https://");
		}

		if (referer) {
			return referer.startsWith("https://");
		}

		return !isLocalHost;
	} catch {
		return true;
	}
}

function sanitizeItems(raw: unknown): CartCookieItem[] | undefined {
	if (!raw || !Array.isArray(raw)) {
		return undefined;
	}

	const deduped = new Map<string, CartCookieItem>();

	for (const entry of raw) {
		if (!entry || typeof entry !== "object") {
			continue;
		}

		const productId =
			typeof (entry as { productId?: unknown }).productId === "string"
				? (entry as { productId: string }).productId.trim()
				: "";
		const variantId =
			typeof (entry as { variantId?: unknown }).variantId === "string"
				? (entry as { variantId: string }).variantId.trim()
				: "";
		const quantity =
			typeof (entry as { quantity?: unknown }).quantity === "number"
				? (entry as { quantity: number }).quantity
				: Number.parseInt(String((entry as { quantity?: unknown }).quantity ?? ""), 10);

		if (!productId || !variantId || !Number.isFinite(quantity) || quantity <= 0) {
			continue;
		}

		const key = variantId;
		const existing = deduped.get(key);
		if (existing) {
			existing.quantity += quantity;
			continue;
		}

		deduped.set(key, { productId, variantId, quantity });
	}

	return deduped.size > 0 ? Array.from(deduped.values()) : undefined;
}

function decodeCartCookieValue(raw: string): string {
	try {
		return decodeURIComponent(raw);
	} catch {
		return raw;
	}
}

export function parseCartCookie(raw: string | undefined): CartCookiePayload | null {
	if (!raw) {
		return null;
	}

	const trimmed = raw.trim();
	if (!trimmed) {
		return null;
	}

	const decoded = decodeCartCookieValue(trimmed).trim();
	const candidates = decoded && decoded !== trimmed ? [trimmed, decoded] : [trimmed];

	for (const candidate of candidates) {
		try {
			const parsed = JSON.parse(candidate) as {
				id?: unknown;
				items?: unknown;
				couponCode?: unknown;
			};

			if (typeof parsed.id !== "string" || !parsed.id.trim()) {
				continue;
			}

			const items = sanitizeItems(parsed.items);
			const couponCode = typeof parsed.couponCode === "string" ? parsed.couponCode.trim() || null : null;

			return items ? { id: parsed.id.trim(), items, couponCode } : { id: parsed.id.trim(), couponCode };
		} catch {
			// Compatibilidade com formatos antigos.
		}
	}

	return { id: decoded || trimmed };
}

export async function getCartCookiePayload(): Promise<CartCookiePayload | null> {
	try {
		const raw = (await cookies()).get(CART_COOKIE)?.value;
		return parseCartCookie(raw) ?? null;
	} catch (error) {
		console.error("Failed to read cart cookie payload", error);
		return null;
	}
}

export async function getCartId(): Promise<string | null> {
	const payload = await getCartCookiePayload();
	return payload?.id ?? null;
}

export async function getCartCookieItems(): Promise<CartCookieItem[] | null> {
	const payload = await getCartCookiePayload();
	return payload?.items ?? null;
}

export async function getCartCouponCode(): Promise<string | null> {
	const payload = await getCartCookiePayload();
	return payload?.couponCode ?? null;
}

export async function setCartId(
	cartId: string,
	items?: CartCookieItem[],
	couponCode?: string | null,
): Promise<void> {
	try {
		const secure = await shouldUseSecureCartCookie();
		const sanitized = sanitizeItems(items) ?? undefined;
		const payload: CartCookiePayload =
			sanitized && sanitized.length > 0
				? { id: cartId, items: sanitized, couponCode: couponCode?.trim() || null }
				: { id: cartId, couponCode: couponCode?.trim() || null };

		(await cookies()).set(CART_COOKIE, encodeURIComponent(JSON.stringify(payload)), {
			httpOnly: true,
			secure,
			sameSite: "lax",
			maxAge: CART_COOKIE_MAX_AGE,
			path: "/",
		});
	} catch (error) {
		if (isReadOnlyCookieError(error)) return;
		console.error("Failed to set cart ID cookie", error);
	}
}

export async function persistCartSnapshot(
	cart: Pick<Cart, "id" | "items" | "couponCode"> | null | undefined,
): Promise<void> {
	if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
		await clearCartId();
		return;
	}

	const minimal = cart.items
		.map((item) => ({
			productId: item.productId,
			variantId: item.variantId,
			quantity: item.quantity,
		}))
		.filter(
			(item) =>
				typeof item.productId === "string" &&
				typeof item.variantId === "string" &&
				Number.isFinite(item.quantity) &&
				item.quantity > 0,
		);

	if (minimal.length === 0) {
		await clearCartId();
		return;
	}

	await setCartId(cart.id, minimal, cart.couponCode ?? null);
}

export async function clearCartId(): Promise<void> {
	try {
		(await cookies()).set(CART_COOKIE, "", {
			maxAge: 0,
			path: "/",
		});
	} catch (error) {
		if (isReadOnlyCookieError(error)) return;
		console.error("Failed to clear cart ID cookie", error);
	}
}
