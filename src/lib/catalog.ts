import "server-only";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import { syncMediaUsage } from "@/lib/media-usage";
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
	"createdAt" | "updatedAt" | "legacyProviderIds"
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

async function request<T>(path: string, options: RequestInit = {}, authenticated = false): Promise<T> {
	const headers = new Headers(options.headers);
	if (authenticated) {
		const token = (await cookies()).get("session")?.value;
		if (!token) throw new Error("Autenticação obrigatória");
		headers.set("authorization", `Bearer ${token}`);
	}
	const response = await fetch(`${env.FASTAPI_API_URL}${path}`, {
		...options,
		headers,
		cache: "no-store",
	});
	if (response.status === 404) return null as T;
	if (!response.ok) throw new Error("Catálogo indisponível");
	return (await response.json()) as T;
}

export async function getCatalogProductBySlug(slug: string) {
	const product = await request<FastApiProduct | null>(`/catalog/${slugify(slug)}`);
	return product ? fromFastApiProduct(product) : null;
}

export async function getCatalogProductById(id: string) {
	const product = await request<FastApiProduct | null>(`/catalog/id/${encodeURIComponent(id)}`);
	return product ? fromFastApiProduct(product) : null;
}

export async function getCatalogProductByVariantId(variantId: string) {
	const product = await request<FastApiProduct | null>(`/catalog/variants/${encodeURIComponent(variantId)}`);
	return product ? fromFastApiProduct(product) : null;
}

export async function getCatalogManagementProductBySlug(slug: string) {
	const product = await request<FastApiProduct | null>(
		`/catalog/management/${encodeURIComponent(slugify(slug))}`,
		{},
		true,
	);
	return product ? fromFastApiProduct(product) : null;
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
	const body = await request<{ items: FastApiProduct[] }>(`${path}?${params}`, {}, includeUnpublished);
	return body.items.map(fromFastApiProduct);
}

type FastApiProduct = CatalogProductDocument & {
	category_name?: string | null;
	category_slug?: string | null;
	product_type?: string | null;
	created_at: string;
	updated_at: string;
};

function fromFastApiProduct(value: FastApiProduct): CatalogProductDocument {
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

function toFastApiVariant(variant: CatalogVariantDocument) {
	return {
		id: variant.id,
		label: variant.label ?? null,
		slug: variant.slug ?? null,
		description: variant.description ?? null,
		images: variant.images,
		price: variant.price,
		currency: variant.currency,
		stock: variant.stock ?? null,
		published: variant.published,
		order: variant.order ?? null,
		legacy_provider_ids: variant.legacyProviderIds ?? null,
	};
}

function toFastApiProduct(product: CatalogProductInput) {
	return {
		id: product.id,
		slug: product.slug,
		name: product.name,
		description: product.description ?? null,
		images: product.images,
		category: product.category ?? null,
		stock: product.stock ?? null,
		product_type: product.productType ?? null,
		format: product.format ?? null,
		order: product.order ?? null,
		published: product.published,
		legacy_provider_ids: product.legacyProviderIds ?? null,
		variants: product.variants.map(toFastApiVariant),
	};
}

export async function createCatalogProduct(product: CatalogProductInput) {
	const created = await request<FastApiProduct>(
		"/catalog/",
		{
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(toFastApiProduct(product)),
		},
		true,
	);
	await syncMediaUsage({
		entityType: "product",
		entityId: product.slug,
		entityLabel: product.name,
		field: "images",
		imageUrls: product.images,
	});
	return fromFastApiProduct(created);
}

export async function updateCatalogProduct(
	slug: string,
	payload: Omit<Partial<CatalogProductInput>, "id" | "variants">,
) {
	const body = {
		...payload,
		product_type: payload.productType,
		legacy_provider_ids: payload.legacyProviderIds,
	};
	delete body.productType;
	delete body.legacyProviderIds;
	const product = await request<FastApiProduct>(
		`/catalog/${encodeURIComponent(slugify(slug))}`,
		{
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		},
		true,
	);
	if (payload.images) {
		await syncMediaUsage({
			entityType: "product",
			entityId: slugify(slug),
			entityLabel: payload.name ?? slug,
			field: "images",
			imageUrls: payload.images,
		});
	}
	return fromFastApiProduct(product);
}

export async function addCatalogVariant(slug: string, variant: CatalogVariantDocument) {
	const product = await request<FastApiProduct>(
		`/catalog/${encodeURIComponent(slugify(slug))}/variants`,
		{
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(toFastApiVariant(variant)),
		},
		true,
	);
	await syncMediaUsage({
		entityType: "product_variant",
		entityId: variant.id,
		entityLabel: variant.label || slug,
		field: "images",
		imageUrls: variant.images,
	});
	return fromFastApiProduct(product);
}

export async function updateCatalogVariant(
	slug: string,
	variantId: string,
	payload: Partial<Omit<CatalogVariantDocument, "id">>,
) {
	const body = {
		...payload,
		legacy_provider_ids: payload.legacyProviderIds,
	};
	delete body.legacyProviderIds;
	const product = await request<FastApiProduct>(
		`/catalog/${encodeURIComponent(slugify(slug))}/variants/${encodeURIComponent(variantId)}`,
		{
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		},
		true,
	);
	if (payload.images) {
		await syncMediaUsage({
			entityType: "product_variant",
			entityId: variantId,
			entityLabel: payload.label || slug,
			field: "images",
			imageUrls: payload.images,
		});
	}
	return fromFastApiProduct(product);
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
