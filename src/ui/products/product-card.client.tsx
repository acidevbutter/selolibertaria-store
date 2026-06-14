"use client";

import { Loader2, Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { useTranslations } from "@/i18n/client";
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
	const productT = useTranslations("/product.page");
	const seloT = useTranslations("Selo");
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
		<article className="group relative flex h-full flex-col overflow-hidden border border-[color:var(--editorial-border)] bg-[color:var(--editorial-surface)] p-2 shadow-[0_22px_80px_-58px_rgba(11,11,11,0.45)] transition duration-300 hover:-translate-y-1 hover:border-[color:rgba(122,30,34,0.34)] hover:shadow-[0_34px_100px_-60px_rgba(11,11,11,0.62)] focus-within:-translate-y-1 focus-within:border-[color:rgba(122,30,34,0.34)] focus-within:shadow-[0_34px_100px_-60px_rgba(11,11,11,0.62)]">
			<div className="absolute right-5 top-5 z-20">
				<FavoriteToggle
					productSlug={productSlug}
					variantId={variantId ?? null}
					initialActive={favoriteActive}
					className="border-white/70 bg-background/90 shadow-md backdrop-blur-sm hover:border-red-500"
				/>
			</div>

			<div className="relative overflow-hidden bg-[color:rgba(216,208,196,0.28)]">
				<YnsLink href={href} className="block">
					{imageUrl ? (
						<>
							<div className="absolute inset-0 z-10 bg-linear-to-t from-black/60 via-black/10 to-transparent opacity-0 transition duration-300 group-hover:opacity-100 group-focus-within:opacity-100" />
							<div className="aspect-[0.9] w-full overflow-hidden bg-[color:rgba(247,244,239,0.72)]">
								<Image
									className="h-full w-full object-contain object-center p-4 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-82 group-focus-within:scale-[1.03] group-focus-within:opacity-82 sm:p-6"
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
							{productT("imagesTitle")}
						</div>
					)}
				</YnsLink>

				{canPurchase ? (
					<div className="absolute inset-x-3 bottom-3 z-20 flex justify-end">
						<Button
							type="button"
							onClick={handleQuickAdd}
							disabled={resolvedQuickAddDisabled || !resolvedVariantId || isAdding}
							aria-label={resolvedQuickAddDisabled ? productT("outOfStock") : productT("addToCart")}
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
								{productT("addToCart")}
							</span>
						</Button>
					</div>
				) : null}
			</div>

			<div className="flex flex-1 flex-col justify-between gap-3 px-2 pb-2 pt-4">
				<div className="space-y-1">
					<YnsLink href={href} className="block">
						<h2 className="editorial-serif line-clamp-2 min-h-[3.8rem] text-[1.6rem] leading-[0.98] font-semibold tracking-[-0.04em] text-[color:var(--editorial-ink)] transition-colors group-hover:text-[color:var(--editorial-accent)] group-focus-within:text-[color:var(--editorial-accent)]">
							{name}
						</h2>
					</YnsLink>
					<p className="line-clamp-2 min-h-[3rem] text-sm leading-6 text-[color:var(--editorial-muted)]">
						{productInfo.summary ??
							"Uma edição do catálogo do Selo Libertária pensada para leitura, presença e continuidade cultural."}
					</p>
					<div className="min-h-[3.75rem] space-y-0.5 text-card-foreground">
						<p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--editorial-muted)]">
							{seloT("product.selectedEdition")}
						</p>
						<p className="price-font text-base text-[color:var(--editorial-ink)]">{resolvedPriceLabel}</p>
						{resolvedCompareAtLabel ? (
							<p className="text-sm text-muted-foreground line-through">{resolvedCompareAtLabel}</p>
						) : null}
						{resolvedPromotionLabel ? (
							<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
								{resolvedPromotionLabel}
							</p>
						) : null}
					</div>
				</div>

				<div className="min-h-6">
					{variantOptions.length > 1 ? (
						<ul className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
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
