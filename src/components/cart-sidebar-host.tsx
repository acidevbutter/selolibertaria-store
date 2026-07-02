"use client";

import { CartSidebar } from "@/components/cart-sidebar";
import { useCart } from "@/context/cart-context";

export function CartSidebarHost() {
	const { isCartOpen, closeCart } = useCart();

	return <CartSidebar isOpen={isCartOpen} onClose={closeCart} />;
}
