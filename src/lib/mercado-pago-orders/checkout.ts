import "server-only";

import { env } from "@/env.mjs";
import type { OrdersPaymentInput } from "@/lib/mercado-pago-orders/contract";

export type CheckoutOrderResult = {
	providerOrderId: string;
	orderId: string;
	externalReference: string;
	status: "succeeded" | "processing" | "failed";
	providerStatus: string;
	amountInCents: number;
	currency: string;
	paymentMethod: "pix" | "card";
	transaction: {
		id: string;
		status: "succeeded" | "processing" | "failed";
		amountInCents: number;
		currency: string;
		statusDetail?: string | null;
		installments?: number | null;
	};
	pix: {
		qrCode: string;
		qrCodeBase64: string | null;
		ticketUrl: string | null;
		expiresAt: string | null;
	} | null;
	statusDetail?: string | null;
	installments?: number | null;
};

type FastApiOrder = {
	provider_order_id: string;
	external_reference: string;
	status: CheckoutOrderResult["status"];
	provider_status: string;
	transaction_id: string;
	amount_in_cents: number;
	currency: string;
	payment_method: "pix" | "card";
	status_detail: string | null;
	installments: number | null;
	qr_code: string | null;
	qr_code_base64: string | null;
	ticket_url: string | null;
	expires_at: string | null;
};

function toCheckoutResult(order: FastApiOrder): CheckoutOrderResult {
	return {
		providerOrderId: order.provider_order_id,
		orderId: order.external_reference,
		externalReference: order.external_reference,
		status: order.status,
		providerStatus: order.provider_status,
		amountInCents: order.amount_in_cents,
		currency: order.currency,
		paymentMethod: order.payment_method,
		transaction: {
			id: order.transaction_id,
			status: order.status,
			amountInCents: order.amount_in_cents,
			currency: order.currency,
			statusDetail: order.status_detail,
			installments: order.installments,
		},
		pix:
			order.payment_method === "pix"
				? {
						qrCode: order.qr_code ?? "",
						qrCodeBase64: order.qr_code_base64,
						ticketUrl: order.ticket_url,
						expiresAt: order.expires_at,
					}
				: null,
		statusDetail: order.status_detail,
		installments: order.installments,
	};
}

async function request(path: string, options: RequestInit): Promise<FastApiOrder> {
	const response = await fetch(`${env.FASTAPI_API_URL}${path}`, { ...options, cache: "no-store" });
	if (!response.ok) throw new Error("Mercado Pago indisponível");
	return (await response.json()) as FastApiOrder;
}

export async function createCheckoutOrder(input: OrdersPaymentInput): Promise<CheckoutOrderResult> {
	const order = await request("/payments/mercado-pago/orders", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			order_id: input.orderId,
			external_reference: input.externalReference,
			amount_in_cents: input.amountInCents,
			currency: input.currency,
			payer_email: input.payer.email,
			payment_method: input.paymentMethod,
			idempotency_key: input.idempotencyKey,
		}),
	});
	return toCheckoutResult(order);
}

export async function retrieveCheckoutOrder(input: {
	providerOrderId: string;
	expected: Pick<OrdersPaymentInput, "externalReference" | "amountInCents" | "currency">;
}): Promise<CheckoutOrderResult> {
	const order = toCheckoutResult(
		await request(`/payments/mercado-pago/orders/${encodeURIComponent(input.providerOrderId)}`, {}),
	);
	if (
		order.externalReference !== input.expected.externalReference ||
		order.amountInCents !== input.expected.amountInCents ||
		order.currency.toUpperCase() !== input.expected.currency.toUpperCase()
	) {
		throw new Error("A order externa diverge do pedido interno.");
	}
	return order;
}
