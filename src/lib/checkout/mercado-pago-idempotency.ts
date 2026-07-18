import { createHash, randomUUID } from "node:crypto";
import type { CheckoutSnapshot } from "@/lib/checkout/cart-snapshot";
import type { CheckoutAddress, CheckoutDeliveryMethod } from "@/lib/shipping-core";

export function buildMercadoPagoPaymentAttemptIdempotencyKey(input: {
	orderId: string;
	checkoutOwnerKey: string;
	cartHash: string;
	amountTotal: number;
	currency: string;
	paymentMethodId?: string | null;
	buyerEmail?: string | null;
	deliveryMethod?: CheckoutDeliveryMethod | null;
	deliveryAddress?: CheckoutAddress | null;
	shippingRate?: CheckoutSnapshot["shippingRate"] | null;
	attemptId?: string;
}) {
	const attemptId = input.attemptId ?? randomUUID();
	const fingerprint = createHash("sha256")
		.update(
			JSON.stringify({
				orderId: input.orderId,
				checkoutOwnerKey: input.checkoutOwnerKey,
				cartHash: input.cartHash,
				amountTotal: input.amountTotal,
				currency: input.currency.toLowerCase(),
				paymentMethodId: input.paymentMethodId?.trim().toLowerCase() ?? null,
				buyerEmail: input.buyerEmail?.trim().toLowerCase() ?? null,
				deliveryMethod: input.deliveryMethod ?? null,
				deliveryPostalCode: input.deliveryAddress?.postalCode?.trim() ?? null,
				shippingAmount: input.shippingRate?.fixed_amount.amount ?? null,
				attemptId,
			}),
		)
		.digest("hex");

	return `mp:${input.orderId}:${fingerprint.slice(0, 24)}:${attemptId}`;
}
