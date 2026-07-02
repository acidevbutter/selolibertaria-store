"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/context/cart-context";
import type { Cart } from "@/lib/commerce-types";

type MergeResponse = {
	merged?: boolean;
	cart?: Cart | null;
	reason?: string;
};

export function CartMergeOnAuth() {
	const { replaceCart, refreshCart } = useCart();
	const attemptedRef = useRef(false);

	useEffect(() => {
		if (attemptedRef.current) {
			return;
		}

		attemptedRef.current = true;

		void (async () => {
			try {
				const response = await fetch("/api/cart/merge", {
					method: "POST",
					cache: "no-store",
				});

				if (!response.ok) {
					if (response.status !== 401) {
						await refreshCart();
					}
					return;
				}

				const payload = (await response.json()) as MergeResponse;
				if (payload.cart) {
					replaceCart(payload.cart);
					return;
				}

				if (payload.merged) {
					await refreshCart();
				}
			} catch (error) {
				console.warn("Cart merge call failed", error);
			}
		})();
	}, [refreshCart, replaceCart]);

	return null;
}
