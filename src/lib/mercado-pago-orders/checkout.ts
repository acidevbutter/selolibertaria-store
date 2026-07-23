import "server-only";

import {
	assertOrdersIntegrity,
	type OrdersPaymentInput,
	type OrdersPaymentResult,
} from "@/lib/mercado-pago-orders/contract";
import { createMercadoPagoOrdersClient } from "@/lib/mercado-pago-orders/server-client";

export type CheckoutOrderResult = Omit<OrdersPaymentResult, "status"> & {
	status: "succeeded" | "processing" | "failed";
	providerStatus: OrdersPaymentResult["status"];
};

function mapCheckoutStatus(status: OrdersPaymentResult["status"]): CheckoutOrderResult["status"] {
	if (status === "approved") return "succeeded";
	if (status === "pending") return "processing";
	return "failed";
}

function toCheckoutResult(result: OrdersPaymentResult): CheckoutOrderResult {
	return { ...result, status: mapCheckoutStatus(result.status), providerStatus: result.status };
}

export async function createCheckoutOrder(input: OrdersPaymentInput): Promise<CheckoutOrderResult> {
	const result = await createMercadoPagoOrdersClient().createOrder(input);
	assertOrdersIntegrity(result, input);
	return toCheckoutResult(result);
}

export async function retrieveCheckoutOrder(input: {
	providerOrderId: string;
	expected: Pick<OrdersPaymentInput, "externalReference" | "amountInCents" | "currency">;
}): Promise<CheckoutOrderResult> {
	const result = await createMercadoPagoOrdersClient().getOrder(input.providerOrderId);
	assertOrdersIntegrity(result, input.expected);
	return toCheckoutResult(result);
}
