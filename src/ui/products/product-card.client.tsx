"use client";

import { Loader2, Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/context/cart-context";
import type { ProductInfo } from "@/lib/commerce-types";
import { getProductImageOptimizationProps } from "@/lib/product-image-utils";
import { cn } from "@/lib/utils";
import { FavoriteToggle } from "@/ui/favorites/favorite-toggle.client";
import { Button } from "@/ui/shadcn/button";
import { YnsLink } from "@/ui/yns-link";

interface ProductCardVariantOption {
	id: string;
	label: string;
	inStock: boolean;
	priceLabel: string;
	compareAtLabel?: string | null;
	promotionLabel?: string | null;
}

interface ProductCardProps {
	href: string;
	name: string;
	imageUrl?: string | null;
	imageAlt: string;
	productSlug: string;
	variantId?: string | null;
	favoriteActive?: boolean;
	priceLabel: string;
	compareAtLabel?: string | null;
	promotionLabel?: string | null;
	canPurchase?: boolean;
	quickAddDisabled?: boolean;
	variantOptions?: ProductCardVariantOption[];
	productInfo: ProductInfo;
	loading?: "eager" | "lazy";
	priority?: boolean;
}

export function ProductCard({
	href,
	name,
	imageUrl,
	imageAlt,
	productSlug,
	variantId,
	favoriteActive = false,
	priceLabel,
	compareAtLabel,
	promotionLabel,
	canPurchase = true,
	quickAddDisabled = false,
	variantOptions = [],
	productInfo,
	loading,
	priority,
}: ProductCardProps) {
	const { openCart, optimisticAdd } = useCart();
	const [isAdding, setIsAdding] = useState(false);
	const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
		() => variantOptions.find((variant) => variant.inStock)?.id ?? variantId ?? variantOptions[0]?.id ?? null,
	);
	const selectedVariant = variantOptions.find((variant) => variant.id === selectedVariantId) ?? null;
	const resolvedVariantId = selectedVariant?.id ?? variantId ?? null;
	const resolvedQuickAddDisabled = selectedVariant ? !selectedVariant.inStock : quickAddDisabled;
	const resolvedPriceLabel = selectedVariant?.priceLabel ?? priceLabel;
	const resolvedCompareAtLabel = selectedVariant ? (selectedVariant.compareAtLabel ?? null) : compareAtLabel;
	const resolvedPromotionLabel = selectedVariant ? (selectedVariant.promotionLabel ?? null) : promotionLabel;

	const handleQuickAdd = async (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		if (!resolvedVariantId || resolvedQuickAddDisabled || isAdding) return;

		setIsAdding(true);
		try {
			await optimisticAdd(resolvedVariantId, 1, productInfo);
			openCart();
		} catch {
			// Cart context already logs failures.
		} finally {
			setIsAdding(false);
		}
	};

	const handleVariantSelect = (event: React.MouseEvent<HTMLButtonElement>, nextVariantId: string) => {
		event.preventDefault();
		event.stopPropagation();
		setSelectedVariantId(nextVariantId);
	};

	return (
		<article className="group relative flex h-full flex-col overflow-hidden border border-border/60 bg-card/95 p-1.5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-red-500/30 hover:shadow-[0_20px_50px_-24px_rgba(0,0,0,0.65)] focus-within:-translate-y-0.5 focus-within:border-red-500/30 focus-within:shadow-[0_20px_50px_-24px_rgba(0,0,0,0.65)]">
			<div className="absolute right-5 top-5 z-20">
				<FavoriteToggle
					productSlug={productSlug}
					variantId={variantId ?? null}
					initialActive={favoriteActive}
					className="border-white/70 bg-background/90 shadow-md backdrop-blur-sm hover:border-red-500"
				/>
			</div>

			<div className="relative overflow-hidden bg-muted">
				<YnsLink href={href} className="block">
					{imageUrl ? (
						<>
							<div className="absolute inset-0 z-10 bg-linear-to-t from-black/60 via-black/10 to-transparent opacity-0 transition duration-300 group-hover:opacity-100 group-focus-within:opacity-100" />
							<div className="aspect-square w-full overflow-hidden bg-background">
								<Image
									className="h-full w-full object-contain object-center p-3 transition duration-500 group-hover:scale-[1.04] group-hover:opacity-80 group-focus-within:scale-[1.04] group-focus-within:opacity-80"
									src={imageUrl}
									width={768}
									height={768}
									loading={loading}
									priority={priority}
									sizes="(max-width: 1024px) 100vw, (max-width: 1280px) 50vw, 700px"
									alt={imageAlt}
									{...getProductImageOptimizationProps(imageUrl)}
								/>
							</div>
						</>
					) : (
						<div className="flex aspect-square items-center justify-center bg-muted text-sm text-muted-foreground">
							No image available
						</div>
					)}
				</YnsLink>

				{canPurchase ? (
					<div className="absolute inset-x-3 bottom-3 z-20 flex justify-end">
						<Button
							type="button"
							onClick={handleQuickAdd}
							disabled={resolvedQuickAddDisabled || !resolvedVariantId || isAdding}
							aria-label={resolvedQuickAddDisabled ? "Sold out" : "Add to cart"}
							style={{
								transitionDuration: "1000ms",
								transitionProperty: "width, background-color, box-shadow, transform",
								transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
							}}
							className={cn(
								"group/quickadd pointer-events-auto flex aspect-square h-11 w-11 min-w-11 items-center justify-start overflow-hidden rounded-full border border-white/15 bg-black/90 px-0 text-white shadow-lg backdrop-blur-md transition-[width,background-color,box-shadow,transform] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]",
								!resolvedQuickAddDisabled &&
									"hover:w-44 hover:bg-red-600 hover:!text-black focus-visible:w-44 focus-visible:bg-red-600 focus-visible:!text-black",
								isAdding && "w-44 bg-red-600 !text-black",
								resolvedQuickAddDisabled && "border-white/10 bg-black/70 text-white/75",
							)}
						>
							<span
								className={cn(
									"flex h-11 w-11 shrink-0 items-center justify-center transition-[color,transform] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]",
									!resolvedQuickAddDisabled &&
										"group-hover/quickadd:rotate-90 group-hover/quickadd:scale-[0.92] group-hover/quickadd:!text-black group-focus-visible/quickadd:rotate-90 group-focus-visible/quickadd:scale-[0.92] group-focus-visible/quickadd:!text-black",
									isAdding && "!text-black",
								)}
							>
								{isAdding ? (
									<Loader2 className="h-5 w-5 animate-spin" />
								) : (
									<Plus className="h-5 w-5 shrink-0 stroke-[2.5]" />
								)}
							</span>
							<span
								className={cn(
									"max-w-0 -translate-x-2 overflow-hidden whitespace-nowrap pr-0 text-sm font-medium opacity-0 transition-[max-width,opacity,transform,padding] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]",
									!resolvedQuickAddDisabled &&
										"group-hover/quickadd:max-w-28 group-hover/quickadd:translate-x-0 group-hover/quickadd:pr-5 group-hover/quickadd:!text-black group-hover/quickadd:opacity-100 group-focus-visible/quickadd:max-w-28 group-focus-visible/quickadd:translate-x-0 group-focus-visible/quickadd:pr-5 group-focus-visible/quickadd:!text-black group-focus-visible/quickadd:opacity-100",
									isAdding && "max-w-28 translate-x-0 pr-5 !text-black opacity-100",
									resolvedQuickAddDisabled && "hidden",
								)}
							>
								Add to cart
							</span>
						</Button>
					</div>
				) : null}
			</div>

			<div className="flex flex-1 flex-col justify-between gap-2 px-1 pb-1.5 pt-2">
				<div className="space-y-1">
					<YnsLink href={href} className="block">
						<h2 className="line-clamp-2 min-h-[3.25rem] text-lg leading-tight font-medium tracking-tight text-card-foreground transition-colors group-hover:text-red-600 group-focus-within:text-red-600">
							{name}
						</h2>
					</YnsLink>
					<div className="min-h-[3.75rem] space-y-0.5 text-card-foreground">
						<p className="grunge-price text-base">{resolvedPriceLabel}</p>
						{resolvedCompareAtLabel ? (
							<p className="text-sm text-muted-foreground line-through">{resolvedCompareAtLabel}</p>
						) : null}
						{resolvedPromotionLabel ? (
							<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
								{resolvedPromotionLabel}
							</p>
						) : null}
					</div>
				</div>

				<div className="min-h-6">
					{variantOptions.length > 1 ? (
						<ul className="flex flex-wrap gap-2 text-xs text-muted-foreground">
							{variantOptions.map((variant) => (
								<li key={variant.id}>
									<button
										type="button"
										onClick={(event) => handleVariantSelect(event, variant.id)}
										aria-pressed={selectedVariantId === variant.id}
										className={cn(
											"inline-flex items-center justify-center rounded-full border px-2.5 py-1 transition-[color,background-color,border-color,transform,box-shadow,opacity,padding] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform",
											selectedVariantId === variant.id
												? "scale-[1.04] border-red-500 bg-red-500 px-3.5 py-1.5 text-neutral-950 shadow-[0_14px_30px_-18px_rgba(220,38,38,0.9)]"
												: "border-border bg-background/70 hover:-translate-y-px hover:border-red-500/70 hover:bg-background/90 hover:text-foreground",
											!variant.inStock && "opacity-45 line-through",
										)}
									>
										{variant.label}
									</button>
								</li>
							))}
						</ul>
					) : null}
				</div>
			</div>
		</article>
	);
}
