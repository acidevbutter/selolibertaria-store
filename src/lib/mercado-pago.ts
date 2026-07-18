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
		const message = payload?.message || payload?.error || "Falha ao criar pagamento no Mercado Pago";
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
	if (!input.secret) return true;
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
