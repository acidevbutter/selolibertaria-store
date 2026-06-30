"use client";

import { ShoppingBag } from "lucide-react";
import { CartSidebar } from "@/components/cart-sidebar";
import { useCart } from "@/context/cart-context";
import { cn } from "@/lib/utils";

type CartIconProps = {
	className?: string;
};

export function CartIcon({ className = "" }: CartIconProps) {
	const { isCartOpen, openCart, closeCart, itemCount } = useCart();

	return (
		<>
			<button
				type="button"
				onClick={openCart}
				aria-label="Carrinho"
				data-cart-trigger="header"
				className={cn(
					"relative inline-flex h-10 w-10 items-center justify-center border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-paper)] text-[color:var(--editorial-ink)] transition-colors hover:bg-[color:rgba(216,208,196,0.24)]",
					className,
				)}
			>
				<ShoppingBag className="h-5 w-5" />
				{itemCount > 0 ? (
					<span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--editorial-ink)] px-1 text-[10px] font-black text-[color:var(--editorial-paper)]">
						{itemCount > 99 ? "99+" : itemCount}
					</span>
				) : null}
			</button>

			<CartSidebar isOpen={isCartOpen} onClose={closeCart} />
		</>
	);
}
