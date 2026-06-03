import "server-only";

import { ObjectId } from "mongodb";
import { isUserBlocked, normalizeUserRole } from "@/lib/authz";
import { createPersistentSession } from "@/lib/session";

type LoginInput = {
	email: string;
	password: string;
	cartRaw?: string | null;
};

export async function authenticateAndCreateSession({
	email,
	password,
	cartRaw,
}: LoginInput): Promise<{ ok: true; preferredCurrency?: string | null } | { ok: false; error: string }> {
	try {
		const [{ getDb }, bcryptjs] = await Promise.all([import("@/lib/mongodb"), import("bcryptjs")]);
		const bcrypt = (bcryptjs as typeof import("bcryptjs")).default;
		const db = await getDb();
		const user = await db.collection("users").findOne<{
			_id: unknown;
			email: string;
			passwordHash?: string;
			name?: string;
			role?: string;
			access?: { blockedAt?: Date | string | null } | null;
			preferredCurrency?: string | null;
		}>(
			{ email: email.toLowerCase() },
			{ projection: { email: 1, passwordHash: 1, name: 1, role: 1, access: 1, preferredCurrency: 1 } },
		);
		if (!user?.passwordHash) return { ok: false, error: "Invalid credentials" };
		if (isUserBlocked(user)) return { ok: false, error: "This account has been blocked. Contact support." };

		const ok = await bcrypt.compare(password, user.passwordHash);
		if (!ok) return { ok: false, error: "Invalid credentials" };

		let overrideApplied = false;
		if (typeof cartRaw === "string" && cartRaw.trim()) {
			try {
				const parsed = JSON.parse(cartRaw) as {
					items?: { productId: string; variantId: string; quantity: number }[];
				};
				if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
					const map = new Map<string, { productId: string; variantId: string; quantity: number }>();
					for (const item of parsed.items) {
						if (!item || typeof item !== "object") continue;
						if (!item.variantId || !item.productId) continue;
						if (typeof item.quantity !== "number" || item.quantity <= 0) continue;
						const existing = map.get(item.variantId);
						if (existing) existing.quantity += item.quantity;
						else {
							map.set(item.variantId, {
								productId: item.productId,
								variantId: item.variantId,
								quantity: item.quantity,
							});
						}
					}
					const minimal = Array.from(map.values()).filter((item) => item.quantity > 0);
					if (minimal.length > 0) {
						await db
							.collection("users")
							.updateOne(
								{ _id: new ObjectId(String(user._id)) },
								{ $set: { cart: { items: minimal }, updatedAt: new Date() } },
							);
						try {
							const [{ getCartId, clearCartId }, { commerce }] = await Promise.all([
								import("@/lib/cart-cookies"),
								import("@/lib/commerce-stripe"),
							]);
							const guestId = await getCartId();
							if (guestId) {
								try {
									await commerce.cart.clear({ cartId: guestId });
								} catch {}
								await clearCartId();
							}
						} catch {}
						overrideApplied = true;
						console.debug("[login] cart override applied", minimal.length);
					}
				} else {
					console.debug("[login] no valid cart items to override");
				}
			} catch (error) {
				console.warn("[login] failed to parse cart payload", error);
			}
		}
		if (!overrideApplied) {
			console.debug("[login] no cart override");
		}

		await createPersistentSession({
			id: String(user._id),
			email: user.email,
			name: user.name,
			role: normalizeUserRole(user.role),
		});
		return { ok: true, preferredCurrency: user.preferredCurrency ?? null };
	} catch (error) {
		console.error("[login auth]", error);
		return { ok: false, error: "Authentication error" };
	}
}
