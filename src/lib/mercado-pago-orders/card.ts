export const MAX_CARD_INSTALLMENTS = 12;

export function getMaxCardInstallments(amountInCents: number) {
	return Math.max(1, Math.min(MAX_CARD_INSTALLMENTS, Math.floor(amountInCents / 100)));
}

export function getMercadoPagoCardErrorMessage(statusDetail?: string | null) {
	switch (statusDetail?.trim().toLowerCase()) {
		case "cc_rejected_insufficient_amount":
			return "O cartão não tem limite suficiente para esta compra.";
		case "cc_rejected_bad_filled_card_number":
		case "cc_rejected_bad_filled_date":
		case "cc_rejected_bad_filled_security_code":
		case "cc_rejected_bad_filled_other":
			return "Confira os dados do cartão e tente novamente.";
		case "cc_rejected_call_for_authorize":
			return "A administradora pediu autorização para esta compra. Use outro cartão ou tente novamente.";
		case "cc_rejected_card_disabled":
			return "Este cartão está desabilitado. Use outro cartão.";
		case "cc_rejected_duplicated_payment":
			return "Esta cobrança já foi identificada. Aguarde a atualização do pedido.";
		case "cc_rejected_high_risk":
			return "O pagamento não foi aprovado pelas regras de segurança. Use outro cartão.";
		default:
			return "O pagamento foi recusado. Revise os dados ou escolha outra forma de pagamento.";
	}
}
