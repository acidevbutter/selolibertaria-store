import { describe, expect, it } from "vitest";
import { buildTransparentCheckoutIdempotencyKey } from "@/lib/checkout/transparent-checkout-idempotency";

describe("buildTransparentCheckoutIdempotencyKey", () => {
	it("keeps the same key for the same checkout create parameters", () => {
		const first = buildTransparentCheckoutIdempotencyKey({
			checkoutOwnerKey: "guest",
			cartHash: "cart_hash",
			amountTotal: 5000,
			currency: "BRL",
			customer: null,
			receiptEmail: "leitora@selo.com",
			couponCode: "CUPOM10",
			deliveryMethod: "new-address",
			deliveryAddress: {
				line1: "Rua A",
				line2: "",
				number: "10",
				complement: "",
				district: "Centro",
				city: "Brasilia",
				state: "DF",
				postalCode: "71015-210",
				country: "BR",
			},
			shippingRate: {
				providerCode: "melhorenvio",
				providerLabel: "Melhor Envio",
				serviceCode: "2",
				serviceName: "SEDEX",
				fixed_amount: { amount: 1990 },
				estimated_days: 4,
			},
		});

		const second = buildTransparentCheckoutIdempotencyKey({
			checkoutOwnerKey: "guest",
			cartHash: "cart_hash",
			amountTotal: 5000,
			currency: "BRL",
			customer: null,
			receiptEmail: "leitora@selo.com",
			couponCode: "CUPOM10",
			deliveryMethod: "new-address",
			deliveryAddress: {
				line1: "Rua A",
				line2: "",
				number: "10",
				complement: "",
				district: "Centro",
				city: "Brasilia",
				state: "DF",
				postalCode: "71015-210",
				country: "BR",
			},
			shippingRate: {
				providerCode: "melhorenvio",
				providerLabel: "Melhor Envio",
				serviceCode: "2",
				serviceName: "SEDEX",
				fixed_amount: { amount: 1990 },
				estimated_days: 4,
			},
		});

		expect(first).toBe(second);
	});

	it("changes the key when the checkout create parameters change", () => {
		const base = buildTransparentCheckoutIdempotencyKey({
			checkoutOwnerKey: "guest",
			cartHash: "cart_hash",
			amountTotal: 5000,
			currency: "BRL",
			customer: null,
			receiptEmail: "leitora@selo.com",
			couponCode: null,
			deliveryMethod: "pickup",
			deliveryAddress: null,
			shippingRate: null,
		});

		const changedAmount = buildTransparentCheckoutIdempotencyKey({
			checkoutOwnerKey: "guest",
			cartHash: "cart_hash",
			amountTotal: 6990,
			currency: "BRL",
			customer: null,
			receiptEmail: "leitora@selo.com",
			couponCode: null,
			deliveryMethod: "new-address",
			deliveryAddress: {
				line1: "Rua A",
				line2: "",
				number: "10",
				complement: "",
				district: "Centro",
				city: "Brasilia",
				state: "DF",
				postalCode: "71015-210",
				country: "BR",
			},
			shippingRate: {
				providerCode: "melhorenvio",
				providerLabel: "Melhor Envio",
				serviceCode: "2",
				serviceName: "SEDEX",
				fixed_amount: { amount: 1990 },
				estimated_days: 4,
			},
		});

		expect(base).not.toBe(changedAmount);
	});
});
