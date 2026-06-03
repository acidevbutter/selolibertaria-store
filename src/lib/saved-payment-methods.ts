import type Stripe from "stripe";

export interface SavedPaymentMethodSummary {
	id: string;
	type: string;
	billingDetails: {
		name: string | null;
		email: string | null;
	};
	card: {
		brand: string;
		last4: string;
		expMonth: number;
		expYear: number;
	} | null;
	created: number;
}

export function serializeSavedCardPaymentMethod(method: Stripe.PaymentMethod): SavedPaymentMethodSummary {
	return {
		id: method.id,
		type: method.type,
		billingDetails: {
			name: method.billing_details.name,
			email: method.billing_details.email,
		},
		card: method.card
			? {
					brand: method.card.brand,
					last4: method.card.last4,
					expMonth: method.card.exp_month,
					expYear: method.card.exp_year,
				}
			: null,
		created: method.created,
	};
}

export async function listSavedCardPaymentMethods(
	stripe: Stripe,
	customerId?: string | null,
): Promise<SavedPaymentMethodSummary[]> {
	if (!customerId) return [];

	const paymentMethods = await stripe.paymentMethods.list({
		customer: customerId,
		type: "card",
	});

	return paymentMethods.data.map(serializeSavedCardPaymentMethod);
}
