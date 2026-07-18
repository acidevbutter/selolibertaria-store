"use client";

import type { TransparentCheckoutIntent } from "@/actions/checkout-actions";
import { MercadoPagoCheckoutForm } from "@/app/checkout/mercado-pago-checkout-form.client";
import type { AppLocale } from "@/i18n/config";

export function CheckoutForm({
	checkout,
	locale,
}: {
	checkout: TransparentCheckoutIntent;
	locale: AppLocale;
}) {
	return <MercadoPagoCheckoutForm checkout={checkout} locale={locale} />;
}
