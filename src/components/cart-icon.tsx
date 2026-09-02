"use client";

import { useCart } from "@/context/cart-context";
import { cn } from "@/lib/utils";

type CartIconProps = {
	className?: string;
	/** Hide the "Carrinho" word — used in the tight mobile header. */
	compact?: boolean;
};

/**
 * The wine cart button — the header's only block of colour. Counter chip is on
 * paper (kit rule).
 */
export function CartIcon({ className = "", compact = false }: CartIconProps) {
	const { openCart, itemCount } = useCart();

	return (
		<button
			type="button"
			onClick={openCart}
			aria-label="Carrinho"
			data-cart-trigger="header"
			className={cn(
				"inline-flex h-11 items-center gap-2 px-3.5 text-[11px] font-black uppercase tracking-[0.22em] transition-colors",
				className,
			)}
			style={{ background: "var(--sl-wine)", color: "var(--sl-text-on-ink)" }}
		>
			{compact ? <span className="sr-only">Carrinho</span> : <span>Carrinho</span>}
			{itemCount > 0 ? (
				<span
					className="inline-flex h-5 min-w-5 items-center justify-center px-1 text-[11px] font-normal tracking-normal"
					style={{ background: "var(--sl-paper)", color: "var(--sl-wine)" }}
				>
					{itemCount > 99 ? "99+" : itemCount}
				</span>
			) : null}
		</button>
	);
}
