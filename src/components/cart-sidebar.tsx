"use client";

import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { applyCartCouponAction, removeCartCouponAction } from "@/actions/cart-actions";
import { useCart } from "@/context/cart-context";
import { useLocale, useTranslations } from "@/i18n/client";
import { getProductImageOptimizationProps } from "@/lib/product-image-utils";
import { formatMoney } from "@/lib/utils";
import { Input } from "@/ui/shadcn/input";

interface CartSidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
	const { cart, itemCount, optimisticUpdate, optimisticRemove, replaceCart } = useCart();
	const router = useRouter();
	const locale = useLocale();
	const t = useTranslations("CartSidebar");

	async function handleUpdateQuantity(variantId: string, quantity: number) {
		try {
			await optimisticUpdate(variantId, quantity);
		} catch (error) {
			// Error is already logged in context, could show toast here
		}
	}

	async function handleRemoveItem(variantId: string) {
		try {
			await optimisticRemove(variantId);
		} catch (error) {
			// Error is already logged in context, could show toast here
		}
	}

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [couponCode, setCouponCode] = useState(cart?.couponCode ?? "");

	useEffect(() => {
		setCouponCode(cart?.couponCode ?? "");
	}, [cart?.couponCode]);

	async function handleApplyCoupon() {
		setError(null);
		const result = await applyCartCouponAction(couponCode);
		if (result.error) {
			setError(result.error);
			return;
		}
		replaceCart(result.cart);
	}

	async function handleRemoveCoupon() {
		setError(null);
		const nextCart = await removeCartCouponAction();
		setCouponCode("");
		replaceCart(nextCart);
	}

	if (!isOpen) return null;

	return (
		<>
			{/* Overlay with blur */}
			<div
				className="fixed inset-0 z-40 h-screen w-screen backdrop-blur-sm bg-black/30 transition-opacity"
				onClick={onClose}
			/>

			{/* Sidebar */}
			<div className="fixed right-0 top-0 z-50 h-screen w-96 max-w-full bg-white dark:bg-neutral-900 shadow-xl transition-transform">
				<div className="flex h-full flex-col">
					{/* Header */}
					<div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-800 p-4">
						<div className="flex items-center gap-2">
							<ShoppingBag className="h-5 w-5 hover:text-red-600 dark:hover:text-red-400" />
							<h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
								{t("title", { count: itemCount })}
							</h2>
						</div>
						<button
							onClick={onClose}
							className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-red-600 dark:hover:text-red-400"
							aria-label={t("actions.close")}
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					{/* Content */}
					<div className="flex-1 overflow-y-auto">
						{!cart || !cart.items || cart.items.length === 0 ? (
							<div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
								<ShoppingBag className="h-12 w-12 text-gray-300 dark:text-neutral-600 hover:text-red-600 dark:hover:text-red-400" />
								<div>
									<h3 className="font-medium text-gray-900 dark:text-neutral-100">{t("empty.title")}</h3>
									<p className="text-sm text-gray-500 dark:text-neutral-400 grunge-font">
										{t("empty.description")}
									</p>
								</div>
							</div>
						) : (
							<div className="p-4 space-y-4">
								{cart.items.map((item) => {
									// Product info is now directly available in item.product
									const product = item.product;
									const price = item.price; // Already in dollars

									return (
										<div
											key={item.id}
											className="flex items-start gap-3 border-b border-gray-100 dark:border-neutral-800 pb-4"
										>
											{/* Product Image */}
											<div className="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
												{product?.images?.[0] ? (
													<Image
														src={product.images[0]}
														alt={product.name || t("fallback.product")}
														width={64}
														height={64}
														className="w-full h-full object-cover"
														{...getProductImageOptimizationProps(product.images[0])}
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center">
														<ShoppingBag className="h-6 w-6 text-gray-300 hover:text-red-600 dark:hover:text-red-400" />
													</div>
												)}
											</div>

											{/* Product Info */}
											<div className="flex-1 min-w-0">
												<h3 className="font-medium text-sm text-gray-900 dark:text-neutral-100 truncate hover:text-red-600 dark:hover:text-red-400">
													{product?.name || `Product ${item.productId}`}
												</h3>
												<div className="mt-1 space-y-1">
													<p className="text-sm text-gray-600 dark:text-neutral-400 grunge-price">
														{formatMoney({
															amount: price,
															currency: cart.currency || "USD",
															locale,
														})}
													</p>
													{typeof item.basePrice === "number" && item.basePrice > price ? (
														<p className="text-xs text-muted-foreground line-through">
															{formatMoney({
																amount: item.basePrice,
																currency: cart.currency || "USD",
																locale,
															})}
														</p>
													) : null}
												</div>
											</div>

											{/* Quantity Controls */}
											<div className="flex flex-col items-end gap-2">
												<button
													onClick={() => handleRemoveItem(item.variantId || item.productId)}
													className="text-red-500 hover:text-red-700 p-1"
													aria-label={t("actions.removeItem")}
												>
													<X className="h-4 w-4" />
												</button>
												<div className="flex items-center gap-1 bg-gray-50 dark:bg-neutral-800 rounded-full px-2 py-1">
													<button
														onClick={() =>
															handleUpdateQuantity(item.variantId || item.productId, item.quantity - 1)
														}
														className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-neutral-700"
														disabled={item.quantity <= 1}
													>
														<Minus className="h-3 w-3" />
													</button>
													<span className="min-w-[1.5rem] text-center text-sm font-medium">
														{item.quantity}
													</span>
													<button
														onClick={() =>
															handleUpdateQuantity(item.variantId || item.productId, item.quantity + 1)
														}
														className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-neutral-700"
													>
														<Plus className="h-3 w-3" />
													</button>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Footer with Total */}
					{cart && cart.items.length > 0 && (
						<div className="border-t border-gray-100 dark:border-neutral-800 p-4 space-y-4">
							<div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-neutral-800 dark:bg-neutral-950/40">
								<p className="text-sm font-medium">{t("coupon.title")}</p>
								<div className="flex gap-2">
									<Input
										value={couponCode}
										onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
										placeholder={t("coupon.placeholder")}
									/>
									<button
										type="button"
										onClick={handleApplyCoupon}
										className="rounded-lg border px-3 py-2 text-sm font-medium"
									>
										{t("coupon.apply")}
									</button>
								</div>
								{cart.couponCode ? (
									<div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
										<span>{t("coupon.active", { code: cart.couponCode })}</span>
										<button type="button" onClick={handleRemoveCoupon} className="font-medium text-red-600">
											{t("coupon.remove")}
										</button>
									</div>
								) : null}
								{cart.couponError ? <p className="text-xs text-red-600">{cart.couponError}</p> : null}
							</div>
							{typeof cart.subtotal === "number" ? (
								<div className="space-y-2 text-sm text-gray-700 dark:text-neutral-300">
									<div className="flex items-center justify-between">
										<span>{t("summary.subtotal")}</span>
										<span>
											{formatMoney({
												amount: cart.subtotal,
												currency: cart.currency || "USD",
												locale,
											})}
										</span>
									</div>
									{cart.shippingRate ? (
										<div className="flex items-center justify-between">
											<span>
												{cart.shippingRate.providerLabel}
												{cart.shippingRate.serviceName ? ` · ${cart.shippingRate.serviceName}` : ""}
											</span>
											<span>
												{formatMoney({
													amount: cart.shippingRate.fixed_amount.amount,
													currency: cart.currency || "USD",
													locale,
												})}
											</span>
										</div>
									) : cart.shippingError ? (
										<div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
											{cart.shippingError}
										</div>
									) : null}
									{(cart.discountTotal ?? 0) > 0 ? (
										<div className="flex items-center justify-between text-red-600 dark:text-red-400">
											<span>{t("summary.discounts")}</span>
											<span>
												-
												{formatMoney({
													amount: cart.discountTotal ?? 0,
													currency: cart.currency || "USD",
													locale,
												})}
											</span>
										</div>
									) : null}
								</div>
							) : null}
							<div className="flex items-center justify-between text-lg font-semibold text-gray-900 dark:text-neutral-100">
								<span>{t("summary.total")}</span>
								<span className="grunge-price">
									{formatMoney({
										amount: cart.total || 0,
										currency: cart.currency || "USD",
										locale,
									})}
								</span>
							</div>
							{error && (
								<p className="text-sm text-red-600" role="alert">
									{error}
								</p>
							)}
							<button
								onClick={() => {
									if (loading) return;
									setError(null);
									setLoading(true);
									router.push("/checkout");
								}}
								disabled={loading || !cart || cart.items.length === 0}
								className="w-full rounded-lg bg-black px-6 py-3 text-white hover:bg-gray-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed"
							>
								{loading ? t("actions.openingCheckout") : t("actions.checkout")}
							</button>
						</div>
					)}
				</div>
			</div>
		</>
	);
}
