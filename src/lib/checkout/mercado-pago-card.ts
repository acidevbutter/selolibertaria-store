export interface MercadoPagoCardPaymentMethod {
	id?: string;
	payment_type_id?: string;
}

export function resolveMercadoPagoCardPaymentMethod(methods?: MercadoPagoCardPaymentMethod[] | null) {
	return methods?.find(
		(method) =>
			Boolean(method.id) &&
			["credit_card", "debit_card", "prepaid_card"].includes(method.payment_type_id ?? ""),
	)?.id;
}
