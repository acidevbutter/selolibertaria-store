import "server-only";

import { randomUUID } from "node:crypto";
import {
	type CatalogProductDocument,
	type CatalogVariantDocument,
	getCatalogProductById,
	getCatalogProductBySlug,
	getCatalogProductByVariantId,
	listCatalogProducts,
} from "@/lib/catalog";
import type {
	BrowseResult,
	Cart,
	Product,
	ProductInfo,
	ProductVariant,
	YnsProduct,
} from "@/lib/commerce-types";
import { resolveSupportedCurrency, type SupportedCurrency } from "@/lib/currency";
import { applyAutomaticPromotionsToProducts } from "@/lib/promotions";

const carts = new Map<string, Cart>();

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

function toProductInfo(product: Product): ProductInfo {
	return { id: product.id, name: product.name, images: product.images, summary: product.summary };
}

function findVariant(product: Product, variantId: string) {
	return product.variants?.find((variant) => variant.id === variantId) ?? null;
}

export class MongoCommerce {
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

	private ensureCart(cartId?: string, currency = "BRL") {
		if (cartId && carts.has(cartId)) return carts.get(cartId)!;
		const id = cartId || `cart_${randomUUID()}`;
		const cart: Cart = { id, items: [], total: 0, currency };
		carts.set(id, cart);
		return cart;
	}

	cart_get({ cartId }: { cartId: string }) {
		return carts.get(cartId) || null;
	}

	async cart_add({ cartId, variantId, quantity }: { cartId?: string; variantId: string; quantity: number }) {
		const cart = this.ensureCart(cartId);
		const { product, variant } = await this.lookupVariant(variantId);
		const existing = cart.items.find((item) => item.variantId === variant.id);
		if (existing) existing.quantity += quantity;
		else {
			cart.items.push({
				id: variant.id,
				productId: product.id,
				variantId: variant.id,
				quantity,
				price: variant.price,
				product: toProductInfo(product),
			});
		}
		this.recalculate(cart);
		return cart;
	}

	async cart_update({
		cartId,
		variantId,
		quantity,
	}: {
		cartId: string;
		variantId: string;
		quantity: number;
	}) {
		const cart = this.ensureCart(cartId);
		if (quantity <= 0) cart.items = cart.items.filter((item) => item.variantId !== variantId);
		else {
			const line = cart.items.find((item) => item.variantId === variantId);
			if (!line) return this.cart_add({ cartId, variantId, quantity });
			line.quantity = quantity;
		}
		this.recalculate(cart);
		return cart;
	}

	async cart_remove({ cartId, variantId }: { cartId: string; variantId: string }) {
		const cart = this.ensureCart(cartId);
		cart.items = cart.items.filter((item) => item.variantId !== variantId);
		this.recalculate(cart);
		return cart;
	}

	cart_clear({ cartId }: { cartId: string }) {
		carts.delete(cartId);
	}

	private recalculate(cart: Cart) {
		cart.total = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
	}
}

const mongoCommerce = new MongoCommerce();
export const commerce = {
	product: {
		get: (args: { slug: string; currency?: SupportedCurrency | null }) => mongoCommerce.product_get(args),
		browse: (args: { first?: number; category?: string; currency?: SupportedCurrency | null }) =>
			mongoCommerce.product_browse(args),
	},
	variant: {
		resolve: (args: { id: string; currency?: SupportedCurrency | null }) =>
			mongoCommerce.lookupVariant(args.id, args.currency),
	},
	cart: {
		get: (args: { cartId: string }) => mongoCommerce.cart_get(args),
		add: (args: { cartId?: string; variantId: string; quantity: number }) => mongoCommerce.cart_add(args),
		update: (args: { cartId: string; variantId: string; quantity: number }) =>
			mongoCommerce.cart_update(args),
		remove: (args: { cartId: string; variantId: string }) => mongoCommerce.cart_remove(args),
		clear: (args: { cartId: string }) => mongoCommerce.cart_clear(args),
	},
};

export type { Cart, Product, YnsProduct } from "@/lib/commerce-types";
export default commerce;
