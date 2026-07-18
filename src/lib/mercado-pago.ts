import { createHmac, timingSafeEqual } from "node:crypto";
import { env, publicUrl } from "@/env.mjs";

const MERCADO_PAGO_API_BASE_URL = "https://api.mercadopago.com";

export type MercadoPagoPaymentStatus =
	| "approved"
	| "authorized"
	| "in_process"
	| "pending"
	| "rejected"
	| "cancelled"
	| "refunded"
	| "charged_back"
	| string;

export interface MercadoPagoPaymentResponse {
	id?: number | string;
	status?: MercadoPagoPaymentStatus;
	status_detail?: string;
	payment_method_id?: string;
	external_reference?: string;
	transaction_amount?: number;
	currency_id?: string;
	metadata?: Record<string, unknown>;
	point_of_interaction?: {
		transaction_data?: {
			qr_code?: string;
			qr_code_base64?: string;
			ticket_url?: string;
		};
	};
	date_of_expiration?: string;
}

export type MercadoPagoPaymentOutcomeKind =
	| "approved"
	| "processing"
	| "rejected"
	| "validation_error"
	| "unavailable"
	| "unknown";

export interface MercadoPagoPaymentOutcome {
	kind: MercadoPagoPaymentOutcomeKind;
	message: string;
	retryable: boolean;
}

export interface MercadoPagoCustomerCard {
	id?: string | number;
	token?: string;
	first_six_digits?: string;
	last_four_digits?: string;
	expiration_month?: number;
	expiration_year?: number;
	payment_method?: { id?: string; name?: string };
	issuer?: { id?: string | number; name?: string };
}

export interface MercadoPagoSavedCard {
	id: string;
	brand: string | null;
	lastFourDigits: string | null;
	expirationMonth: number | null;
	expirationYear: number | null;
}

export interface MercadoPagoPixPaymentData {
	paymentId: string;
	status: string;
	qrCode: string | null;
	qrCodeBase64: string | null;
	ticketUrl: string | null;
	expiresAt: string | null;
}

export interface MercadoPagoCreatePaymentInput {
	transaction_amount: number;
	description: string;
	payment_method_id: string;
	payer: {
		email: string;
		first_name?: string;
		last_name?: string;
		identification?: {
			type: string;
			number: string;
		};
	};
	token?: string;
	installments?: number;
	issuer_id?: string;
	external_reference: string;
	notification_url?: string;
	metadata?: Record<string, string | number | boolean | null>;
}

function mercadoPagoError(payload: { message?: string; error?: string } | null, fallback: string) {
	return payload?.message || payload?.error || fallback;
}

async function mercadoPagoRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
	if (!env.MERCADO_PAGO_ACCESS_TOKEN) throw new Error("Mercado Pago não configurado");
	const response = await fetch(`${MERCADO_PAGO_API_BASE_URL}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`,
			...(init.body ? { "Content-Type": "application/json" } : {}),
			...init.headers,
		},
		cache: "no-store",
	});
	const payload = (await response.json().catch(() => null)) as
		| (T & { message?: string; error?: string })
		| null;
	if (!response.ok) throw new Error(mercadoPagoError(payload, "Falha na comunicação com o Mercado Pago"));
	return payload as T;
}

export function mapMercadoPagoSavedCard(card: MercadoPagoCustomerCard): MercadoPagoSavedCard | null {
	if (!card.id) return null;
	return {
		id: String(card.id),
		brand: card.payment_method?.name ?? card.payment_method?.id ?? null,
		lastFourDigits: card.last_four_digits ?? null,
		expirationMonth: Number.isInteger(card.expiration_month) ? card.expiration_month! : null,
		expirationYear: Number.isInteger(card.expiration_year) ? card.expiration_year! : null,
	};
}

export async function createMercadoPagoCustomer(input: {
	email: string;
	firstName?: string;
	lastName?: string;
	identification?: { type: string; number: string };
}) {
	return mercadoPagoRequest<{ id?: string | number }>("/v1/customers", {
		method: "POST",
		body: JSON.stringify({
			email: input.email,
			first_name: input.firstName,
			last_name: input.lastName,
			identification: input.identification,
		}),
	});
}

export async function listMercadoPagoCustomerCards(customerId: string) {
	const cards = await mercadoPagoRequest<MercadoPagoCustomerCard[] | { cards?: MercadoPagoCustomerCard[] }>(
		`/v1/customers/${encodeURIComponent(customerId)}/cards`,
	);
	return Array.isArray(cards) ? cards : (cards.cards ?? []);
}

export async function addMercadoPagoCustomerCard(customerId: string, token: string) {
	return mercadoPagoRequest<MercadoPagoCustomerCard>(
		`/v1/customers/${encodeURIComponent(customerId)}/cards`,
		{
			method: "POST",
			body: JSON.stringify({ token }),
		},
	);
}

export async function removeMercadoPagoCustomerCard(customerId: string, cardId: string) {
	await mercadoPagoRequest<unknown>(
		`/v1/customers/${encodeURIComponent(customerId)}/cards/${encodeURIComponent(cardId)}`,
		{ method: "DELETE" },
	);
}

export type MercadoPagoPaymentValidation = { ok: true } | { ok: false; error: string };

export function validateMercadoPagoPaymentResponse(
	payment: MercadoPagoPaymentResponse,
	expected: { amountInCents: number; currency: string; externalReference: string },
): MercadoPagoPaymentValidation {
	const expectedCurrency = expected.currency.trim().toUpperCase();
	const actualCurrency = payment.currency_id?.trim().toUpperCase();
	if (!actualCurrency || actualCurrency !== expectedCurrency) {
		return { ok: false, error: "Moeda do Mercado Pago divergente do pedido" };
	}

	const actualAmount = payment.transaction_amount;
	const actualAmountInCents =
		typeof actualAmount === "number" && Number.isFinite(actualAmount) ? Math.round(actualAmount * 100) : null;
	if (actualAmountInCents === null || actualAmountInCents !== expected.amountInCents) {
		return { ok: false, error: "Valor do Mercado Pago divergente do pedido" };
	}

	if (payment.external_reference !== expected.externalReference) {
		return { ok: false, error: "Referência do Mercado Pago divergente do pedido" };
	}

	return { ok: true };
}

export function getMercadoPagoNotificationUrl() {
	return `${publicUrl.replace(/\/$/, "")}/api/mercado-pago/webhook`;
}

export function mapMercadoPagoStatus(status?: string | null) {
	switch (status) {
		case "approved":
			return "succeeded";
		case "authorized":
		case "in_process":
		case "pending":
			return "processing";
		case "charged_back":
			return "disputed";
		case "cancelled":
		case "refunded":
		case "rejected":
			return "failed";
		default:
			return status || "unknown";
	}
}

const MERCADO_PAGO_STATUS_DETAIL_MESSAGES: Record<string, string> = {
	cc_rejected_bad_filled_card_number: "Confira o número do cartão.",
	cc_rejected_bad_filled_date: "Confira a validade do cartão.",
	cc_rejected_bad_filled_security_code: "Confira o código de segurança do cartão.",
	cc_rejected_bad_filled_other: "Confira os dados do cartão.",
	cc_rejected_insufficient_amount: "O cartão não tem limite disponível para esta compra.",
	cc_rejected_call_for_authorize: "Autorize a compra com o banco emissor e tente novamente.",
	cc_rejected_card_disabled: "Este cartão está bloqueado. Tente outro cartão.",
	cc_rejected_max_attempts: "O limite de tentativas foi atingido. Tente outro cartão.",
	cc_rejected_high_risk: "Não foi possível aprovar este pagamento. Tente outro cartão.",
	cc_rejected_duplicated_payment:
		"Esta tentativa foi identificada como duplicada. Confira o pedido e tente novamente.",
	cc_rejected_invalid_installments: "Escolha uma quantidade de parcelas válida para este cartão.",
	cc_rejected_card_type_not_allowed: "Este tipo de cartão não é aceito. Tente outro cartão.",
	cc_rejected_other_reason: "O banco emissor recusou o pagamento. Tente outro cartão.",
	cc_rejected_blacklist: "Não foi possível aprovar este pagamento. Tente outro cartão.",
	pending_contingency: "Pagamento em análise. Aguarde a confirmação do Mercado Pago.",
	pending_review_manual: "Pagamento em análise. Aguarde a confirmação do Mercado Pago.",
};

export function normalizeMercadoPagoPaymentOutcome(
	payment: Pick<MercadoPagoPaymentResponse, "status" | "status_detail">,
): MercadoPagoPaymentOutcome {
	const status = mapMercadoPagoStatus(payment.status);
	const detail = payment.status_detail?.trim().toLowerCase() ?? "";

	if (status === "succeeded") return { kind: "approved", message: "Pagamento aprovado.", retryable: false };
	if (status === "processing") {
		return {
			kind: "processing",
			message: "Pagamento em análise. Aguarde a confirmação do Mercado Pago.",
			retryable: false,
		};
	}
	if (status === "failed") {
		if (detail === "cc_rejected_invalid_installments") {
			return {
				kind: "validation_error",
				message: MERCADO_PAGO_STATUS_DETAIL_MESSAGES[detail]!,
				retryable: true,
			};
		}
		return {
			kind: "rejected",
			message:
				MERCADO_PAGO_STATUS_DETAIL_MESSAGES[detail] ??
				"Pagamento recusado. Revise os dados ou tente outro cartão.",
			retryable: true,
		};
	}
	if (status === "unknown") {
		return {
			kind: "unavailable",
			message: "Não foi possível confirmar o pagamento. Tente novamente em alguns instantes.",
			retryable: true,
		};
	}
	return { kind: "unknown", message: "Não foi possível confirmar o pagamento.", retryable: true };
}

export function isMercadoPagoPixPayment(paymentMethodId?: string | null) {
	return paymentMethodId?.trim().toLowerCase() === "pix";
}

export function getMercadoPagoPixPaymentData(
	payment: MercadoPagoPaymentResponse,
): MercadoPagoPixPaymentData | null {
	if (!payment.id || !isMercadoPagoPixPayment(payment.payment_method_id)) return null;
	const transactionData = payment.point_of_interaction?.transaction_data;
	return {
		paymentId: String(payment.id),
		status: mapMercadoPagoStatus(payment.status),
		qrCode: transactionData?.qr_code ?? null,
		qrCodeBase64: transactionData?.qr_code_base64 ?? null,
		ticketUrl: transactionData?.ticket_url ?? null,
		expiresAt: payment.date_of_expiration ?? null,
	};
}

export async function createMercadoPagoPayment(
	body: MercadoPagoCreatePaymentInput,
	idempotencyKey: string,
): Promise<MercadoPagoPaymentResponse> {
	if (!env.MERCADO_PAGO_ACCESS_TOKEN) throw new Error("Mercado Pago não configurado");
	const response = await fetch(`${MERCADO_PAGO_API_BASE_URL}/v1/payments`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`,
			"Content-Type": "application/json",
			"X-Idempotency-Key": idempotencyKey,
		},
		body: JSON.stringify(body),
		cache: "no-store",
	});

	const payload = (await response.json().catch(() => null)) as
		| (MercadoPagoPaymentResponse & { message?: string; error?: string })
		| null;

	if (!response.ok) {
		const message = mercadoPagoError(payload, "Falha ao criar pagamento no Mercado Pago");
		throw new Error(message);
	}

	return payload ?? {};
}

export async function retrieveMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPaymentResponse> {
	if (!env.MERCADO_PAGO_ACCESS_TOKEN) throw new Error("Mercado Pago não configurado");

	const response = await fetch(`${MERCADO_PAGO_API_BASE_URL}/v1/payments/${encodeURIComponent(paymentId)}`, {
		headers: {
			Authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`,
		},
		cache: "no-store",
	});
	const payload = (await response.json().catch(() => null)) as
		| (MercadoPagoPaymentResponse & { message?: string; error?: string })
		| null;

	if (!response.ok) {
		const message = payload?.message || payload?.error || "Falha ao consultar pagamento no Mercado Pago";
		throw new Error(message);
	}

	return payload ?? {};
}

export function validateMercadoPagoWebhookSignature(input: {
	xSignature: string | null;
	xRequestId: string | null;
	dataId: string | null;
	secret?: string | null;
}) {
	if (!input.secret) return false;
	if (!input.xSignature || !input.xRequestId || !input.dataId) return false;

	const parts = Object.fromEntries(
		input.xSignature.split(",").map((part) => {
			const [key, value] = part.trim().split("=");
			return [key, value];
		}),
	);
	const ts = parts.ts;
	const expected = parts.v1;
	if (!ts || !expected) return false;

	const manifest = `id:${input.dataId};request-id:${input.xRequestId};ts:${ts};`;
	const calculated = createHmac("sha256", input.secret).update(manifest).digest("hex");
	const expectedBuffer = Buffer.from(expected, "hex");
	const calculatedBuffer = Buffer.from(calculated, "hex");
	return (
		expectedBuffer.length === calculatedBuffer.length && timingSafeEqual(expectedBuffer, calculatedBuffer)
	);
}
