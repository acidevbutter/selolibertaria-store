"use client";

import { AddToCart } from "@/components/add-to-cart";
import type { ProductInfo } from "@/lib/commerce-types";
import { cn } from "@/lib/utils";
import { FavoriteToggle } from "@/ui/favorites/favorite-toggle.client";
import { YnsLink } from "@/ui/yns-link";

type ProductTeaserActionsProps = {
	href: string;
	productSlug: string;
	variantId?: string | null;
	favoriteActive?: boolean;
	canPurchase?: boolean;
	allowQuickAdd?: boolean;
	productInfo: ProductInfo;
	className?: string;
	favoriteClassName?: string;
	addToCartClassName?: string;
	viewLinkClassName?: string;
	addToCartLabel?: string;
	viewLabel?: string;
};

export function ProductTeaserActions({
	href,
	productSlug,
	variantId,
	favoriteActive = false,
	canPurchase = true,
	allowQuickAdd = false,
	productInfo,
	className,
	favoriteClassName,
	addToCartClassName,
	viewLinkClassName,
	addToCartLabel = "Adicionar ao carrinho",
	viewLabel = "Ver produto",
}: ProductTeaserActionsProps) {
	return (
		<div className={cn("flex flex-wrap items-center gap-3", className)}>
			<FavoriteToggle
				productSlug={productSlug}
				variantId={variantId ?? null}
				initialActive={favoriteActive}
				className={favoriteClassName}
			/>
			{canPurchase && allowQuickAdd && variantId ? (
				<AddToCart variantId={variantId} productInfo={productInfo} className={addToCartClassName}>
					{addToCartLabel}
				</AddToCart>
			) : null}
			<YnsLink href={href} className={viewLinkClassName}>
				{viewLabel}
			</YnsLink>
		</div>
	);
}
