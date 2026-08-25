import "server-only";

import {
	type CatalogProductDocument,
	type CatalogVariantDocument,
	getCatalogProductById,
	getCatalogProductBySlug,
	getCatalogProductByVariantId,
	listCatalogProducts,
} from "@/lib/catalog";
import type { BrowseResult, Product, ProductVariant, YnsProduct } from "@/lib/commerce-types";
import { resolveSupportedCurrency, type SupportedCurrency } from "@/lib/currency";
import { applyAutomaticPromotionsToProducts } from "@/lib/promotions";

function mapVariant(product: CatalogProductDocument, variant: CatalogVariantDocument): ProductVariant {
	return {
		id: variant.id,
		price: variant.price,
		currency: String(variant.currency || "BRL").toUpperCase(),
		priceId: variant.id,
		label: variant.label ?? null,
		slug: variant.slug ?? null,
		productId: product.id,
		description: variant.description ?? product.description ?? null,
		images: variant.images.length > 0 ? variant.images : product.images,
		stock: variant.stock ?? null,
		productType: product.productType ?? null,
		format: product.format ?? null,
	};
}

function mapProduct(
	product: CatalogProductDocument,
	preferredCurrency?: SupportedCurrency | null,
): YnsProduct {
	const desiredCurrency = resolveSupportedCurrency(preferredCurrency);
	const variants = product.variants.map((variant) => mapVariant(product, variant));
	const primary = variants[0];
	const currency = primary?.currency || desiredCurrency || "BRL";
	return {
		id: product.id,
		name: product.name,
		images: product.images,
		summary: product.description ?? null,
		slug: product.slug,
		price: primary?.price ?? 0,
		currency,
		stock: product.stock ?? primary?.stock ?? null,
		variants,
		category: product.category ?? null,
		productType: product.productType ?? null,
		format: product.format ?? null,
	};
}

function findVariant(product: Product, variantId: string) {
	return product.variants?.find((variant) => variant.id === variantId) ?? null;
}

export class FastApiCommerce {
	async product_get({ slug, currency }: { slug: string; currency?: SupportedCurrency | null }) {
		try {
			const document = await getCatalogProductBySlug(slug);
			if (!document || !document.published) return null;
			const product = mapProduct(document, currency);
			return (await applyAutomaticPromotionsToProducts([product]))[0] ?? product;
		} catch (error) {
			console.warn(
				`[catalog] product_get unavailable: ${error instanceof Error ? error.message : String(error)}`,
			);
			return null;
		}
	}

	async product_browse({
		first = 50,
		category,
		currency,
	}: {
		first?: number;
		category?: string;
		currency?: SupportedCurrency | null;
	}): Promise<BrowseResult<Product>> {
		try {
			const products = (await listCatalogProducts({ first, category })).map((product) =>
				mapProduct(product, currency),
			);
			return { data: await applyAutomaticPromotionsToProducts(products) };
		} catch (error) {
			console.warn(
				`[catalog] product_browse unavailable: ${error instanceof Error ? error.message : String(error)}`,
			);
			return { data: [] };
		}
	}

	async lookupVariant(
		variantOrProductId: string,
		preferredCurrency?: SupportedCurrency | null,
	): Promise<{ product: Product; variant: ProductVariant }> {
		const document =
			(await getCatalogProductByVariantId(variantOrProductId)) ||
			(await getCatalogProductById(variantOrProductId));
		if (!document || !document.published) {
			throw new Error(`Variant or product not found: ${variantOrProductId}`);
		}
		const product =
			(await applyAutomaticPromotionsToProducts([mapProduct(document, preferredCurrency)]))[0] ??
			mapProduct(document, preferredCurrency);
		const variant = findVariant(product, variantOrProductId) ?? product.variants?.[0];
		if (!variant) throw new Error(`Variant not found: ${variantOrProductId}`);
		return { product, variant };
	}
}

const fastApiCommerce = new FastApiCommerce();
export const commerce = {
	product: {
		get: (args: { slug: string; currency?: SupportedCurrency | null }) => fastApiCommerce.product_get(args),
		browse: (args: { first?: number; category?: string; currency?: SupportedCurrency | null }) =>
			fastApiCommerce.product_browse(args),
	},
	variant: {
		resolve: (args: { id: string; currency?: SupportedCurrency | null }) =>
			fastApiCommerce.lookupVariant(args.id, args.currency),
	},
};

export type { Product, YnsProduct } from "@/lib/commerce-types";
export default commerce;
