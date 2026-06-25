"use client";

import { Loader2 } from "lucide-react";
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
		<article className="group relative flex h-full flex-col overflow-hidden border border-[color:var(--editorial-border)] bg-[color:var(--editorial-paper)] p-4 shadow-none transition duration-300 hover:-translate-y-1 hover:border-[color:rgba(122,30,34,0.38)] focus-within:-translate-y-1 focus-within:border-[color:rgba(122,30,34,0.38)] sm:p-6">
			<div className="absolute right-5 top-5 z-20">
				<FavoriteToggle
					productSlug={productSlug}
					variantId={variantId ?? null}
					initialActive={favoriteActive}
					className="border-white/70 bg-background/90 shadow-md backdrop-blur-sm hover:border-red-500"
				/>
			</div>

			<div className="relative overflow-hidden border border-[color:var(--editorial-border)] bg-[color:rgba(216,208,196,0.18)]">
				<YnsLink href={href} className="block">
					{imageUrl ? (
						<>
							<div className="aspect-[0.84] w-full overflow-hidden bg-[color:rgba(247,244,239,0.72)]">
								<Image
									className="h-full w-full object-contain object-center p-5 transition duration-500 group-hover:scale-[1.02] group-focus-within:scale-[1.02] sm:p-7"
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
			</div>

			<div className="flex flex-1 flex-col justify-between gap-4 pt-5">
				<div className="space-y-3">
					<YnsLink href={href} className="block">
						<h2 className="line-clamp-3 min-h-[4.9rem] text-[2rem] leading-[0.94] font-black tracking-[-0.05em] text-[color:var(--editorial-ink)] transition-colors group-hover:text-[color:var(--editorial-accent)] group-focus-within:text-[color:var(--editorial-accent)]">
							{name}
						</h2>
					</YnsLink>
					<p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--editorial-accent)]">
						{seloT("product.selectedEdition")}
					</p>
					<p className="line-clamp-3 min-h-[4.5rem] text-sm leading-7 text-[color:var(--editorial-muted)]">
						{productInfo.summary ??
							"Uma edição do catálogo do Selo Libertária pensada para leitura, presença e continuidade cultural."}
					</p>
					<div className="min-h-[3.75rem] space-y-0.5 text-card-foreground">
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
											"inline-flex items-center justify-center border px-2.5 py-1 transition-[color,background-color,border-color,transform,box-shadow,opacity,padding] duration-300",
											selectedVariantId === variant.id
												? "border-[color:var(--editorial-accent)] bg-[color:var(--editorial-accent)] px-3.5 py-1.5 text-[color:var(--editorial-paper)]"
												: "border-border bg-background/70 hover:-translate-y-px hover:border-[color:var(--editorial-accent)]/70 hover:bg-background/90 hover:text-foreground",
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

				<div className="mt-2 grid gap-3 sm:grid-cols-2">
					{canPurchase ? (
						<Button
							type="button"
							onClick={handleQuickAdd}
							disabled={resolvedQuickAddDisabled || !resolvedVariantId || isAdding}
							aria-label={resolvedQuickAddDisabled ? productT("outOfStock") : productT("addToCart")}
							className="min-h-11 rounded-none bg-[color:var(--editorial-ink)] px-4 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-paper)] hover:bg-[color:var(--editorial-accent)] disabled:bg-[color:var(--editorial-border)] disabled:text-[color:var(--editorial-muted)]"
						>
							{isAdding ? (
								<span className="inline-flex items-center gap-2">
									<Loader2 className="h-4 w-4 animate-spin" />
									{productT("addToCart")}
								</span>
							) : resolvedQuickAddDisabled ? (
								productT("outOfStock")
							) : (
								productT("buyNow")
							)}
						</Button>
					) : null}
					<YnsLink
						href={href}
						className="inline-flex min-h-11 items-center justify-center border border-[color:var(--editorial-border)] px-4 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-ink)] transition-colors duration-300 hover:border-[color:var(--editorial-accent)] hover:bg-[color:rgba(216,208,196,0.24)]"
					>
						{productT("viewBook")}
					</YnsLink>
				</div>
			</div>
		</article>
	);
}
