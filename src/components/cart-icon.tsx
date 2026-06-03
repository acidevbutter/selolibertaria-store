"use client";

import { ShoppingBag } from "lucide-react";
import { CartSidebar } from "@/components/cart-sidebar";
import { useCart } from "@/context/cart-context";

export function CartIcon() {
	const { isCartOpen, openCart, closeCart, itemCount } = useCart();

	return (
		<>
			<button
				onClick={openCart}
				className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-900 dark:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
				aria-label={`Open cart (${itemCount} items)`}
			>
				<ShoppingBag className="h-5 w-5" />
				{itemCount > 0 && (
					<span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
						{itemCount > 99 ? "99+" : itemCount}
					</span>
				)}
			</button>

			<CartSidebar isOpen={isCartOpen} onClose={closeCart} />
		</>
	);
}
