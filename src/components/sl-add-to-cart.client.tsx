"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { useCart } from "@/context/cart-context";
import type { ProductInfo } from "@/lib/commerce-types";
import { cn } from "@/lib/utils";

/**
 * SL-styled add-to-cart. `redirectTo` sends the buyer straight on (buy now);
 * otherwise the cart drawer opens. Reuses the shared cart context — no new logic.
 */
export function SlAddToCart({
	variantId,
	quantity = 1,
	productInfo,
	redirectTo,
	variant = "primary",
	onInk = false,
	disabled = false,
	className,
	children,
}: {
	variantId: string;
	quantity?: number;
	productInfo?: ProductInfo;
	redirectTo?: string;
	variant?: "buy" | "primary" | "secondary";
	onInk?: boolean;
	disabled?: boolean;
	className?: string;
	children: ReactNode;
}) {
	const { openCart, optimisticAdd } = useCart();
	const router = useRouter();
	const [pending, setPending] = useState(false);

	const handleClick = async () => {
		if (disabled || pending) return;
		setPending(true);
		try {
			await optimisticAdd(variantId, quantity, productInfo);
			if (redirectTo) {
				router.push(redirectTo);
				return;
			}
			openCart();
		} catch {
			// Already logged by the cart context.
		} finally {
			setPending(false);
		}
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={disabled || pending}
			className={cn(
				"sl-btn",
				`sl-btn-${variant}`,
				onInk && variant === "secondary" && "sl-btn-ink",
				className,
			)}
		>
			{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
		</button>
	);
}
