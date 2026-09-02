"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { applyCartCouponAction, removeCartCouponAction } from "@/actions/cart-actions";
import { useCart } from "@/context/cart-context";
import { useLocale, useTranslations } from "@/i18n/client";
import { getProductImageOptimizationProps } from "@/lib/product-image-utils";
import { formatMoney } from "@/lib/utils";
import { SlCouponField } from "@/ui/sl/sl-coupon-field";
import { SlFreeShippingMeter } from "@/ui/sl/sl-free-shipping-meter";
import { SlOrderSummary } from "@/ui/sl/sl-order-summary";
import { SlQuantityStepper } from "@/ui/sl/sl-quantity-stepper";
import { economyShippingLabel, SlShippingOption } from "@/ui/sl/sl-shipping-option";

interface CartSidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

// Display-only threshold for the free-shipping meter (minor units). The real
// total is computed server-side and unaffected by this value.
const FREE_SHIPPING_THRESHOLD = 20000;

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
	const { cart, itemCount, optimisticUpdate, optimisticRemove, replaceCart } = useCart();
	const router = useRouter();
	const locale = useLocale();
	const t = useTranslations("CartSidebar");

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

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

	async function handleApplyCoupon(code: string) {
		setError(null);
		const result = await applyCartCouponAction(code);
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
	const cartCurrency = cart?.currency || "BRL";
	const subtotal = typeof cart?.subtotal === "number" ? cart.subtotal : cart?.total || 0;
	const total = cart?.total || 0;
	const discountTotal = cart?.discountTotal ?? 0;
	const money = (amount: number) => formatMoney({ amount, currency: cartCurrency, locale });

	const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
	const shippingLabel = cart?.shippingRate
		? economyShippingLabel(cart.shippingRate.estimated_days)
		: "Calculado no checkout";

	return (
		<div className="sl-scope">
			<button
				type="button"
				aria-label={t("actions.close")}
				className="fixed inset-0 z-40"
				style={{ background: "rgba(11,11,11,0.5)" }}
				onClick={onClose}
			/>

			<aside
				className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[416px] flex-col overflow-y-auto"
				style={{
					background: "var(--sl-paper)",
					color: "var(--sl-text)",
					borderLeft: "1px solid var(--sl-ink)",
				}}
			>
				<div
					className="flex h-16 items-center justify-between px-5"
					style={{ background: "var(--sl-ink)", color: "var(--sl-text-on-ink)" }}
				>
					<span className="sl-price text-[22px]">{t("title", { count: itemCount })}</span>
					<button type="button" onClick={onClose} aria-label={t("actions.close")} className="text-[18px]">
						✕
					</button>
				</div>

				{hasItems ? (
					<>
						<SlFreeShippingMeter
							remainingLabel={money(remaining)}
							thresholdLabel={money(FREE_SHIPPING_THRESHOLD)}
							progress={subtotal / FREE_SHIPPING_THRESHOLD}
						/>

						<div className="flex flex-col px-5">
							{cartItems.map((item) => {
								const product = item.product;
								const linePrice = (item.finalPrice ?? item.price) * item.quantity;
								const quantityKey = item.variantId || item.productId;

								return (
									<div
										key={item.id}
										className="flex gap-3.5 border-b border-[color:var(--sl-line-hairline)]"
										style={{ paddingTop: "18px", paddingBottom: "18px" }}
									>
										<div
											className="relative h-16 w-16 flex-none overflow-hidden"
											style={{ background: "var(--sl-sand)" }}
										>
											{product?.images?.[0] ? (
												<Image
													src={product.images[0]}
													alt={product.name || t("fallback.product")}
													fill
													className="object-cover"
													sizes="64px"
													{...getProductImageOptimizationProps(product.images[0])}
												/>
											) : null}
										</div>

										<div className="flex flex-1 flex-col gap-2">
											<p className="m-0 text-[10px] uppercase tracking-[0.2em] text-[color:var(--sl-text-quiet)]">
												Edição selecionada
											</p>
											<p className="sl-price m-0 text-[18px] leading-tight">
												{product?.name || t("fallback.product")}
											</p>
											<div className="flex items-center justify-between">
												<SlQuantityStepper
													value={item.quantity}
													onDecrement={() => void handleUpdateQuantity(quantityKey, item.quantity - 1)}
													onIncrement={() => void handleUpdateQuantity(quantityKey, item.quantity + 1)}
													decrementLabel={t("actions.decreaseQuantity")}
													incrementLabel={t("actions.increaseQuantity")}
												/>
												<span className="sl-price text-[18px]">{money(linePrice)}</span>
											</div>
											<button
												type="button"
												onClick={() => void handleRemoveItem(quantityKey)}
												className="self-start text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--sl-text-quiet)] transition-colors hover:text-[color:var(--sl-accent)]"
											>
												{t("actions.removeItem")}
											</button>
										</div>
									</div>
								);
							})}
						</div>

						<div className="flex flex-col gap-3.5 p-5">
							<SlCouponField
								appliedCode={cart?.couponCode ?? null}
								discountLabel={discountTotal > 0 ? `−${money(discountTotal)}` : null}
								errorMessage={error ?? cart?.couponError ?? null}
								onApply={handleApplyCoupon}
								onRemove={handleRemoveCoupon}
							/>

							<div className="flex flex-col gap-2">
								<span className="sl-lbl">Frete</span>
								{cart?.shippingRate ? (
									<SlShippingOption
										selected
										label={economyShippingLabel(cart.shippingRate.estimated_days)}
										price={money(cart.shippingRate.fixed_amount.amount)}
									/>
								) : (
									<div
										className="flex h-[52px] items-center px-3.5 text-[14px] text-[color:var(--sl-text-muted)]"
										style={{ border: "1px solid var(--sl-line-strong)" }}
									>
										{shippingLabel}
									</div>
								)}
							</div>

							<SlOrderSummary
								className="border-t border-[color:var(--sl-line-hairline)] pt-3.5"
								lines={[
									{ label: t("summary.subtotal"), value: money(subtotal) },
									...(discountTotal > 0
										? [{ label: "Desconto", value: `−${money(discountTotal)}`, tone: "accent" as const }]
										: []),
									{
										label: "Frete",
										value: cart?.shippingRate ? money(cart.shippingRate.fixed_amount.amount) : "no checkout",
									},
								]}
								total={money(total)}
								footnote={null}
							/>

							<button
								type="button"
								className="sl-btn sl-btn-buy w-full"
								disabled={loading}
								onClick={() => {
									if (loading) return;
									setLoading(true);
									setError(null);
									onClose();
									router.push("/checkout");
								}}
							>
								{loading ? t("actions.openingCheckout") : t("actions.checkout")}
							</button>
							<button type="button" className="sl-btn sl-btn-secondary w-full" onClick={onClose}>
								Continuar comprando
							</button>
							<p className="m-0 text-center text-[12px] leading-[1.6] text-[color:var(--sl-text-soft)]">
								Pagamento seguro Mercado Pago · Pix, cartão em até 6x ou boleto
							</p>
						</div>
					</>
				) : (
					<div className="flex flex-1 flex-col justify-between p-6">
						<div className="flex flex-col gap-3">
							<h2 className="sl-price m-0 text-[24px]">{t("empty.title")}</h2>
							<p className="m-0 text-[14px] leading-[1.7] text-[color:var(--sl-text-muted)]">
								{t("empty.description")}
							</p>
						</div>
						<button
							type="button"
							className="sl-btn sl-btn-primary w-full"
							onClick={() => {
								onClose();
								router.push("/products");
							}}
						>
							Ver produtos
						</button>
					</div>
				)}
			</aside>
		</div>
	);
}
