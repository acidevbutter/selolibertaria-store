import "server-only";

import { ObjectId } from "mongodb";
import { isUserBlocked, normalizeUserRole, type UserRole } from "@/lib/authz";
import { isMaintenanceModeEnabled } from "@/lib/maintenance-mode";
import { createPersistentSession } from "@/lib/session";

const MAINTENANCE_LOGIN_RESTRICTED_ERROR = "Login restrito à administração durante a manutenção.";

type LoginInput = {
	email: string;
	password: string;
	cartRaw?: string | null;
};

async function findUserForLogin(
	db: Awaited<ReturnType<typeof import("@/lib/mongodb")["getDb"]>>,
	email: string,
) {
	const normalizedEmail = email.trim().toLowerCase();
	const projection = {
		email: 1,
		passwordHash: 1,
		name: 1,
		role: 1,
		access: 1,
		preferredCurrency: 1,
	} as const;

	const exact = await db.collection("users").findOne<{
		_id: unknown;
		email: string;
		passwordHash?: string;
		name?: string;
		role?: string;
		access?: { blockedAt?: Date | string | null } | null;
		preferredCurrency?: string | null;
	}>({ email: normalizedEmail }, { projection });
	if (exact) {
		return exact;
	}

	// Keep legacy accounts with mixed-case emails able to log in, then normalize the record.
	return db.collection("users").findOne<{
		_id: unknown;
		email: string;
		passwordHash?: string;
		name?: string;
		role?: string;
		access?: { blockedAt?: Date | string | null } | null;
		preferredCurrency?: string | null;
	}>(
		{ email: { $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
		{ projection },
	);
}

export async function authenticateAndCreateSession({
	email,
	password,
	cartRaw,
}: LoginInput): Promise<
	{ ok: true; preferredCurrency?: string | null; role: UserRole } | { ok: false; error: string }
> {
	try {
		const [{ getDb }, bcryptjs] = await Promise.all([import("@/lib/mongodb"), import("bcryptjs")]);
		const bcrypt = (bcryptjs as typeof import("bcryptjs")).default;
		const db = await getDb();
		const normalizedEmail = email.trim().toLowerCase();
		const user = await findUserForLogin(db, normalizedEmail);
		if (!user?.passwordHash) return { ok: false, error: "Credenciais inválidas" };
		if (isUserBlocked(user)) {
			return { ok: false, error: "Esta conta foi bloqueada. Entre em contato com o suporte." };
		}

		const ok = await bcrypt.compare(password, user.passwordHash);
		if (!ok) return { ok: false, error: "Credenciais inválidas" };

		const role = normalizeUserRole(user.role);
		if (isMaintenanceModeEnabled() && role !== "admin") {
			return { ok: false, error: MAINTENANCE_LOGIN_RESTRICTED_ERROR };
		}

		if (user.email !== normalizedEmail) {
			await db
				.collection("users")
				.updateOne(
					{ _id: new ObjectId(String(user._id)) },
					{ $set: { email: normalizedEmail, updatedAt: new Date() } },
				);
			user.email = normalizedEmail;
		}

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
								import("@/lib/commerce"),
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
			email: normalizedEmail,
			name: user.name,
			role,
		});
		return { ok: true, preferredCurrency: user.preferredCurrency ?? null, role };
	} catch (error) {
		console.error("[login auth]", error);
		return { ok: false, error: "Erro de autenticação" };
	}
}
