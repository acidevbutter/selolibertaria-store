import "server-only";

import type { ObjectId } from "mongodb";
import { commerce } from "@/lib/commerce-stripe";
import type { Product } from "@/lib/commerce-types";
import { getUserPreferredCurrencyById } from "@/lib/currency-preference";
import { ensureIndexes, getDb } from "@/lib/mongodb";

export interface FavoriteDoc {
	_id?: ObjectId;
	userId: string;
	productSlug: string;
	variantId?: string | null;
	productId?: string | null;
	snapshot: {
		name: string;
		image?: string | null;
		variantLabel?: string | null;
	};
	createdAt: Date;
	updatedAt: Date;
}

export interface FavoriteViewModel {
	id: string;
	productSlug: string;
	variantId?: string | null;
	productId?: string | null;
	name: string;
	image?: string | null;
	variantLabel?: string | null;
	product: Product | null;
}

export function buildFavoriteKey(productSlug: string, variantId?: string | null) {
	return `${productSlug}::${variantId ?? ""}`;
}

export async function listFavoriteDocsForUser(userId: string) {
	await ensureIndexes();
	const db = await getDb();
	return await db.collection<FavoriteDoc>("favorites").find({ userId }).sort({ createdAt: -1 }).toArray();
}

export async function listFavoriteKeysForUser(userId: string) {
	const favorites = await listFavoriteDocsForUser(userId);
	return new Set(favorites.map((favorite) => buildFavoriteKey(favorite.productSlug, favorite.variantId)));
}

export async function toggleFavorite(args: {
	userId: string;
	productSlug: string;
	variantId?: string | null;
	productId?: string | null;
	name: string;
	image?: string | null;
	variantLabel?: string | null;
}) {
	await ensureIndexes();
	const db = await getDb();
	const favorites = db.collection<FavoriteDoc>("favorites");
	const normalizedSlug = args.productSlug.trim();
	const normalizedVariantId = args.variantId?.trim() || null;
	const existing = await favorites.findOne({
		userId: args.userId,
		productSlug: normalizedSlug,
		variantId: normalizedVariantId,
	});

	if (existing?._id) {
		await favorites.deleteOne({ _id: existing._id });
		return { active: false };
	}

	await favorites.insertOne({
		userId: args.userId,
		productSlug: normalizedSlug,
		variantId: normalizedVariantId,
		productId: args.productId?.trim() || null,
		snapshot: {
			name: args.name,
			image: args.image ?? null,
			variantLabel: args.variantLabel ?? null,
		},
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	return { active: true };
}

export async function isFavorite(args: { userId: string; productSlug: string; variantId?: string | null }) {
	await ensureIndexes();
	const db = await getDb();
	const favorite = await db.collection("favorites").findOne({
		userId: args.userId,
		productSlug: args.productSlug.trim(),
		variantId: args.variantId?.trim() || null,
	});
	return Boolean(favorite);
}

export async function getFavoriteViewModels(userId: string): Promise<FavoriteViewModel[]> {
	const favorites = await listFavoriteDocsForUser(userId);
	const preferredCurrency = await getUserPreferredCurrencyById(userId);
	const entries = await Promise.all(
		favorites.map(async (favorite) => {
			const product = await commerce.product
				.get({ slug: favorite.productSlug, currency: preferredCurrency })
				.catch(() => null);
			return {
				id: favorite._id?.toString() ?? buildFavoriteKey(favorite.productSlug, favorite.variantId),
				productSlug: favorite.productSlug,
				variantId: favorite.variantId ?? null,
				productId: favorite.productId ?? null,
				name: favorite.snapshot.name,
				image: favorite.snapshot.image ?? null,
				variantLabel: favorite.snapshot.variantLabel ?? null,
				product,
			} satisfies FavoriteViewModel;
		}),
	);
	return entries;
}
