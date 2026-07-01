import type { Product, ProductInfo, ProductVariant } from "@/lib/commerce-types";

export type ProductCardActionState = {
	defaultVariant: ProductVariant | null;
	preferredVariant: ProductVariant | null;
	variantId: string | null;
	quickAddAllowed: boolean;
	quickAddDisabled: boolean;
	productInfo: ProductInfo;
};

export function getProductCardActionState(product: Product): ProductCardActionState {
	const variants = product.variants ?? [];
	const defaultVariant = variants[0] ?? null;
	const preferredVariant = variants.find((variant) => (variant.stock ?? 1) > 0) ?? defaultVariant ?? null;
	const variantId = preferredVariant?.id ?? defaultVariant?.id ?? null;
	const isOutOfStock =
		typeof preferredVariant?.stock === "number"
			? preferredVariant.stock <= 0
			: typeof product.stock === "number"
				? product.stock <= 0
				: false;

	return {
		defaultVariant,
		preferredVariant,
		variantId,
		quickAddAllowed: Boolean(variantId) && variants.length <= 1 && !isOutOfStock,
		quickAddDisabled: isOutOfStock,
		productInfo: {
			id: product.id,
			name: product.name,
			images: product.images,
			summary: product.summary ?? null,
		},
	};
}
