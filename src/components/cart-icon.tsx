"use client";

import { useCart } from "@/context/cart-context";
import { cn } from "@/lib/utils";

type CartIconProps = {
	className?: string;
};

/**
 * The wine cart button — the header's only block of colour, icon-only (no visible
 * "Carrinho" label on any breakpoint, per the kit). Counter chip is on paper, overlapping
 * the top-right corner.
 */
export function CartIcon({ className = "" }: CartIconProps) {
	const { openCart, itemCount } = useCart();

	return (
		<button
			type="button"
			onClick={openCart}
			aria-label="Carrinho"
			data-cart-trigger="header"
			className={cn("relative inline-flex h-11 w-11 items-center justify-center", className)}
			style={{ background: "var(--sl-wine)", color: "var(--sl-text-on-ink)" }}
		>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
				<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
				<path d="M3 6h18" />
			</svg>
			{itemCount > 0 ? (
				<span
					className="absolute -top-1.5 -right-1.5 inline-flex h-5 min-w-5 items-center justify-center px-1 text-[11px] font-normal tracking-normal"
					style={{ background: "var(--sl-paper)", color: "var(--sl-wine)" }}
				>
					{itemCount > 99 ? "99+" : itemCount}
				</span>
			) : null}
		</button>
	);
}
