import type { OrderResponse } from "mercadopago/dist/clients/order/commonTypes";
import type { CreateOrderRequest } from "mercadopago/dist/clients/order/create/types";
import type { RefundRequest } from "mercadopago/dist/clients/order/refund/types";
import type { OrderSearchData, OrderSearchResponse } from "mercadopago/dist/clients/order/search/types";
import type { Options } from "mercadopago/dist/types";
import {
	assertOrdersIntegrity,
	type OrdersApiClient,
	OrdersApiError,
	type OrdersCancelInput,
	type OrdersPaymentInput,
	type OrdersPaymentMethodType,
	type OrdersPaymentResult,
	type OrdersRefundInput,
	type OrdersSearchInput,
	type OrdersWebhookEvent,
} from "@/lib/mercado-pago-orders/contract";

export type MercadoPagoOrderSdk = {
	create(input: { body: CreateOrderRequest; requestOptions?: Options }): Promise<OrderResponse>;
	get(input: { id: string; requestOptions?: Options }): Promise<OrderResponse>;
	cancel(input: { id: string; requestOptions?: Options }): Promise<OrderResponse>;
	refund(input: { id: string; body?: RefundRequest; requestOptions?: Options }): Promise<OrderResponse>;
	search(input?: OrderSearchData): Promise<OrderSearchResponse>;
};

export interface OrdersAdapterLog {
	operation: "create" | "get" | "cancel" | "refund" | "search" | "reconcile";
	status: "success" | "error";
	orderId?: string;
	providerOrderId?: string;
	providerStatus?: string;
	errorCode?: OrdersApiError["code"];
	durationMs: number;
}

export type OrdersAdapterLogger = (entry: OrdersAdapterLog) => void;

const DEFAULT_TIMEOUT_MS = 8000;

function centsToDecimal(amountInCents: number) {
	if (!Number.isInteger(amountInCents) || amountInCents <= 0) {
		throw new OrdersApiError("provider_error", "O valor da order precisa ser positivo em centavos.");
	}
	return (amountInCents / 100).toFixed(2);
}

function decimalToCents(value?: string | null) {
	const amount = Number(value);
	if (!Number.isFinite(amount) || amount < 0) return null;
	return Math.round(amount * 100);
}

function required(value: string | undefined, label: string) {
	if (!value?.trim()) throw new OrdersApiError("provider_error", `A resposta não contém ${label}.`);
	return value;
}

function normalizeStatus(status?: string | null) {
	switch (status?.trim().toLowerCase()) {
		case "created":
		case "action_required":
		case "pending":
		case "processing":
		case "in_process":
		case "in_review":
			return "pending" as const;
		case "processed":
		case "approved":
		case "paid":
			return "approved" as const;
		case "expired":
			return "expired" as const;
		case "cancelled":
		case "canceled":
			return "cancelled" as const;
		case "rejected":
		case "declined":
			return "declined" as const;
		case "failed":
			return "failed" as const;
		case "refunded":
		case "partially_refunded":
			return "refunded" as const;
		default:
			throw new OrdersApiError("provider_error", `Status de order não suportado: ${status ?? "ausente"}.`);
	}
}

function normalizePaymentMethod(id?: string, type?: string): OrdersPaymentMethodType {
	const normalizedId = id?.trim().toLowerCase();
	const normalizedType = type?.trim().toLowerCase();
	if (normalizedId === "pix" || normalizedType === "bank_transfer") return "pix";
	if (normalizedType?.includes("card") || normalizedId) return "card";
	throw new OrdersApiError("provider_error", "Método de pagamento ausente na resposta.");
}

function mapResponse(response: OrderResponse): OrdersPaymentResult {
	const providerOrderId = required(response.id, "o id da order");
	const externalReference = required(response.external_reference, "a external_reference");
	const payment = response.transactions?.payments?.[0];
	const transactionId = required(payment?.id, "o id da transação");
	const amountInCents = decimalToCents(payment?.amount ?? response.total_amount);
	const currency = response.currency?.trim().toUpperCase();
	if (amountInCents === null || !currency) {
		throw new OrdersApiError("provider_error", "A resposta não contém valor ou moeda válidos.");
	}
	const paymentMethod = normalizePaymentMethod(payment?.payment_method?.id, payment?.payment_method?.type);
	const status = normalizeStatus(payment?.status ?? response.status);
	const paymentMethodData = payment?.payment_method;
	const statusDetail = payment?.status_detail ?? response.status_detail ?? null;
	const installments = paymentMethodData?.installments ?? null;

	return {
		providerOrderId,
		orderId: externalReference,
		externalReference,
		status,
		amountInCents,
		currency,
		paymentMethod,
		transaction: {
			id: transactionId,
			status,
			amountInCents,
			currency,
			statusDetail,
			installments,
		},
		statusDetail,
		installments,
		pix:
			paymentMethod === "pix"
				? {
						qrCode: paymentMethodData?.qr_code ?? "",
						qrCodeBase64: paymentMethodData?.qr_code_base64 ?? null,
						ticketUrl: paymentMethodData?.ticket_url ?? null,
						expiresAt: payment?.date_of_expiration ?? response.expiration_time ?? null,
					}
				: null,
	};
}

function normalizeError(operation: string, error: unknown) {
	if (error instanceof OrdersApiError) return error;
	const candidate = error as {
		name?: string;
		status?: number;
		statusCode?: number;
		api_response?: { status?: number };
	};
	const status = candidate.status ?? candidate.statusCode ?? candidate.api_response?.status;
	const retryable =
		candidate.name === "AbortError" || status === 408 || status === 429 || (status ?? 0) >= 500;
	return new OrdersApiError(
		retryable ? "timeout" : "provider_error",
		`Falha ao ${operation} order${status ? ` (HTTP ${status})` : ""}.`,
		retryable,
	);
}

export class MercadoPagoOrdersSdkClient implements OrdersApiClient {
	constructor(
		private readonly sdk: MercadoPagoOrderSdk,
		private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
		private readonly logger?: OrdersAdapterLogger,
	) {}

	createOrder(input: OrdersPaymentInput) {
		const body: CreateOrderRequest = {
			type: "online",
			processing_mode: "automatic",
			total_amount: centsToDecimal(input.amountInCents),
			external_reference: input.externalReference,
			payer: { email: input.payer.email },
			transactions: {
				payments: [
					{
						amount: centsToDecimal(input.amountInCents),
						payment_method:
							input.paymentMethod.type === "pix"
								? { id: "pix", type: "bank_transfer" }
								: {
										id: input.paymentMethod.id ?? undefined,
										type: "credit_card",
										token: input.paymentMethod.token ?? undefined,
										installments: input.paymentMethod.installments ?? undefined,
									},
					},
				],
			},
		};
		return this.run("create", input.orderId, () =>
			this.sdk.create({
				body,
				requestOptions: { timeout: this.timeoutMs, idempotencyKey: input.idempotencyKey },
			}),
		);
	}

	getOrder(providerOrderId: string) {
		return this.run("get", undefined, () =>
			this.sdk.get({ id: providerOrderId, requestOptions: { timeout: this.timeoutMs } }),
		);
	}

	cancelOrder(input: OrdersCancelInput) {
		return this.run("cancel", undefined, () =>
			this.sdk.cancel({
				id: input.providerOrderId,
				requestOptions: { timeout: this.timeoutMs, idempotencyKey: input.idempotencyKey },
			}),
		);
	}

	async refundOrder(input: OrdersRefundInput) {
		let body: RefundRequest | undefined;
		if (input.amountInCents !== undefined) {
			const current = await this.getOrder(input.providerOrderId);
			body = { transactions: [{ id: current.transaction.id, amount: centsToDecimal(input.amountInCents) }] };
		}
		return this.run("refund", undefined, () =>
			this.sdk.refund({
				id: input.providerOrderId,
				body,
				requestOptions: { timeout: this.timeoutMs, idempotencyKey: input.idempotencyKey },
			}),
		);
	}

	async searchOrders(input: OrdersSearchInput) {
		const startedAt = Date.now();
		try {
			const response = await this.sdk.search({
				options: {
					begin_date: input.beginDate,
					end_date: input.endDate,
					external_reference: input.externalReference,
					status: input.status,
					page: input.page,
					page_size: input.pageSize,
				},
				requestOptions: { timeout: this.timeoutMs },
			});
			const results = (response.data ?? []).map(mapResponse);
			this.logger?.({ operation: "search", status: "success", durationMs: Date.now() - startedAt });
			return results;
		} catch (error) {
			const normalized = normalizeError("buscar", error);
			this.logger?.({
				operation: "search",
				status: "error",
				errorCode: normalized.code,
				durationMs: Date.now() - startedAt,
			});
			throw normalized;
		}
	}

	async reconcileWebhook(event: OrdersWebhookEvent) {
		const result = await this.run("reconcile", event.orderId, () =>
			this.sdk.get({ id: event.providerOrderId, requestOptions: { timeout: this.timeoutMs } }),
		);
		assertOrdersIntegrity(result, event);
		if (result.orderId !== event.orderId || result.transaction.id !== event.transactionId) {
			throw new OrdersApiError("integrity_mismatch", "O webhook não pertence à order interna.");
		}
		return result;
	}

	private async run<T extends OrderResponse>(
		operation: OrdersAdapterLog["operation"],
		orderId: string | undefined,
		action: () => Promise<T>,
	) {
		const startedAt = Date.now();
		try {
			const response = mapResponse(await action());
			this.logger?.({
				operation,
				status: "success",
				orderId,
				providerOrderId: response.providerOrderId,
				providerStatus: response.status,
				durationMs: Date.now() - startedAt,
			});
			return response;
		} catch (error) {
			const normalized = normalizeError(operation, error);
			this.logger?.({
				operation,
				status: "error",
				orderId,
				errorCode: normalized.code,
				durationMs: Date.now() - startedAt,
			});
			throw normalized;
		}
	}
}
