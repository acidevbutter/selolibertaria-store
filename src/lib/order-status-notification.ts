export type FulfillmentStatus = "received" | "producing" | "shipped";

export type CustomerOrderStatusKey =
	| "payment_action_required"
	| "payment_processing"
	| "payment_confirmed"
	| "payment_disputed"
	| "payment_dispute_resolved"
	| "payment_dispute_lost"
	| "payment_failed"
	| "payment_canceled"
	| "payment_refunded"
	| "fulfillment_received"
	| "fulfillment_producing"
	| "fulfillment_shipped";

export type CustomerOrderStatusContent = {
	key: CustomerOrderStatusKey;
	kind: "payment" | "fulfillment";
	subject: string;
	heading: string;
	intro: string;
	statusLabel: string;
	details?: string;
};

const FULFILLMENT_STATUS_SET = new Set<FulfillmentStatus>(["received", "producing", "shipped"]);

function normalizeStatus(status?: string | null) {
	return status?.trim().toLowerCase() ?? "";
}

export function isFulfillmentStatus(status?: string | null): status is FulfillmentStatus {
	return FULFILLMENT_STATUS_SET.has(normalizeStatus(status) as FulfillmentStatus);
}

export function getCustomerOrderStatusKey(status?: string | null): CustomerOrderStatusKey | null {
	const normalized = normalizeStatus(status);
	if (!normalized) return null;

	if (isFulfillmentStatus(normalized)) {
		if (normalized === "received") return "fulfillment_received";
		if (normalized === "producing") return "fulfillment_producing";
		return "fulfillment_shipped";
	}

	switch (normalized) {
		case "paid":
		case "succeeded":
		case "no_payment_required":
			return "payment_confirmed";
		case "disputed":
			return "payment_disputed";
		case "won":
			return "payment_dispute_resolved";
		case "lost":
			return "payment_dispute_lost";
		case "processing":
		case "pending":
		case "unpaid":
		case "open":
			return "payment_processing";
		case "requires_action":
		case "requires_capture":
		case "requires_confirmation":
		case "requires_payment_method":
			return "payment_action_required";
		case "failed":
			return "payment_failed";
		case "canceled":
		case "cancel":
		case "expired":
		case "voided":
		case "uncollectible":
			return "payment_canceled";
		case "refunded":
		case "refund_updated":
			return "payment_refunded";
		default:
			return null;
	}
}

export function shouldNotifyCustomerOrderStatusChange(
	previousStatus?: string | null,
	nextStatus?: string | null,
) {
	const nextKey = getCustomerOrderStatusKey(nextStatus);
	if (!nextKey) return false;
	if (nextKey === "payment_confirmed" || nextKey === "fulfillment_received") return false;
	const previousKey = getCustomerOrderStatusKey(previousStatus);
	return previousKey !== nextKey;
}

export function getCustomerOrderStatusContent({
	status,
	trackingNumber,
}: {
	status?: string | null;
	trackingNumber?: string | null;
}): CustomerOrderStatusContent | null {
	const key = getCustomerOrderStatusKey(status);
	if (!key) return null;

	switch (key) {
		case "payment_action_required":
			return {
				key,
				kind: "payment",
				subject: "Seu pedido aguarda uma ação no pagamento",
				heading: "Ação de pagamento necessária",
				intro:
					"Recebemos seu pedido, mas o pagamento ainda precisa de confirmação extra ou de um novo método.",
				statusLabel: "Ação de pagamento necessária",
				details: "Se preciso, tente novamente no checkout para concluir sua compra.",
			};
		case "payment_processing":
			return {
				key,
				kind: "payment",
				subject: "Recebemos seu pedido e o pagamento está em análise",
				heading: "Pagamento em análise",
				intro: "Seu pedido foi recebido e o pagamento está sendo analisado pela instituição financeira.",
				statusLabel: "Pagamento em análise",
				details: "Assim que a confirmação chegar, avisaremos por email.",
			};
		case "payment_confirmed":
			return {
				key,
				kind: "payment",
				subject: "Pagamento confirmado",
				heading: "Pagamento confirmado",
				intro: "O pagamento do seu pedido foi aprovado e já entrou no nosso fluxo interno.",
				statusLabel: "Pagamento aprovado",
				details:
					"Seguiremos com as próximas etapas e enviaremos novas atualizações conforme o pedido avançar.",
			};
		case "payment_disputed":
			return {
				key,
				kind: "payment",
				subject: "Seu pagamento está em análise de disputa",
				heading: "Pagamento em disputa",
				intro:
					"Uma disputa foi aberta para este pagamento e nossa equipe está analisando o caso com o provedor.",
				statusLabel: "Pagamento em disputa",
				details: "Entraremos em contato se precisarmos de algo durante essa análise.",
			};
		case "payment_dispute_resolved":
			return {
				key,
				kind: "payment",
				subject: "A disputa do seu pagamento foi resolvida",
				heading: "Disputa resolvida",
				intro:
					"A disputa relacionada a este pagamento foi resolvida e a linha do tempo do pedido foi atualizada.",
				statusLabel: "Disputa resolvida",
				details: "Se você ainda precisar de ajuda com este pedido, fale com nosso suporte.",
			};
		case "payment_dispute_lost":
			return {
				key,
				kind: "payment",
				subject: "A disputa do seu pagamento foi encerrada",
				heading: "Disputa encerrada",
				intro: "A disputa relacionada a este pagamento foi encerrada pelo provedor de pagamento.",
				statusLabel: "Disputa encerrada",
				details: "Se tiver dúvidas sobre o resultado, fale com nosso suporte.",
			};
		case "payment_failed":
			return {
				key,
				kind: "payment",
				subject: "Não conseguimos aprovar o pagamento",
				heading: "Pagamento não aprovado",
				intro: "Não conseguimos confirmar o pagamento do seu pedido.",
				statusLabel: "Pagamento recusado",
				details: "Você pode tentar novamente com outro método de pagamento ou revisar os dados enviados.",
			};
		case "payment_canceled":
			return {
				key,
				kind: "payment",
				subject: "Pagamento cancelado",
				heading: "Pagamento cancelado",
				intro: "O pagamento do seu pedido foi cancelado ou expirou antes da confirmação.",
				statusLabel: "Pagamento cancelado",
				details: "Se você ainda quiser concluir a compra, será preciso iniciar um novo pagamento.",
			};
		case "payment_refunded":
			return {
				key,
				kind: "payment",
				subject: "Reembolso processado",
				heading: "Atualização do reembolso",
				intro: "Registramos uma atualização de reembolso para o seu pedido.",
				statusLabel: "Reembolso processado",
				details: "Se precisar de ajuda para acompanhar o reembolso, fale com nosso suporte.",
			};
		case "fulfillment_received":
			return {
				key,
				kind: "fulfillment",
				subject: "Seu pedido foi recebido pela nossa equipe",
				heading: "Pedido recebido",
				intro: "Seu pedido foi recebido pela nossa equipe e entrou na fila de preparação.",
				statusLabel: "Pedido recebido",
				details: "Vamos avisar quando ele avançar para a próxima etapa.",
			};
		case "fulfillment_producing":
			return {
				key,
				kind: "fulfillment",
				subject: "Seu pedido está em preparação",
				heading: "Pedido em preparação",
				intro: "Seu pedido está em preparação no momento.",
				statusLabel: "Em preparação",
				details: "Assim que ele for enviado, você receberá outra atualização.",
			};
		case "fulfillment_shipped":
			return {
				key,
				kind: "fulfillment",
				subject: "Seu pedido foi enviado",
				heading: "Pedido enviado",
				intro: "Seu pedido foi despachado e está a caminho.",
				statusLabel: "Pedido enviado",
				details: trackingNumber
					? `Código de rastreio: ${trackingNumber}`
					: "Se o rastreio estiver disponível, ele aparecerá nesta atualização.",
			};
	}
}
