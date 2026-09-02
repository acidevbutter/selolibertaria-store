"use client";

import type { TransparentCheckoutIntent } from "@/actions/checkout-actions";
import { MercadoPagoCheckoutForm } from "@/app/checkout/mercado-pago-checkout-form.client";
import type { AppLocale } from "@/i18n/config";
import { PAYMENTS_PROVIDER } from "@/lib/payments";

/**
 * Provider switch for the checkout payment form.
 *
 * - `mercado_pago` → the existing transparent Mercado Pago form (unchanged).
 * - `asaas` → Asaas form (pending backend contract — see checkout-actions).
 * - `disabled` → nothing here; the page renders a maintenance notice upstream.
 */
export function CheckoutForm({
	checkout,
	locale,
	boletoEnabled = false,
}: {
	checkout: TransparentCheckoutIntent;
	locale: AppLocale;
	boletoEnabled?: boolean;
}) {
	if (PAYMENTS_PROVIDER === "mercado_pago") {
		return <MercadoPagoCheckoutForm checkout={checkout} locale={locale} boletoEnabled={boletoEnabled} />;
	}

	// The page gates non-Mercado-Pago providers before reaching here; this is a
	// safety net until the Asaas form is wired.
	return (
		<div
			className="sl-scope p-6 text-[14px] leading-[1.7] text-[color:var(--sl-text-muted)]"
			style={{ border: "1px solid var(--sl-line-strong)", background: "var(--sl-sand)" }}
		>
			O meio de pagamento está em migração. Tente novamente em instantes.
		</div>
	);
}
