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

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [couponCode, setCouponCode] = useState(cart?.couponCode ?? "");

	useEffect(() => {
		setCouponCode(cart?.couponCode ?? "");
	}, [cart?.couponCode]);

	if (!isOpen) {
		return null;
	}

	async function handleUpdateQuantity(variantId: string, quantity: number) {
		try {
			await optimisticUpdate(variantId, quantity);
		} catch {
			// Already logged by cart context.
		}
	}

	async function handleRemoveItem(variantId: string) {
		try {
			await optimisticRemove(variantId);
		} catch {
			// Already logged by cart context.
		}
	}

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
		const result = await removeCartCouponAction();
		replaceCart(result);
	}

	const hasItems = Boolean(cart?.items?.length);
	const cartItems = cart?.items ?? [];
	const cartCurrency = cart?.currency || "USD";
	const subtotal = typeof cart?.subtotal === "number" ? cart.subtotal : cart?.total || 0;
	const total = cart?.total || 0;

	return (
		<>
			<button
				type="button"
				aria-label={t("actions.close")}
				className="fixed inset-0 z-40 bg-[color:rgba(11,11,11,0.16)] backdrop-blur-[2px]"
				onClick={onClose}
			/>

			<aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[26rem] flex-col border-l border-[color:rgba(11,11,11,0.12)] bg-[color:var(--editorial-paper)] text-[color:var(--editorial-ink)] shadow-[-18px_0_48px_rgba(11,11,11,0.14)]">
				<div className="flex items-center justify-between bg-[color:var(--editorial-ink)] px-5 py-4 text-[color:var(--editorial-paper)]">
					<div className="flex items-center gap-3">
						<ShoppingBag className="h-4 w-4" />
						<div>
							<p className="text-[10px] uppercase tracking-[0.24em] text-[color:rgba(247,244,239,0.7)]">
								Carrinho
							</p>
							<h2 className="text-base font-semibold">{t("title", { count: itemCount })}</h2>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label={t("actions.close")}
						className="inline-flex h-9 w-9 items-center justify-center border border-[color:rgba(247,244,239,0.16)] text-[color:var(--editorial-paper)] transition-colors hover:border-[color:rgba(122,30,34,0.6)] hover:text-[color:var(--editorial-paper)]"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto">
					{hasItems ? (
						<div className="space-y-5 px-5 py-5">
							{cartItems.map((item) => {
								const product = item.product;
								const linePrice = (item.finalPrice ?? item.price) * item.quantity;
								const quantityKey = item.variantId || item.productId;

								return (
									<article
										key={item.id}
										className="border-b border-[color:rgba(11,11,11,0.1)] pb-5 last:border-b-0"
									>
										<div className="flex items-start gap-4">
											<div className="relative h-[6.6rem] w-[4.4rem] shrink-0 overflow-hidden border border-[color:rgba(11,11,11,0.12)] bg-[color:rgba(216,208,196,0.34)]">
												{product?.images?.[0] ? (
													<Image
														src={product.images[0]}
														alt={product.name || t("fallback.product")}
														fill
														className="object-cover"
														sizes="72px"
														{...getProductImageOptimizationProps(product.images[0])}
													/>
												) : (
													<div className="flex h-full items-center justify-center text-[color:var(--editorial-muted)]">
														<ShoppingBag className="h-5 w-5" />
													</div>
												)}
											</div>

											<div className="min-w-0 flex-1 space-y-3">
												<div className="space-y-1">
													<h3 className="line-clamp-2 text-base font-semibold leading-tight text-[color:var(--editorial-ink)]">
														{product?.name || t("fallback.product")}
													</h3>
													<p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--editorial-muted)]">
														Edição selecionada
													</p>
													<p className="text-sm font-medium text-[color:var(--editorial-ink)]">
														{formatMoney({
															amount: linePrice,
															currency: cartCurrency,
															locale,
														})}
													</p>
												</div>

												<div className="flex items-center justify-between gap-3">
													<div className="inline-flex items-center border border-[color:rgba(11,11,11,0.14)] bg-[color:rgba(247,244,239,0.82)]">
														<button
															type="button"
															onClick={() => handleUpdateQuantity(quantityKey, item.quantity - 1)}
															aria-label={t("actions.decreaseQuantity")}
															className="inline-flex h-9 w-9 items-center justify-center text-[color:var(--editorial-ink)] transition-colors hover:bg-[color:rgba(216,208,196,0.24)] hover:text-[color:var(--editorial-accent)]"
															disabled={item.quantity <= 1}
														>
															<Minus className="h-3 w-3" />
														</button>
														<span className="min-w-8 text-center text-sm font-medium">{item.quantity}</span>
														<button
															type="button"
															onClick={() => handleUpdateQuantity(quantityKey, item.quantity + 1)}
															aria-label={t("actions.increaseQuantity")}
															className="inline-flex h-9 w-9 items-center justify-center text-[color:var(--editorial-ink)] transition-colors hover:bg-[color:rgba(216,208,196,0.24)] hover:text-[color:var(--editorial-accent)]"
														>
															<Plus className="h-3 w-3" />
														</button>
													</div>

													<button
														type="button"
														onClick={() => handleRemoveItem(quantityKey)}
														className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--editorial-muted)] transition-colors hover:text-[color:var(--editorial-accent)]"
													>
														{t("actions.removeItem")}
													</button>
												</div>
											</div>
										</div>
									</article>
								);
							})}
						</div>
					) : (
						<div className="flex h-full flex-col justify-between px-5 py-6">
							<div className="space-y-4">
								<div className="inline-flex h-12 w-12 items-center justify-center border border-[color:rgba(11,11,11,0.12)] bg-[color:rgba(216,208,196,0.22)] text-[color:var(--editorial-ink)]">
									<ShoppingBag className="h-5 w-5" />
								</div>
								<div className="space-y-2">
									<h3 className="text-xl font-semibold text-[color:var(--editorial-ink)]">
										{t("empty.title")}
									</h3>
									<p className="text-sm leading-7 text-[color:var(--editorial-muted)]">
										{t("empty.description")}
									</p>
								</div>
							</div>

							<button
								type="button"
								onClick={() => {
									onClose();
									router.push("/products");
								}}
								className="inline-flex min-h-11 items-center justify-center border border-[color:rgba(11,11,11,0.16)] px-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-ink)] transition-colors hover:border-[color:var(--editorial-accent)] hover:text-[color:var(--editorial-accent)]"
							>
								Ver produtos
							</button>
						</div>
					)}
				</div>

				<div className="border-t border-[color:rgba(11,11,11,0.1)] bg-[color:rgba(247,244,239,0.96)] px-5 py-5">
					{hasItems ? (
						<div className="space-y-4">
							<div className="space-y-2 border border-[color:rgba(11,11,11,0.1)] bg-[color:rgba(255,255,255,0.45)] p-3">
								<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-ink)]">
									{t("coupon.title")}
								</p>
								<div className="flex gap-2">
									<Input
										value={couponCode}
										onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
										placeholder={t("coupon.placeholder")}
										className="border-[color:rgba(11,11,11,0.12)] bg-[color:var(--editorial-paper)]"
									/>
									<button
										type="button"
										onClick={handleApplyCoupon}
										className="inline-flex min-h-11 items-center justify-center border border-[color:rgba(11,11,11,0.16)] px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-ink)] transition-colors hover:border-[color:var(--editorial-accent)] hover:text-[color:var(--editorial-accent)]"
									>
										{t("coupon.apply")}
									</button>
								</div>
								{cart?.couponCode ? (
									<div className="flex items-center justify-between gap-2 text-xs text-[color:var(--editorial-muted)]">
										<span>{t("coupon.active", { code: cart.couponCode })}</span>
										<button
											type="button"
											onClick={handleRemoveCoupon}
											className="font-medium text-[color:var(--editorial-accent)]"
										>
											{t("coupon.remove")}
										</button>
									</div>
								) : null}
								{cart?.couponError ? (
									<p className="text-xs text-[color:var(--editorial-accent)]">{cart.couponError}</p>
								) : null}
							</div>

							<div className="space-y-2 text-sm text-[color:var(--editorial-ink)]">
								<div className="flex items-center justify-between">
									<span>{t("summary.subtotal")}</span>
									<span className="font-medium">
										{formatMoney({
											amount: subtotal,
											currency: cartCurrency,
											locale,
										})}
									</span>
								</div>
								<div className="flex items-start justify-between gap-4 text-[color:var(--editorial-muted)]">
									<span>Frete</span>
									<span className="max-w-[14rem] text-right">
										{cart?.shippingRate
											? `${cart.shippingRate.providerLabel}${cart.shippingRate.serviceName ? ` · ${cart.shippingRate.serviceName}` : ""}`
											: "Calculado no checkout"}
									</span>
								</div>
								<div className="flex items-center justify-between border-t border-[color:rgba(11,11,11,0.1)] pt-2 text-base font-semibold">
									<span>{t("summary.total")}</span>
									<span>
										{formatMoney({
											amount: total,
											currency: cartCurrency,
											locale,
										})}
									</span>
								</div>
							</div>

							{error ? (
								<p className="text-sm text-[color:var(--editorial-accent)]" role="alert">
									{error}
								</p>
							) : null}

							<div className="grid gap-3 sm:grid-cols-[1fr_1.25fr]">
								<button
									type="button"
									onClick={() => {
										onClose();
										router.push("/products");
									}}
									className="inline-flex min-h-11 items-center justify-center border border-[color:rgba(11,11,11,0.16)] px-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-ink)] transition-colors hover:border-[color:var(--editorial-accent)] hover:text-[color:var(--editorial-accent)]"
								>
									Ver produtos
								</button>
								<button
									type="button"
									onClick={() => {
										if (loading) {
											return;
										}
										setLoading(true);
										setError(null);
										onClose();
										router.push("/checkout");
									}}
									disabled={loading}
									className="inline-flex min-h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-paper)] transition-colors hover:bg-[color:rgba(122,30,34,0.96)] disabled:bg-[color:rgba(11,11,11,0.42)]"
								>
									{loading ? t("actions.openingCheckout") : t("actions.checkout")}
								</button>
							</div>
						</div>
					) : null}
				</div>
			</aside>
		</>
	);
}
