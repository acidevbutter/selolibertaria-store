import { redirect } from "next/navigation";
import { createTransparentCheckoutIntent } from "@/actions/checkout-actions";
import { CheckoutForm } from "@/app/checkout/checkout-form.client";
import { getLocale, getTranslations } from "@/i18n/server";
import { getCartCookiePayload } from "@/lib/cart-cookies";
import { formatMoney } from "@/lib/utils";

interface CheckoutStartPageProps {
	searchParams: Promise<{
		prepared?: string;
	}>;
}

/**
 * Server page that:
 * 1. Redirects guest-cart preparation Route Handler when cookie mutation is needed
 * 2. Creates or reuses a Mercado Pago payment draft from the server-validated cart
 * 3. Renders the Mercado Pago payment form inside the site checkout UI
 * Guests can complete the checkout without creating an account first.
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
	const res = await createTransparentCheckoutIntent();

	if ("error" in res) {
		return (
			<main className="mx-auto max-w-md px-6 py-12">
				<h1 className="mb-4 text-2xl font-bold">{t("errorTitle")}</h1>
				<p className="text-sm text-red-600">{res.error}</p>
				<a className="mt-6 inline-block text-blue-600 underline" href="/products">
					{t("continueShopping")}
				</a>
			</main>
		);
	}

	return (
		<main className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_400px]">
			<section>
				<div className="mb-6">
					<p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
						{t("eyebrow")}
					</p>
					<h1 className="mt-2 text-3xl font-bold tracking-tight">{t("title")}</h1>
					<p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>
				</div>
				<CheckoutForm checkout={res} locale={locale} />
			</section>

			<aside className="h-fit rounded-xl border bg-card p-6 shadow-sm">
				<h2 className="text-lg font-semibold">{t("summaryTitle")}</h2>
				<div className="mt-5 space-y-4">
					{res.items.map((item) => (
						<div key={item.variantId} className="flex gap-3">
							<div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
								{item.image ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={item.image} alt="" className="h-full w-full object-cover" />
								) : (
									<span className="text-xs text-muted-foreground">{t("summary.noImage")}</span>
								)}
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{item.name}</p>
								<p className="text-xs text-muted-foreground">
									{t("summary.quantity", { quantity: item.quantity })}
								</p>
							</div>
							<p className="text-sm font-medium">
								{formatMoney({
									amount: item.lineFinalTotal,
									currency: res.currency,
									locale,
								})}
							</p>
						</div>
					))}
				</div>

				<div className="mt-6 border-t pt-4">
					<div className="space-y-2 text-sm text-muted-foreground">
						<div className="flex items-center justify-between">
							<span>{t("summary.subtotal")}</span>
							<span>
								{formatMoney({
									amount: res.subtotal,
									currency: res.currency,
									locale,
								})}
							</span>
						</div>

						{res.shippingRate ? (
							<div className="flex items-center justify-between">
								<span>
									{res.shippingRate.providerLabel}
									{res.shippingRate.serviceName ? ` · ${res.shippingRate.serviceName}` : ""}
								</span>
								<span>
									{formatMoney({
										amount: res.shippingRate.fixed_amount.amount,
										currency: res.currency,
										locale,
									})}
								</span>
							</div>
						) : res.shippingError ? (
							<p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
								{res.shippingError}
							</p>
						) : null}

						{res.discountTotal > 0 ? (
							<div className="flex items-center justify-between text-red-600">
								<span>
									{res.couponCode
										? t("summary.discountsWithCode", { code: res.couponCode })
										: t("summary.discounts")}
								</span>
								<span>
									-
									{formatMoney({
										amount: res.discountTotal,
										currency: res.currency,
										locale,
									})}
								</span>
							</div>
						) : null}

						<div className="flex items-center justify-between text-base font-semibold">
							<span>{t("summary.total")}</span>
							<span>
								{formatMoney({
									amount: res.amountTotal,
									currency: res.currency,
									locale,
								})}
							</span>
						</div>
					</div>
				</div>
			</aside>
		</main>
	);
}
