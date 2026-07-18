import type Stripe from "stripe";

/**
 * Keep the browser-facing status aligned with the payment intent itself.
 * Server-side authoritative states such as disputes or fulfillment stages are preserved elsewhere.
 */
export function getClientVisiblePaymentIntentStatus(status: Stripe.PaymentIntent.Status) {
	return status;
}

export function getIncompletePaymentIntentMessage(status?: Stripe.PaymentIntent.Status | string | null) {
	switch (status) {
		case "requires_payment_method":
			return "Método de pagamento indisponível ou recusado. Escolha outro método e tente novamente.";
		case "requires_action":
			return "Conclua a autenticação ou instrução aberta pela Stripe para continuar o pagamento.";
		case "requires_confirmation":
			return "Não foi possível confirmar esse método de pagamento. Tente novamente ou escolha outro método.";
		case "requires_capture":
			return "Pagamento autorizado, mas ainda não capturado. Aguarde a confirmação do pedido.";
		case "canceled":
			return "Pagamento cancelado. Revise os dados e tente novamente.";
		default:
			return "O pagamento ainda não foi concluído. Aguarde a confirmação ou tente outro método.";
	}
}
