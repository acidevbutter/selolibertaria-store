import { redirect } from "next/navigation";
import { CheckoutForm } from "@/app/checkout/checkout-form.client";
import { CheckoutQuoteProvider } from "@/app/checkout/checkout-quote-context";
import { CheckoutSummary } from "@/app/checkout/checkout-summary.client";
import { getLocale, getTranslations } from "@/i18n/server";
import { getCartCookiePayload } from "@/lib/cart-cookies";
import { getCheckoutSnapshot } from "@/lib/checkout/cart-snapshot";
import { formatMoney } from "@/lib/utils";
import { SlCheckoutStepper } from "@/ui/sl/sl-checkout-stepper";
import { SlMiniProductRow } from "@/ui/sl/sl-mini-product-row";
import { economyShippingLabel } from "@/ui/sl/sl-shipping-option";

interface CheckoutStartPageProps {
	searchParams: Promise<{ prepared?: string }>;
}

/**
 * Server page that prepares the guest cart and renders the hosted Asaas checkout.
 */
export default async function CheckoutStartPage({ searchParams }: CheckoutStartPageProps) {
	const resolvedSearchParams = await searchParams;
	const guestCartPayload = await getCartCookiePayload();

	if (guestCartPayload && resolvedSearchParams.prepared !== "1") {
		redirect("/checkout/prepare");
	}
	if (!guestCartPayload && resolvedSearchParams.prepared === "1") {
		redirect("/checkout");
	}

	const [locale, t] = await Promise.all([getLocale(), getTranslations("Checkout.page")]);

	const snapshotResult = await getCheckoutSnapshot();

	if (!snapshotResult.ok) {
		return (
			<main className="sl-scope mx-auto max-w-md px-6 py-16" style={{ color: "var(--sl-text)" }}>
				<h1 className="sl-head m-0 text-[32px] leading-[0.98]">{t("errorTitle")}</h1>
				<p className="mt-4 text-[14px] text-[color:var(--sl-accent)]">{snapshotResult.error}</p>
				<a className="sl-link mt-6 inline-block text-[13px]" href="/products">
					{t("continueShopping")}
				</a>
			</main>
		);
	}
	const res = snapshotResult.snapshot;

	const money = (amount: number) => formatMoney({ amount, currency: res.currency, locale });
	const discountLabel =
		res.discountTotal > 0
			? res.couponCode
				? t("summary.discountsWithCode", { code: res.couponCode })
				: t("summary.discounts")
			: undefined;

	return (
		<div className="sl-scope" style={{ background: "var(--sl-surface-page)", color: "var(--sl-text)" }}>
			<header
				className="flex h-[72px] items-center justify-between px-4 sm:px-8 lg:px-10"
				style={{
					background: "var(--sl-surface-invert)",
					color: "var(--sl-text-on-ink)",
				}}
			>
				<div className="flex items-center gap-3">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src="/images/selolibertaria.png" alt="" className="h-9 w-9 flex-none object-cover" />
					<span className="sl-u text-[13px] tracking-[0.28em]">Libertária</span>
				</div>
				<div className="hidden sm:block">
					<SlCheckoutStepper steps={["Identificação", "Entrega", "Pagamento"]} current={3} />
				</div>
				<div className="flex items-center gap-2 text-[12px] text-[color:var(--sl-text-on-ink-muted)]">
					<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
						<path d="M4.5 7V5.2a3.5 3.5 0 0 1 7 0V7" fill="none" stroke="#F7F4EF" strokeWidth="1.6" />
						<rect x="2.6" y="7" width="10.8" height="7.4" fill="none" stroke="#F7F4EF" strokeWidth="1.6" />
					</svg>
					<span>Ambiente seguro · SSL</span>
				</div>
			</header>

			<CheckoutQuoteProvider>
				<div className="mx-auto grid w-full max-w-[var(--sl-w-narrow)] gap-8 px-4 py-9 sm:px-8 lg:grid-cols-[1fr_400px] lg:items-start lg:px-10">
					<section>
						<CheckoutForm checkout={res} />
					</section>

					<aside className="flex flex-col gap-4">
						<div
							style={{
								border: "1px solid var(--sl-line)",
								background: "var(--sl-surface-card)",
							}}
						>
							<div
								className="flex items-center justify-between px-5 py-3.5"
								style={{ background: "var(--sl-surface-band)" }}
							>
								<span className="sl-u text-[11px] tracking-[0.24em]">{t("summaryTitle")}</span>
								<span className="text-[12px] text-[color:var(--sl-text-soft)]">
									{res.items.length} {res.items.length === 1 ? "item" : "itens"}
								</span>
							</div>
							<div className="flex flex-col gap-3.5 border-b border-[color:var(--sl-line-hairline)] px-5 py-4">
								{res.items.map((item) => (
									<SlMiniProductRow
										key={item.variantId}
										framed={false}
										title={item.name}
										meta={t("summary.quantity", { quantity: item.quantity })}
										price={money(item.lineFinalTotal)}
										image={
											item.image ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img src={item.image} alt="" className="h-full w-full object-cover" />
											) : undefined
										}
									/>
								))}
							</div>
							<div className="border-b border-[color:var(--sl-line-hairline)] px-5 py-4">
								<CheckoutSummary
									locale={locale}
									currency={res.currency}
									subtotalLabel={t("summary.subtotal")}
									subtotal={res.subtotal}
									discountLabel={discountLabel}
									discountTotal={res.discountTotal}
									initialShippingLabel={
										res.shippingRate ? economyShippingLabel(res.shippingRate.estimated_days) : null
									}
									initialShippingAmount={res.shippingRate ? res.shippingRate.fixed_amount.amount : null}
									initialAmountTotal={res.amountTotal}
									initialShippingError={res.shippingError && !res.shippingRate ? res.shippingError : null}
								/>
							</div>
							<div className="flex flex-col gap-2.5 px-5 py-4">
								<div className="flex items-start gap-2.5">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<p className="m-0 text-[13px] leading-[1.55]">
										Pagamento processado pela <strong>Asaas</strong> em ambiente hospedado e seguro.
									</p>
								</div>
								<div className="flex items-baseline gap-2.5">
									<span className="font-black text-[color:var(--sl-accent)]">✓</span>
									<p className="m-0 text-[13px] leading-[1.55]">
										Envio com rastreio pelo Melhor Envio, código por e-mail em 24h.
									</p>
								</div>
								<div className="flex flex-wrap gap-1.5 pt-1.5">
									{[
										{ src: "/images/icons/pix.svg", alt: "Pix", h: "h-3.5" },
										{ src: "/images/icons/visa.svg", alt: "Visa", h: "h-3" },
										{
											src: "/images/icons/mastercard.svg",
											alt: "Mastercard",
											h: "h-4",
										},
									].map((icon) => (
										<span
											key={icon.alt}
											className="inline-flex h-[26px] items-center justify-center px-2.5"
											style={{ border: "1px solid var(--sl-line-strong)" }}
										>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img src={icon.src} alt={icon.alt} className={`${icon.h} w-auto`} />
										</span>
									))}
									{["ELO", "BOLETO"].map((word) => (
										<span
											key={word}
											className="sl-u inline-flex h-[26px] items-center px-2.5 text-[10px] tracking-[0.16em]"
											style={{ border: "1px solid var(--sl-line-strong)" }}
										>
											{word}
										</span>
									))}
								</div>
							</div>
						</div>

						<div
							className="flex flex-col gap-2 px-5 py-4"
							style={{
								background: "var(--sl-surface-invert)",
								color: "var(--sl-text-on-ink)",
							}}
						>
							<p className="sl-eyebrow m-0 text-[color:var(--sl-text-on-ink-label)]">Precisa de ajuda?</p>
							<p className="m-0 text-[14px] leading-[1.6]">
								Fale com a gente em <span className="underline">contato@selolibertaria.com.br</span>.
								Respondemos em até 1 dia útil.
							</p>
						</div>
					</aside>
				</div>
			</CheckoutQuoteProvider>
		</div>
	);
}
