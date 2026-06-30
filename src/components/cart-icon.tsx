"use client";

import { ShoppingBag } from "lucide-react";
import { CartSidebar } from "@/components/cart-sidebar";
import { useCart } from "@/context/cart-context";
import { cn } from "@/lib/utils";

export function CartIcon({ showLabel = false, className = "" }: { showLabel?: boolean; className?: string }) {
	const { isCartOpen, openCart, closeCart, itemCount } = useCart();

	return (
		<>
			<button
				onClick={openCart}
				className={cn(
					"relative inline-flex h-10 items-center justify-center gap-2 border border-[color:var(--editorial-ink)] px-3 text-[color:var(--editorial-ink)] transition-colors hover:bg-[color:rgba(216,208,196,0.24)]",
					showLabel ? "min-w-[8rem]" : "w-10 px-0",
					className,
				)}
				aria-label={`Open cart (${itemCount} items)`}
			>
				<ShoppingBag className="h-5 w-5" />
				{showLabel ? (
					<span className="text-[10px] font-black uppercase tracking-[0.22em]">Carrinho</span>
				) : null}
				{itemCount > 0 && (
					<span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--editorial-ink)] px-1 text-[10px] font-black text-[color:var(--editorial-paper)]">
						{itemCount > 99 ? "99+" : itemCount}
					</span>
				)}
			</button>

			<CartSidebar isOpen={isCartOpen} onClose={closeCart} />
		</>
	);
}
