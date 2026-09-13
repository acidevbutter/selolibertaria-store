"use client";

import { useCheckoutQuote } from "@/app/checkout/checkout-quote-context";
import { formatMoney } from "@/lib/utils";
import { SlOrderSummary } from "@/ui/sl/sl-order-summary";
import { economyShippingLabel } from "@/ui/sl/sl-shipping-option";

/**
 * Order summary sidebar. Renders the server-computed snapshot by default, but
 * once the checkout form resolves a live shipping quote (new address, "Calcular
 * total") it takes over so the total and shipping line reflect that quote
 * instead of the stale snapshot computed before an address existed.
 */
export function CheckoutSummary({
	locale,
	currency,
	subtotalLabel,
	subtotal,
	discountLabel,
	discountTotal,
	initialShippingLabel,
	initialShippingAmount,
	initialAmountTotal,
	initialShippingError,
}: {
	locale: string;
	currency: string;
	subtotalLabel: string;
	subtotal: number;
	discountLabel?: string;
	discountTotal: number;
	initialShippingLabel?: string | null;
	initialShippingAmount?: number | null;
	initialAmountTotal: number;
	initialShippingError?: string | null;
}) {
	const { quote } = useCheckoutQuote();
	const money = (amount: number) => formatMoney({ amount, currency: quote?.currency ?? currency, locale });

	const shippingLabel = quote ? economyShippingLabel(quote.estimatedDays) : initialShippingLabel;
	const shippingAmount = quote ? quote.shippingAmount : initialShippingAmount;
	const amountTotal = quote ? quote.amountTotal : initialAmountTotal;
	const shippingError = quote ? null : initialShippingError;

	const lines: Array<{
		label: string;
		value: string;
		tone?: "default" | "accent";
	}> = [{ label: subtotalLabel, value: money(subtotal) }];
	if (shippingLabel && typeof shippingAmount === "number") {
		lines.push({ label: shippingLabel, value: money(shippingAmount) });
	}
	if (discountTotal > 0 && discountLabel) {
		lines.push({
			label: discountLabel,
			value: `−${money(discountTotal)}`,
			tone: "accent",
		});
	}

	return (
		<>
			<SlOrderSummary lines={lines} total={money(amountTotal)} />
			{shippingError ? (
				<p
					className="mt-2 px-3 py-2 text-[12px]"
					style={{
						border: "1px solid var(--sl-wine)",
						background: "var(--sl-danger-wash)",
						color: "var(--sl-accent)",
					}}
				>
					{shippingError}
				</p>
			) : null}
		</>
	);
}
