"use client";

import { AsaasCheckoutForm } from "@/app/checkout/asaas-checkout-form.client";
import type { CheckoutSnapshot } from "@/lib/checkout/cart-snapshot";

/**
 * Hosted Asaas checkout form.
 */
export function CheckoutForm({ checkout }: { checkout: CheckoutSnapshot }) {
	return <AsaasCheckoutForm checkout={checkout} />;
}
