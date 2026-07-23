export type OrdersPaymentMethodType = "pix" | "card";

export type OrdersPaymentStatus =
	| "pending"
	| "approved"
	| "expired"
	| "cancelled"
	| "declined"
	| "failed"
	| "refunded";

export type OrdersErrorCode =
	| "timeout"
	| "not_found"
	| "not_cancelable"
	| "not_refundable"
	| "integrity_mismatch"
	| "provider_error";

export interface OrdersPaymentInput {
	orderId: string;
	externalReference: string;
	amountInCents: number;
	currency: string;
	payer: { email: string; userId?: string | null };
	paymentMethod: {
		type: OrdersPaymentMethodType;
		id?: string | null;
		token?: string | null;
		installments?: number | null;
	};
	idempotencyKey: string;
	metadata?: Readonly<Record<string, string>>;
}

export interface OrdersPixData {
	qrCode: string;
	qrCodeBase64: string | null;
	ticketUrl: string | null;
	expiresAt: string | null;
}

export interface OrdersTransaction {
	id: string;
	status: OrdersPaymentStatus;
	amountInCents: number;
	currency: string;
}

export interface OrdersPaymentResult {
	providerOrderId: string;
	orderId: string;
	externalReference: string;
	status: OrdersPaymentStatus;
	amountInCents: number;
	currency: string;
	paymentMethod: OrdersPaymentMethodType;
	transaction: OrdersTransaction;
	pix: OrdersPixData | null;
}

export interface OrdersWebhookEvent {
	eventId: string;
	providerOrderId: string;
	orderId: string;
	externalReference: string;
	status: OrdersPaymentStatus;
	amountInCents: number;
	currency: string;
	transactionId: string;
}

export interface OrdersCancelInput {
	providerOrderId: string;
	idempotencyKey: string;
}

export interface OrdersRefundInput {
	providerOrderId: string;
	amountInCents?: number;
	idempotencyKey: string;
}

export interface OrdersApiClient {
	createOrder(input: OrdersPaymentInput): Promise<OrdersPaymentResult>;
	getOrder(providerOrderId: string): Promise<OrdersPaymentResult>;
	cancelOrder(input: OrdersCancelInput): Promise<OrdersPaymentResult>;
	refundOrder(input: OrdersRefundInput): Promise<OrdersPaymentResult>;
	reconcileWebhook(event: OrdersWebhookEvent): Promise<OrdersPaymentResult>;
}

export class OrdersApiError extends Error {
	readonly code: OrdersErrorCode;
	readonly retryable: boolean;

	constructor(code: OrdersErrorCode, message: string, retryable = false) {
		super(message);
		this.name = "OrdersApiError";
		this.code = code;
		this.retryable = retryable;
	}
}

export function assertOrdersIntegrity(
	result: Pick<OrdersPaymentResult, "externalReference" | "amountInCents" | "currency">,
	expected: Pick<OrdersPaymentInput, "externalReference" | "amountInCents" | "currency">,
) {
	if (
		result.externalReference !== expected.externalReference ||
		result.amountInCents !== expected.amountInCents ||
		result.currency.toUpperCase() !== expected.currency.toUpperCase()
	) {
		throw new OrdersApiError("integrity_mismatch", "A order externa diverge do pedido interno.");
	}
}
