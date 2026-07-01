"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { useTranslations } from "@/i18n/client";
import type { ProductInfo } from "@/lib/commerce-types";
import { Button } from "@/ui/shadcn/button";

interface AddToCartProps {
	variantId: string;
	quantity?: number;
	className?: string;
	children?: React.ReactNode;
	onSuccess?: () => void;
	productInfo?: ProductInfo;
	redirectTo?: string;
}

export function AddToCart({
	variantId,
	quantity = 1,
	className = "",
	children,
	onSuccess,
	productInfo,
	redirectTo,
}: AddToCartProps) {
	const { openCart, optimisticAdd } = useCart();
	const router = useRouter();
	const t = useTranslations("Global.addToCart");

	const handleAddToCart = async () => {
		try {
			await optimisticAdd(variantId, quantity, productInfo);
			onSuccess?.();
			if (redirectTo) {
				router.push(redirectTo);
				return;
			}
			openCart();
		} catch {
			// Error is already logged in context.
		}
	};

	return (
		<Button type="button" onClick={handleAddToCart} className={className}>
			<Plus className="h-4 w-4" />
			{children || t("actionButton")}
		</Button>
	);
}
