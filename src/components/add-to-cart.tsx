"use client";

import { Plus } from "lucide-react";
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
}

export function AddToCart({
	variantId,
	quantity = 1,
	className = "",
	children,
	onSuccess,
	productInfo,
}: AddToCartProps) {
	const { openCart, optimisticAdd } = useCart();
	const t = useTranslations("Global.addToCart");

	const handleAddToCart = async () => {
		try {
			await optimisticAdd(variantId, quantity, productInfo);
			onSuccess?.();
			openCart(); // Open cart sidebar after adding item
		} catch (error) {
			// Error is already logged in context, could show error toast here
		}
	};

	return (
		<Button onClick={handleAddToCart} className={className}>
			<Plus className="h-4 w-4" />
			{children || t("actionButton")}
		</Button>
	);
}
