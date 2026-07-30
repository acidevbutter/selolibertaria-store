import "server-only";

import { MercadoPagoConfig, Order } from "mercadopago";
import { env } from "@/env.mjs";
import { type OrdersApiClient, OrdersApiError } from "@/lib/mercado-pago-orders/contract";
import { logMercadoPagoOrders } from "@/lib/mercado-pago-orders/observability";
import {
	type MercadoPagoOrderSdk,
	MercadoPagoOrdersSdkClient,
	type OrdersAdapterLogger,
} from "@/lib/mercado-pago-orders/sdk-client";

const DEFAULT_TIMEOUT_MS = 8000;

export function createMercadoPagoOrdersClient(options?: {
	accessToken?: string;
	timeoutMs?: number;
	logger?: OrdersAdapterLogger;
	sdk?: MercadoPagoOrderSdk;
}): OrdersApiClient {
	const accessToken = options?.accessToken ?? env.MERCADO_PAGO_ACCESS_TOKEN;
	if (!accessToken) throw new OrdersApiError("provider_error", "Mercado Pago não configurado.");
	const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const sdk =
		options?.sdk ?? new Order(new MercadoPagoConfig({ accessToken, options: { timeout: timeoutMs } }));
	return new MercadoPagoOrdersSdkClient(sdk, timeoutMs, options?.logger ?? logMercadoPagoOrders);
}
