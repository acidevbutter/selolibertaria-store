import { type CatalogProductDocument, type CatalogVariantDocument, listCatalogProducts } from "@/lib/catalog";
import { filterRenderableProductImages } from "@/lib/product-image-utils";
import { getDecimalFromMinorAmount, getMinorAmountFromDecimal, slugify } from "@/lib/utils";

export type AdminProductVariant = {
	id: string;
	name: string;
	description: string;
	active: boolean;
	images: string[];
	slug: string;
	category: string;
	stock: string;
	order: string;
	variantLabel: string;
	variantOrder: string;
	priceId: string | null;
	priceAmount: number | null;
	priceDecimal: number | null;
	currency: string;
	priceActive: boolean;
};

export type AdminProductGroup = {
	slug: string;
	name: string;
	description: string;
	active: boolean;
	images: string[];
	category: string;
	stock: string;
	order: string;
	productType: string;
	format: string;
	variants: AdminProductVariant[];
};

const normalizeCurrency = (currency?: string | null) => (currency || "BRL").trim().toUpperCase();

export const parseCurrencyCode = (raw: FormDataEntryValue | null, fallback = "BRL") => {
	const value = String(raw ?? "")
		.trim()
		.toUpperCase();
	const normalized = value || fallback.trim().toUpperCase() || "BRL";
	if (!/^[A-Z]{3}$/.test(normalized)) {
		throw new Error("A moeda precisa usar um código válido de três letras.");
	}
	return normalized;
};

export const parseDisplayOrder = (value?: string | number | null) => {
	const parsed = Number.parseInt(String(value ?? "").trim(), 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.MAX_SAFE_INTEGER;
};

export const parseImageList = (raw: FormDataEntryValue | FormDataEntryValue[] | null) =>
	(Array.isArray(raw) ? raw : [raw])
		.flatMap((item) => String(item ?? "").split(/[\n,]/))
		.map((url) => url.trim())
		.filter(Boolean)
		.slice(0, 8);

export const parseOptionalString = (raw: FormDataEntryValue | null) => String(raw ?? "").trim();
export const parseBoolean = (raw: FormDataEntryValue | null) => raw === "on" || raw === "true";

export const parsePriceAmount = (amount: string, currency: string) => {
	const parsed = Number.parseFloat(amount.replace(",", "."));
	if (!Number.isFinite(parsed) || parsed < 0) {
		throw new Error("O preço precisa ser um valor válido e não negativo.");
	}
	return getMinorAmountFromDecimal({ amount: parsed, currency: normalizeCurrency(currency) });
};

function toAdminVariant(
	product: CatalogProductDocument,
	variant: CatalogVariantDocument,
): AdminProductVariant {
	const currency = normalizeCurrency(variant.currency);
	return {
		id: variant.id,
		name: product.name,
		description: variant.description ?? product.description ?? "",
		active: variant.published,
		images: filterRenderableProductImages(variant.images.length ? variant.images : product.images),
		slug: product.slug,
		category: product.category?.name ?? "",
		stock: variant.stock == null ? "" : String(variant.stock),
		order: product.order == null ? "" : String(product.order),
		variantLabel: variant.label ?? "",
		variantOrder: variant.order == null ? "" : String(variant.order),
		priceId: variant.id,
		priceAmount: Number.isFinite(variant.price) ? variant.price : null,
		priceDecimal: Number.isFinite(variant.price)
			? getDecimalFromMinorAmount({ amount: variant.price, currency })
			: null,
		currency,
		priceActive: variant.published,
	};
}

function toAdminGroup(product: CatalogProductDocument): AdminProductGroup {
	const variants = [...product.variants]
		.sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
		.map((variant) => toAdminVariant(product, variant));
	return {
		slug: product.slug,
		name: product.name,
		description: product.description ?? "",
		active: product.published && variants.some((variant) => variant.active),
		images: filterRenderableProductImages(product.images),
		category: product.category?.name ?? "",
		stock: product.stock == null ? "" : String(product.stock),
		order: product.order == null ? "" : String(product.order),
		productType: product.productType ?? "",
		format: product.format ?? "",
		variants,
	};
}

export async function listAdminProductGroups() {
	const products = await listCatalogProducts({ first: 500, includeUnpublished: true });
	return products.map(toAdminGroup).sort((a, b) => {
		const orderDiff = parseDisplayOrder(a.order) - parseDisplayOrder(b.order);
		return orderDiff || a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
	});
}

export async function getAdminProductGroup(slug: string) {
	const groups = await listAdminProductGroups();
	return groups.find((group) => group.slug === slug) ?? null;
}

export async function listAdminProductCategories() {
	const groups = await listAdminProductGroups();
	const categories = new Map<string, { name: string; slug: string; products: number; variants: number }>();
	for (const group of groups) {
		if (!group.category) continue;
		const slug = slugify(group.category);
		const category = categories.get(slug) ?? { name: group.category, slug, products: 0, variants: 0 };
		category.products += 1;
		category.variants += group.variants.length;
		categories.set(slug, category);
	}
	return Array.from(categories.values()).sort((a, b) =>
		a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
	);
}

export function getCatalogCurrency() {
	return parseCurrencyCode(null, env.CATALOG_CURRENCY || "BRL");
}

export function toPriceDecimal(amount: number | null, currency: string) {
	return typeof amount === "number" ? getDecimalFromMinorAmount({ amount, currency }) : null;
}

import { env } from "@/env.mjs";
