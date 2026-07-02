"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { cn } from "@/lib/utils";

type CartIconProps = {
	className?: string;
};

export function CartIcon({ className = "" }: CartIconProps) {
	const { openCart, itemCount } = useCart();

	return (
		<button
			type="button"
			onClick={openCart}
			aria-label="Carrinho"
			data-cart-trigger="header"
			className={cn(
				"relative inline-flex h-10 w-10 items-center justify-center border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-paper)] text-[color:var(--editorial-ink)] transition-colors hover:border-[color:var(--editorial-accent)] hover:bg-[color:rgba(216,208,196,0.24)] hover:text-[color:var(--editorial-accent)]",
				className,
			)}
		>
			<ShoppingBag className="h-5 w-5" />
			{itemCount > 0 ? (
				<span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--editorial-accent)] px-1 text-[10px] font-black text-[color:var(--editorial-paper)]">
					{itemCount > 99 ? "99+" : itemCount}
				</span>
			) : null}
		</button>
	);
}
