import "server-only";

import { createHash } from "node:crypto";
import type { Collection, Db, Filter, ObjectId } from "mongodb";
import { env } from "@/env.mjs";
import { getDb } from "@/lib/mongodb";
import { filterRenderableProductImages } from "@/lib/product-image-utils";
import { slugify } from "@/lib/utils";

export interface CatalogVariantDocument {
	id: string;
	label?: string | null;
	slug?: string | null;
	description?: string | null;
	images: string[];
	price: number;
	currency: string;
	stock?: number | null;
	published: boolean;
	order?: number | null;
	legacyProviderIds?: {
		productId?: string | null;
		priceId?: string | null;
	} | null;
}

export interface CatalogProductDocument {
	_id?: ObjectId;
	id: string;
	slug: string;
	name: string;
	description?: string | null;
	images: string[];
	category?: { name: string; slug: string } | null;
	stock?: number | null;
	productType?: string | null;
	format?: string | null;
	order?: number | null;
	published: boolean;
	variants: CatalogVariantDocument[];
	legacyProviderIds?: {
		productIds?: string[];
		priceIds?: string[];
		migratedAt?: Date;
	} | null;
	createdAt: Date;
	updatedAt: Date;
}

export type CatalogProductInput = Omit<
	CatalogProductDocument,
	"_id" | "createdAt" | "updatedAt" | "legacyProviderIds"
> & {
	legacyProviderIds?: CatalogProductDocument["legacyProviderIds"];
};

export function catalogProductId(slug: string) {
	return `product_${slugify(slug)}`;
}

export function catalogVariantId(slug: string, label: string | null | undefined, fallback = "default") {
	const normalized = slugify(label || fallback) || fallback;
	return `variant_${slugify(slug)}_${normalized}`;
}

export function deterministicCatalogId(value: string, prefix: string) {
	return `${prefix}_${createHash("sha256").update(value).digest("hex").slice(0, 20)}`;
}

export async function getCatalogCollection(): Promise<Collection<CatalogProductDocument>> {
	const db = await getDb();
	return db.collection<CatalogProductDocument>("catalogProducts");
}

export async function ensureCatalogIndexes(db?: Db) {
	const currentDb = db ?? (await getDb());
	const products = currentDb.collection<CatalogProductDocument>("catalogProducts");
	await products.createIndex({ slug: 1 }, { unique: true });
	await products.createIndex({ published: 1, order: 1, name: 1 });
	await products.createIndex({ "category.slug": 1, published: 1, order: 1 });
	await products.createIndex({ "variants.id": 1 }, { unique: true });
	await products.createIndex({ productType: 1, format: 1 });
}

export async function upsertCatalogProduct(input: CatalogProductInput) {
	const products = await getCatalogCollection();
	const now = new Date();
	const { _id: _ignored, ...document } = input as CatalogProductDocument;
	await products.updateOne(
		{ slug: input.slug },
		{
			$set: { ...document, updatedAt: now },
			$setOnInsert: { createdAt: now },
		},
		{ upsert: true },
	);
	return products.findOne({ slug: input.slug });
}

export async function getCatalogProductBySlug(slug: string) {
	const response = await fetch(`${env.FASTAPI_API_URL}/catalog/${slugify(slug)}`, { cache: "no-store" });
	if (response.status === 404) return null;
	if (!response.ok) throw new Error("Catálogo indisponível");
	return fromFastApiProduct(await response.json());
}

export async function getCatalogProductById(id: string) {
	const response = await fetch(`${env.FASTAPI_API_URL}/catalog/id/${encodeURIComponent(id)}`, {
		cache: "no-store",
	});
	if (response.status === 404) return null;
	if (!response.ok) throw new Error("Catálogo indisponível");
	return fromFastApiProduct(await response.json());
}

export async function getCatalogProductByVariantId(variantId: string) {
	const response = await fetch(`${env.FASTAPI_API_URL}/catalog/variants/${encodeURIComponent(variantId)}`, {
		cache: "no-store",
	});
	if (response.status === 404) return null;
	if (!response.ok) throw new Error("Catálogo indisponível");
	return fromFastApiProduct(await response.json());
}

export async function listCatalogProducts({
	first = 50,
	category,
	includeUnpublished = false,
}: {
	first?: number;
	category?: string;
	includeUnpublished?: boolean;
} = {}) {
	const params = new URLSearchParams({ page_size: String(Math.max(1, first)) });
	if (category) params.set("category", slugify(category));
	const path = includeUnpublished ? "/catalog/management/" : "/catalog/";
	const response = await fetch(`${env.FASTAPI_API_URL}${path}?${params}`, { cache: "no-store" });
	if (!response.ok) throw new Error("Catálogo indisponível");
	const body = (await response.json()) as { items: unknown[] };
	return body.items.map(fromFastApiProduct);
}

function fromFastApiProduct(
	value: CatalogProductDocument & {
		category_name?: string | null;
		category_slug?: string | null;
		product_type?: string | null;
		created_at: string;
		updated_at: string;
	},
): CatalogProductDocument {
	return normalizeCatalogProductDocument({
		...value,
		category:
			value.category_name && value.category_slug
				? { name: value.category_name, slug: value.category_slug }
				: null,
		productType: value.product_type,
		createdAt: new Date(value.created_at),
		updatedAt: new Date(value.updated_at),
		variants: value.variants,
	});
}

export function normalizeCatalogStock(value: unknown): number | null {
	if (value === null || value === undefined || value === "") return null;
	const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function normalizeCatalogProductDocument(
	product: CatalogProductDocument,
	options: { includeUnpublished?: boolean } = {},
): CatalogProductDocument {
	const variants = product.variants
		.filter((variant) => options.includeUnpublished || variant.published)
		.map((variant) => ({
			...variant,
			images: filterRenderableProductImages(variant.images),
			currency: String(variant.currency || "BRL").toUpperCase(),
			stock: normalizeCatalogStock(variant.stock),
		}));
	return {
		...product,
		images: filterRenderableProductImages(product.images),
		stock: normalizeCatalogStock(product.stock),
		variants,
	};
}
