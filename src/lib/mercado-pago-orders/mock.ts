import {
	assertOrdersIntegrity,
	type OrdersApiClient,
	OrdersApiError,
	type OrdersCancelInput,
	type OrdersPaymentInput,
	type OrdersPaymentResult,
	type OrdersPaymentStatus,
	type OrdersRefundInput,
	type OrdersSearchInput,
	type OrdersWebhookEvent,
} from "@/lib/mercado-pago-orders/contract";

export type OrdersMockScenario =
	| "pix_pending"
	| "pix_approved"
	| "pix_expired"
	| "pix_cancelled"
	| "card_approved"
	| "card_pending"
	| "card_declined"
	| "technical_failure"
	| "timeout_retry";

export const ORDERS_MOCK_SCENARIOS: Record<OrdersMockScenario, { status: OrdersPaymentStatus }> = {
	pix_pending: { status: "pending" },
	pix_approved: { status: "approved" },
	pix_expired: { status: "expired" },
	pix_cancelled: { status: "cancelled" },
	card_approved: { status: "approved" },
	card_pending: { status: "pending" },
	card_declined: { status: "declined" },
	technical_failure: { status: "failed" },
	timeout_retry: { status: "approved" },
};

type StoredOrder = OrdersPaymentResult & { input: OrdersPaymentInput; events: Set<string> };

function cloneResult(order: StoredOrder): OrdersPaymentResult {
	return {
		providerOrderId: order.providerOrderId,
		orderId: order.orderId,
		externalReference: order.externalReference,
		status: order.status,
		amountInCents: order.amountInCents,
		currency: order.currency,
		paymentMethod: order.paymentMethod,
		transaction: { ...order.transaction },
		pix: order.pix ? { ...order.pix } : null,
	};
}

export class MockOrdersApiClient implements OrdersApiClient {
	private readonly orders = new Map<string, StoredOrder>();
	private readonly idempotency = new Map<string, OrdersPaymentResult>();
	private readonly attempts = new Map<string, number>();

	async createOrder(input: OrdersPaymentInput) {
		const previous = this.idempotency.get(input.idempotencyKey);
		if (previous) return structuredClone(previous);

		const scenario =
			(input.metadata?.mockScenario as OrdersMockScenario | undefined) ??
			(input.paymentMethod.type === "pix" ? "pix_pending" : "card_approved");
		if (!(scenario in ORDERS_MOCK_SCENARIOS)) {
			throw new OrdersApiError("provider_error", `Cenário mock inválido: ${scenario}`);
		}

		const attempts = (this.attempts.get(input.idempotencyKey) ?? 0) + 1;
		this.attempts.set(input.idempotencyKey, attempts);
		if (scenario === "timeout_retry" && attempts === 1) {
			throw new OrdersApiError("timeout", "Timeout transitório ao criar a order.", true);
		}
		if (scenario === "technical_failure") {
			throw new OrdersApiError("provider_error", "Falha técnica simulada no provedor.", true);
		}

		const status = ORDERS_MOCK_SCENARIOS[scenario].status;
		const result: StoredOrder = {
			providerOrderId: `mock_order_${input.orderId}`,
			orderId: input.orderId,
			externalReference: input.externalReference,
			status,
			amountInCents: input.amountInCents,
			currency: input.currency.toUpperCase(),
			paymentMethod: input.paymentMethod.type,
			transaction: {
				id: `mock_transaction_${input.orderId}`,
				status,
				amountInCents: input.amountInCents,
				currency: input.currency.toUpperCase(),
			},
			pix:
				input.paymentMethod.type === "pix"
					? {
							qrCode: `000201mock${input.orderId}`,
							qrCodeBase64: "mock-qr-code",
							ticketUrl: "https://example.test/mock-pix",
							expiresAt: "2030-01-01T00:00:00.000Z",
						}
					: null,
			input,
			events: new Set(),
		};
		this.orders.set(result.providerOrderId, result);
		const publicResult = cloneResult(result);
		this.idempotency.set(input.idempotencyKey, publicResult);
		return publicResult;
	}

	async getOrder(providerOrderId: string) {
		const order = this.orders.get(providerOrderId);
		if (!order) throw new OrdersApiError("not_found", "Order mock não encontrada.");
		return cloneResult(order);
	}

	async cancelOrder(input: OrdersCancelInput) {
		const order = this.getStoredOrder(input.providerOrderId);
		if (order.status === "cancelled") return cloneResult(order);
		if (order.status !== "pending") {
			throw new OrdersApiError("not_cancelable", "A order não está elegível para cancelamento.");
		}
		this.setStatus(order, "cancelled");
		return cloneResult(order);
	}

	async refundOrder(input: OrdersRefundInput) {
		const order = this.getStoredOrder(input.providerOrderId);
		if (order.status === "refunded") return cloneResult(order);
		if (order.status !== "approved") {
			throw new OrdersApiError("not_refundable", "A order não está elegível para estorno.");
		}
		if (input.amountInCents !== undefined && input.amountInCents !== order.amountInCents) {
			throw new OrdersApiError("integrity_mismatch", "O valor do estorno diverge do valor aprovado.");
		}
		this.setStatus(order, "refunded");
		return cloneResult(order);
	}

	async searchOrders(input: OrdersSearchInput) {
		return [...this.orders.values()]
			.filter((order) => !input.externalReference || order.externalReference === input.externalReference)
			.filter((order) => !input.status || order.status === input.status)
			.map(cloneResult);
	}

	async reconcileWebhook(event: OrdersWebhookEvent) {
		const order = this.getStoredOrder(event.providerOrderId);
		if (order.events.has(event.eventId)) return cloneResult(order);
		assertOrdersIntegrity(order, {
			externalReference: event.externalReference,
			amountInCents: event.amountInCents,
			currency: event.currency,
		});
		if (event.orderId !== order.orderId || event.transactionId !== order.transaction.id) {
			throw new OrdersApiError("integrity_mismatch", "O evento não pertence à order mock.");
		}
		order.events.add(event.eventId);
		this.setStatus(order, event.status);
		return cloneResult(order);
	}

	private getStoredOrder(providerOrderId: string) {
		const order = this.orders.get(providerOrderId);
		if (!order) throw new OrdersApiError("not_found", "Order mock não encontrada.");
		return order;
	}

	private setStatus(order: StoredOrder, status: OrdersPaymentStatus) {
		order.status = status;
		order.transaction.status = status;
		for (const [key, result] of this.idempotency) {
			if (result.providerOrderId === order.providerOrderId) this.idempotency.set(key, cloneResult(order));
		}
	}
}
