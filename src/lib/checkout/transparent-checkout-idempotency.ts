import { createHash } from "node:crypto";
import type { CheckoutSnapshot } from "@/lib/checkout/cart-snapshot";
import type { CheckoutAddress, CheckoutDeliveryMethod } from "@/lib/shipping-core";

export function buildTransparentCheckoutIdempotencyKey(input: {
	checkoutOwnerKey: string;
	cartHash: string;
	amountTotal: number;
	currency: string;
	customer?: string | null;
	receiptEmail?: string | null;
	couponCode?: string | null;
	deliveryMethod: CheckoutDeliveryMethod;
	deliveryAddress?: CheckoutAddress | null;
	shippingRate?: CheckoutSnapshot["shippingRate"] | null;
}) {
	const fingerprint = createHash("sha256")
		.update(
			JSON.stringify({
				amountTotal: input.amountTotal,
				currency: input.currency.toLowerCase(),
				customer: input.customer ?? null,
				receiptEmail: input.receiptEmail?.trim().toLowerCase() ?? null,
				couponCode: input.couponCode?.trim() ?? null,
				deliveryMethod: input.deliveryMethod,
				deliveryCountry: input.deliveryAddress?.country?.trim().toUpperCase() ?? null,
				deliveryPostalCode: input.deliveryAddress?.postalCode?.trim() ?? null,
				shippingProviderCode: input.shippingRate?.providerCode ?? null,
				shippingServiceCode: input.shippingRate?.serviceCode ?? null,
				shippingAmount: input.shippingRate?.fixed_amount.amount ?? null,
			}),
		)
		.digest("hex");

	return `transparent-checkout:${input.checkoutOwnerKey}:${input.cartHash}:${fingerprint.slice(0, 24)}`;
}
