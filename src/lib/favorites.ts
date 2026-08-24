import "server-only";

import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import { commerce } from "@/lib/commerce";
import type { Product } from "@/lib/commerce-types";

export interface FavoriteDoc {
	_id?: string;
	userId: string;
	productSlug: string;
	variantId?: string | null;
	productId?: string | null;
	snapshot: { name: string; image?: string | null; variantLabel?: string | null };
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

type FastApiFavorite = {
	id: string;
	product_slug: string;
	variant_id: string | null;
	product_id: string | null;
	snapshot: FavoriteDoc["snapshot"];
	created_at: string;
	updated_at: string;
};

export function buildFavoriteKey(productSlug: string, variantId?: string | null) {
	return `${productSlug}::${variantId ?? ""}`;
}

async function authorization() {
	const token = (await cookies()).get("session")?.value;
	if (!token) throw new Error("Autenticação obrigatória");
	return { authorization: `Bearer ${token}` };
}

export async function listFavoriteDocsForUser(userId: string): Promise<FavoriteDoc[]> {
	const response = await fetch(`${env.FASTAPI_API_URL}/favorites/me`, {
		headers: await authorization(),
		cache: "no-store",
	});
	if (!response.ok) throw new Error("Favoritos indisponíveis");
	return ((await response.json()) as FastApiFavorite[]).map((item) => ({
		_id: item.id,
		userId,
		productSlug: item.product_slug,
		variantId: item.variant_id,
		productId: item.product_id,
		snapshot: item.snapshot,
		createdAt: new Date(item.created_at),
		updatedAt: new Date(item.updated_at),
	}));
}

export async function listFavoriteKeysForUser(userId: string) {
	return new Set(
		(await listFavoriteDocsForUser(userId)).map((item) => buildFavoriteKey(item.productSlug, item.variantId)),
	);
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
	const response = await fetch(`${env.FASTAPI_API_URL}/favorites/toggle`, {
		method: "POST",
		headers: { ...(await authorization()), "content-type": "application/json" },
		body: JSON.stringify({
			product_slug: args.productSlug,
			variant_id: args.variantId,
			product_id: args.productId,
			name: args.name,
			image: args.image,
			variant_label: args.variantLabel,
		}),
		cache: "no-store",
	});
	if (!response.ok) throw new Error("Não foi possível atualizar os favoritos");
	return (await response.json()) as { active: boolean };
}

export async function isFavorite(args: { userId: string; productSlug: string; variantId?: string | null }) {
	return (await listFavoriteKeysForUser(args.userId)).has(buildFavoriteKey(args.productSlug, args.variantId));
}

export async function getFavoriteViewModels(userId: string): Promise<FavoriteViewModel[]> {
	const favorites = await listFavoriteDocsForUser(userId);
	return Promise.all(
		favorites.map(async (favorite) => ({
			id: favorite._id ?? buildFavoriteKey(favorite.productSlug, favorite.variantId),
			productSlug: favorite.productSlug,
			variantId: favorite.variantId ?? null,
			productId: favorite.productId ?? null,
			name: favorite.snapshot.name,
			image: favorite.snapshot.image ?? null,
			variantLabel: favorite.snapshot.variantLabel ?? null,
			product: await commerce.product.get({ slug: favorite.productSlug }).catch(() => null),
		})),
	);
}
