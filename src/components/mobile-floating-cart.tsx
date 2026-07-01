"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/cart-context";

export function MobileFloatingCart() {
	const { itemCount, openCart } = useCart();

	if (itemCount <= 0) {
		return null;
	}

	return (
		<button
			type="button"
			onClick={openCart}
			aria-label="Carrinho"
			data-cart-trigger="floating"
			className="fixed right-4 bottom-5 z-40 inline-flex h-12 w-12 items-center justify-center border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-paper)] text-[color:var(--editorial-ink)] shadow-[0_10px_30px_rgba(11,11,11,0.12)] transition-colors hover:bg-[color:rgba(216,208,196,0.24)] lg:hidden"
		>
			<ShoppingBag className="h-5 w-5" />
			<span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--editorial-accent)] px-1 text-[10px] font-black text-[color:var(--editorial-paper)]">
				{itemCount > 99 ? "99+" : itemCount}
			</span>
		</button>
	);
}
