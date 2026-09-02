"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type MouseEvent, useState } from "react";
import { useCart } from "@/context/cart-context";
import { getProductImageOptimizationProps } from "@/lib/product-image-utils";
import type { SlProductRow } from "@/lib/sl-catalog";
import { cn } from "@/lib/utils";
import { YnsLink } from "@/ui/yns-link";

const badgeToneClass: Record<SlProductRow["badgeTone"], string> = {
	buy: "sl-badge-buy",
	ink: "sl-badge-ink",
	paper: "sl-badge-paper",
};

export function SlProductCard({ row, priority = false }: { row: SlProductRow; priority?: boolean }) {
	const { openCart, optimisticAdd } = useCart();
	const router = useRouter();
	const [pending, setPending] = useState(false);

	// Quick-add is only offered for ordinary purchasable items; tickets, labs and
	// sold-out rows send the reader to the product page instead.
	const quickAdd = row.canPurchase && Boolean(row.variantId) && row.actionLabel === "Adicionar";

	const handleAction = async (event: MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		if (!quickAdd || !row.variantId) {
			router.push(row.href);
			return;
		}
		setPending(true);
		try {
			await optimisticAdd(row.variantId, 1, row.productInfo);
			openCart();
		} catch {
			router.push(row.href);
		} finally {
			setPending(false);
		}
	};

	return (
		<article className="sl-card group h-full">
			<YnsLink href={row.href} className="sl-shot block" aria-label={row.name}>
				{row.imageUrl ? (
					<Image
						src={row.imageUrl}
						alt={row.imageAlt}
						fill
						sizes="(max-width: 640px) 50vw, (max-width: 1152px) 33vw, 320px"
						priority={priority}
						className="object-cover transition-[filter] duration-150 group-hover:brightness-[0.97]"
						{...getProductImageOptimizationProps(row.imageUrl)}
					/>
				) : null}
				{row.badge ? (
					<span className={cn("sl-badge", badgeToneClass[row.badgeTone])}>{row.badge}</span>
				) : null}
			</YnsLink>

			<div className="sl-body">
				<span className="text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--sl-text-quiet)]">
					{row.category}
				</span>
				<YnsLink href={row.href} className="block">
					<h3
						className="sl-price m-0 text-[color:var(--sl-text)] transition-colors group-hover:text-[color:var(--sl-accent)]"
						style={{ fontSize: "var(--sl-size-card-title)", letterSpacing: "var(--sl-track-card)" }}
					>
						{row.name}
					</h3>
				</YnsLink>
				<p className="m-0 flex-1 text-[13px] leading-[1.65] text-[color:var(--sl-text-muted)] line-clamp-3">
					{row.blurb}
				</p>

				<div className="flex items-baseline justify-between gap-3">
					<span
						className="sl-price text-[22px]"
						style={{ color: row.soldOut ? "var(--sl-text-soft)" : "var(--sl-text)" }}
					>
						{row.priceLabel}
						{row.compareAtLabel ? (
							<span className="ml-2 text-[13px] text-[color:var(--sl-text-soft)] line-through">
								{row.compareAtLabel}
							</span>
						) : null}
					</span>
					<span
						className="text-[11px] uppercase tracking-[0.14em]"
						style={{ color: row.soldOut ? "var(--sl-text-soft)" : "var(--sl-accent)" }}
					>
						{row.note}
					</span>
				</div>

				<button
					type="button"
					onClick={handleAction}
					disabled={pending}
					className={cn("sl-btn w-full", row.soldOut ? "sl-btn-secondary" : "sl-btn-primary")}
				>
					{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : row.actionLabel}
				</button>
			</div>
		</article>
	);
}
