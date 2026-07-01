"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
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
	const router = useRouter();
	const productT = useTranslations("/product.page");
	const seloT = useTranslations("Selo");

	const [pendingAction, setPendingAction] = useState<"add" | "buy" | null>(null);
	const [selectedVariantId, setSelectedVariantId] = useState<string | null>(variantId ?? null);

	const selectedVariant = variantOptions.find((variant) => variant.id === selectedVariantId) ?? null;
	const resolvedVariantId = selectedVariant?.id ?? variantId ?? null;
	const resolvedQuickAddDisabled = selectedVariant ? !selectedVariant.inStock : quickAddDisabled;
	const resolvedPriceLabel = selectedVariant?.priceLabel ?? priceLabel;
	const resolvedCompareAtLabel = selectedVariant?.compareAtLabel ?? compareAtLabel;
	const resolvedPromotionLabel = selectedVariant?.promotionLabel ?? promotionLabel;
	const isAdding = pendingAction === "add";
	const isBuying = pendingAction === "buy";

	async function addSelectedVariant() {
		if (!resolvedVariantId || resolvedQuickAddDisabled || pendingAction) {
			return false;
		}

		try {
			await optimisticAdd(resolvedVariantId, 1, productInfo);
			return true;
		} catch {
			return false;
		}
	}

	const handleQuickAdd = async (event: MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();

		setPendingAction("add");
		try {
			const added = await addSelectedVariant();
			if (added) {
				openCart();
			}
		} finally {
			setPendingAction(null);
		}
	};

	const handleBuyNow = async (event: MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();

		if (resolvedQuickAddDisabled) {
			return;
		}

		if (!resolvedVariantId) {
			router.push(href);
			return;
		}

		setPendingAction("buy");
		try {
			const added = await addSelectedVariant();
			if (added) {
				router.push("/checkout");
			}
		} finally {
			setPendingAction(null);
		}
	};

	const handleVariantSelect = (event: MouseEvent<HTMLButtonElement>, nextVariantId: string) => {
		event.preventDefault();
		event.stopPropagation();
		setSelectedVariantId(nextVariantId);
	};

	return (
		<article className="group relative flex h-full flex-col border border-[color:rgba(11,11,11,0.22)] bg-[color:var(--editorial-paper)] p-5 transition duration-300 hover:-translate-y-1 hover:border-[color:rgba(122,30,34,0.42)] focus-within:-translate-y-1 focus-within:border-[color:rgba(122,30,34,0.42)] sm:p-6">
			<div className="absolute right-4 top-4 z-10">
				<FavoriteToggle
					productSlug={productSlug}
					variantId={resolvedVariantId}
					initialActive={favoriteActive}
					className="border-[color:rgba(11,11,11,0.14)] bg-[color:rgba(247,244,239,0.94)] shadow-none backdrop-blur-sm hover:border-[color:var(--editorial-accent)]"
				/>
			</div>

			<YnsLink href={href} className="block">
				<div className="mx-auto w-full max-w-[16rem] overflow-hidden bg-[color:rgba(216,208,196,0.45)] p-4 sm:p-5">
					<div className="relative aspect-[0.72] w-full overflow-hidden bg-[color:rgba(247,244,239,0.82)]">
						{imageUrl ? (
							<Image
								src={imageUrl}
								alt={imageAlt}
								fill
								loading={loading}
								priority={priority}
								className="object-contain p-3 transition duration-500 group-hover:scale-[1.02] group-focus-within:scale-[1.02]"
								sizes="(max-width: 768px) 72vw, (max-width: 1280px) 320px, 280px"
								{...getProductImageOptimizationProps(imageUrl)}
							/>
						) : (
							<div className="flex h-full items-center justify-center px-4 text-center text-sm text-[color:var(--editorial-muted)]">
								{productT("imagesTitle")}
							</div>
						)}
					</div>
				</div>
			</YnsLink>

			<div className="mt-6 flex flex-1 flex-col justify-between gap-5">
				<div className="space-y-4">
					<div className="space-y-2">
						<p className="text-[10px] uppercase tracking-[0.26em] text-[color:var(--editorial-accent)]">
							{resolvedQuickAddDisabled ? "Em breve" : "Disponível"}
						</p>
						<YnsLink href={href} className="block">
							<h2 className="line-clamp-2 text-[clamp(1.85rem,3vw,2.35rem)] leading-[0.95] font-black tracking-[-0.05em] text-[color:var(--editorial-ink)] transition-colors group-hover:text-[color:var(--editorial-accent)] group-focus-within:text-[color:var(--editorial-accent)]">
								{name}
							</h2>
						</YnsLink>
						<p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--editorial-muted)]">
							{seloT("product.selectedEdition")}
						</p>
					</div>

					<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
						<p className="text-2xl font-black tracking-[-0.04em] text-[color:var(--editorial-ink)]">
							{resolvedPriceLabel}
						</p>
						{resolvedCompareAtLabel ? (
							<p className="text-sm text-[color:var(--editorial-muted)] line-through">
								{resolvedCompareAtLabel}
							</p>
						) : null}
						{resolvedPromotionLabel ? (
							<p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--editorial-accent)]">
								{resolvedPromotionLabel}
							</p>
						) : null}
					</div>

					<p className="line-clamp-4 text-sm leading-7 text-[color:var(--editorial-muted)]">
						{productInfo.summary ??
							"Uma edição do catálogo do Selo Libertária pensada para leitura, presença e continuidade cultural."}
					</p>

					{variantOptions.length > 1 ? (
						<div className="space-y-2">
							<p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--editorial-muted)]">
								{productT("variantTitle")}
							</p>
							<ul className="flex flex-wrap gap-2">
								{variantOptions.map((variant) => (
									<li key={variant.id}>
										<button
											type="button"
											onClick={(event) => handleVariantSelect(event, variant.id)}
											aria-pressed={selectedVariantId === variant.id}
											className={cn(
												"inline-flex min-h-9 items-center justify-center border px-3 text-[10px] uppercase tracking-[0.18em] transition-colors",
												selectedVariantId === variant.id
													? "border-[color:var(--editorial-ink)] bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)]"
													: "border-[color:var(--editorial-border)] text-[color:var(--editorial-muted)] hover:border-[color:var(--editorial-accent)] hover:text-[color:var(--editorial-ink)]",
												!variant.inStock ? "opacity-45" : "",
											)}
										>
											{variant.label}
										</button>
									</li>
								))}
							</ul>
						</div>
					) : null}
				</div>

				{canPurchase ? (
					<div className="grid gap-3 sm:grid-cols-2">
						<Button
							type="button"
							onClick={handleQuickAdd}
							disabled={resolvedQuickAddDisabled || !resolvedVariantId || pendingAction !== null}
							aria-label={resolvedQuickAddDisabled ? productT("outOfStock") : productT("addToCart")}
							className="min-h-11 rounded-none border border-[color:var(--editorial-border)] bg-[color:var(--editorial-paper)] px-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-ink)] hover:border-[color:var(--editorial-accent)] hover:bg-[color:rgba(216,208,196,0.24)] disabled:border-[color:var(--editorial-border)] disabled:bg-[color:var(--editorial-paper)] disabled:text-[color:var(--editorial-muted)]"
						>
							{isAdding ? (
								<span className="inline-flex items-center gap-2">
									<Loader2 className="h-4 w-4 animate-spin" />
									{productT("addToCart")}
								</span>
							) : (
								productT("addToCart")
							)}
						</Button>

						<Button
							type="button"
							onClick={handleBuyNow}
							disabled={resolvedQuickAddDisabled || pendingAction !== null}
							aria-label={resolvedQuickAddDisabled ? productT("outOfStock") : productT("buyNow")}
							className="min-h-11 rounded-none bg-[color:var(--editorial-ink)] px-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-paper)] hover:bg-[color:var(--editorial-accent)] disabled:bg-[color:rgba(11,11,11,0.32)]"
						>
							{isBuying ? (
								<span className="inline-flex items-center gap-2">
									<Loader2 className="h-4 w-4 animate-spin" />
									{productT("buyNow")}
								</span>
							) : (
								productT("buyNow")
							)}
						</Button>
					</div>
				) : (
					<YnsLink
						href={href}
						className="inline-flex min-h-11 items-center justify-center border border-[color:var(--editorial-border)] px-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-ink)] transition-colors duration-300 hover:bg-[color:rgba(216,208,196,0.24)]"
					>
						{productT("viewBook")}
					</YnsLink>
				)}
			</div>
		</article>
	);
}
