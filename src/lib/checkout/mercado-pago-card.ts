export interface MercadoPagoCardPaymentMethod {
	id?: string;
	payment_type_id?: string;
}

export interface MercadoPagoInstallment {
	installments?: number;
	recommended_message?: string;
}

export function resolveMercadoPagoCardPaymentMethodDetails(methods?: MercadoPagoCardPaymentMethod[] | null) {
	return methods?.find(
		(method) =>
			Boolean(method.id) &&
			["credit_card", "debit_card", "prepaid_card"].includes(method.payment_type_id ?? ""),
	);
}

export function resolveMercadoPagoCardPaymentMethod(methods?: MercadoPagoCardPaymentMethod[] | null) {
	return resolveMercadoPagoCardPaymentMethodDetails(methods)?.id;
}

export function normalizeMercadoPagoInstallments(installments?: MercadoPagoInstallment[] | null) {
	return (installments ?? [])
		.filter((option): option is MercadoPagoInstallment & { installments: number } =>
			Boolean(option.installments && option.installments > 0),
		)
		.map((option) => ({
			value: String(option.installments),
			label: option.recommended_message?.trim() || `${option.installments}x`,
		}))
		.filter((option, index, options) => options.findIndex((item) => item.value === option.value) === index);
}
