import Stripe from "stripe";
import { env } from "@/env.mjs";
import { filterRenderableProductImages } from "@/lib/product-image-utils";
import { getDecimalFromStripeAmount, getStripeAmountFromDecimal, slugify } from "@/lib/utils";

export type AdminStripeVariant = {
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

export type AdminStripeProductGroup = {
	slug: string;
	name: string;
	description: string;
	active: boolean;
	images: string[];
	category: string;
	stock: string;
	order: string;
	variants: AdminStripeVariant[];
};

let stripeClient: Stripe | null = null;

export function getAdminStripeClient() {
	if (stripeClient) {
		return stripeClient;
	}

	if (!env.STRIPE_SECRET_KEY) {
		throw new Error("Missing STRIPE_SECRET_KEY env variable");
	}

	stripeClient = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: undefined });
	return stripeClient;
}

const normalizeCurrency = (currency?: string | null) =>
	(currency || env.STRIPE_CURRENCY || "usd").toLowerCase();

export const parseCurrencyCode = (raw: FormDataEntryValue | null, fallback?: string) => {
	const value = String(raw ?? "")
		.trim()
		.toLowerCase();
	const normalized = value || fallback || env.STRIPE_CURRENCY || "usd";
	if (!/^[a-z]{3}$/i.test(normalized)) {
		throw new Error("Currency must be a valid 3-letter code, such as usd or brl.");
	}
	return normalized.toLowerCase();
};

const getDefaultPrice = (product: Stripe.Product): Stripe.Price | null => {
	if (typeof product.default_price === "object" && product.default_price) {
		return product.default_price as Stripe.Price;
	}
	return null;
};

const getProductSlug = (product: Stripe.Product) =>
	product.metadata.slug?.trim() || slugify(product.name) || product.id;

export const parseDisplayOrder = (value?: string | null) => {
	const parsed = Number.parseInt(String(value ?? "").trim(), 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.MAX_SAFE_INTEGER;
};

const mapProductToVariant = (product: Stripe.Product): AdminStripeVariant => {
	const price = getDefaultPrice(product);
	const currency = normalizeCurrency(price?.currency);
	const priceAmount = price?.unit_amount ?? null;

	return {
		id: product.id,
		name: product.name,
		description: product.description ?? "",
		active: product.active,
		images: filterRenderableProductImages(product.images),
		slug: getProductSlug(product),
		category: product.metadata.category ?? "",
		stock: product.metadata.stock ?? "",
		order: product.metadata.order ?? "",
		variantLabel: product.metadata.variant ?? "",
		variantOrder: product.metadata.variant_order ?? product.metadata.variantOrder ?? "",
		priceId: price?.id ?? null,
		priceAmount,
		priceDecimal:
			typeof priceAmount === "number" ? getDecimalFromStripeAmount({ amount: priceAmount, currency }) : null,
		currency,
		priceActive: price?.active ?? false,
	};
};

const sortVariants = (a: AdminStripeVariant, b: AdminStripeVariant) => {
	const orderA = Number.parseFloat(a.variantOrder || a.order || "");
	const orderB = Number.parseFloat(b.variantOrder || b.order || "");
	const normalizedA = Number.isFinite(orderA) ? orderA : Number.MAX_SAFE_INTEGER;
	const normalizedB = Number.isFinite(orderB) ? orderB : Number.MAX_SAFE_INTEGER;
	if (normalizedA !== normalizedB) return normalizedA - normalizedB;
	return (a.variantLabel || a.name).localeCompare(b.variantLabel || b.name, undefined, {
		sensitivity: "base",
	});
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
		throw new Error("Price must be a valid non-negative number.");
	}
	const normalizedCurrency = currency.trim().toLowerCase();
	if (!/^[a-z]{3}$/i.test(normalizedCurrency)) {
		throw new Error("Currency must be a valid 3-letter code, such as usd or brl.");
	}
	return getStripeAmountFromDecimal({ amount: parsed, currency: normalizedCurrency });
};

export async function listAdminStripeProductGroups(): Promise<AdminStripeProductGroup[]> {
	const stripe = getAdminStripeClient();
	const products: Stripe.Product[] = [];
	const groups = new Map<string, AdminStripeVariant[]>();

	for await (const product of stripe.products.list({ limit: 100, expand: ["data.default_price"] })) {
		products.push(product);
	}

	for (const product of products) {
		const variant = mapProductToVariant(product);
		const current = groups.get(variant.slug) ?? [];
		current.push(variant);
		groups.set(variant.slug, current);
	}

	return Array.from(groups.entries())
		.map(([slug, variants]) => {
			variants.sort(sortVariants);
			const primary = variants[0]!;
			return {
				slug,
				name: primary.name,
				description: primary.description,
				active: variants.some((variant) => variant.active),
				images: primary.images,
				category: primary.category,
				stock: primary.stock,
				order: primary.order,
				variants,
			};
		})
		.sort((a, b) => {
			const orderDiff = parseDisplayOrder(a.order) - parseDisplayOrder(b.order);
			if (orderDiff !== 0) return orderDiff;
			return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
		});
}

export async function getAdminStripeProductGroup(slug: string) {
	const groups = await listAdminStripeProductGroups();
	return groups.find((group) => group.slug === slug) ?? null;
}

export async function listAdminStripeCategories() {
	const groups = await listAdminStripeProductGroups();
	const categories = new Map<string, { name: string; slug: string; products: number; variants: number }>();

	for (const group of groups) {
		if (!group.category) continue;
		const slug = slugify(group.category);
		const existing = categories.get(slug) ?? { name: group.category, slug, products: 0, variants: 0 };
		existing.products += 1;
		existing.variants += group.variants.length;
		categories.set(slug, existing);
	}

	return Array.from(categories.values()).sort((a, b) =>
		a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
	);
}

export async function ensureProductPrice({
	product,
	amount,
	currency,
}: {
	product: Stripe.Product;
	amount: number;
	currency: string;
}) {
	const stripe = getAdminStripeClient();
	const currentPrice = getDefaultPrice(product);
	const normalizedCurrency = normalizeCurrency(currency);

	if (
		currentPrice &&
		currentPrice.unit_amount === amount &&
		currentPrice.currency.toLowerCase() === normalizedCurrency &&
		currentPrice.active
	) {
		return currentPrice;
	}

	const nextPrice = await stripe.prices.create({
		product: product.id,
		unit_amount: amount,
		currency: normalizedCurrency,
	});

	await stripe.products.update(product.id, { default_price: nextPrice.id });

	if (currentPrice?.id && currentPrice.active) {
		await stripe.prices.update(currentPrice.id, { active: false }).catch(() => null);
	}

	return nextPrice;
}

export async function updateProductsCategory(oldCategory: string, newCategory: string) {
	const stripe = getAdminStripeClient();
	const groups = await listAdminStripeProductGroups();
	const normalizedOld = slugify(oldCategory);
	const updates: Promise<Stripe.Response<Stripe.Product>>[] = [];

	for (const group of groups) {
		for (const variant of group.variants) {
			if (slugify(variant.category) !== normalizedOld) continue;
			updates.push(stripe.products.update(variant.id, { metadata: { category: newCategory } }));
		}
	}

	await Promise.all(updates);
	return updates.length;
}
