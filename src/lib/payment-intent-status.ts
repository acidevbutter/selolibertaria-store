import type Stripe from "stripe";

/**
 * Keep the browser-facing status aligned with the payment intent itself.
 * Server-side authoritative states such as disputes or fulfillment stages are preserved elsewhere.
 */
export function getClientVisiblePaymentIntentStatus(status: Stripe.PaymentIntent.Status) {
	return status;
}
