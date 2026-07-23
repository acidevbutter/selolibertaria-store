import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
	isMercadoPagoPixPayment,
	mapMercadoPagoSavedCard,
	validateMercadoPagoWebhookSignature,
} from "@/lib/mercado-pago";

describe("mapMercadoPagoSavedCard", () => {
	it("returns only masked provider data and never exposes the provider token", () => {
		const result = mapMercadoPagoSavedCard({
			id: "card-1",
			token: "sensitive-provider-token",
			last_four_digits: "4242",
			expiration_month: 12,
			expiration_year: 2030,
			payment_method: { id: "visa", name: "Visa" },
		});

		expect(result).toEqual({
			id: "card-1",
			brand: "Visa",
			lastFourDigits: "4242",
			expirationMonth: 12,
			expirationYear: 2030,
		});
		expect(JSON.stringify(result)).not.toContain("sensitive-provider-token");
	});
});

describe("isMercadoPagoPixPayment", () => {
	it("recognizes the Pix payment method without accepting card-like IDs", () => {
		expect(isMercadoPagoPixPayment("pix")).toBe(true);
		expect(isMercadoPagoPixPayment("visa")).toBe(false);
	});
});

describe("validateMercadoPagoWebhookSignature", () => {
	it("validates x-signature using data id, request id and timestamp", () => {
		const secret = "webhook-secret";
		const dataId = "123456";
		const requestId = "request-1";
		const ts = "1781009491";
		const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
		const signature = createHmac("sha256", secret).update(manifest).digest("hex");

		expect(
			validateMercadoPagoWebhookSignature({
				xSignature: `ts=${ts},v1=${signature}`,
				xRequestId: requestId,
				dataId,
				secret,
			}),
		).toBe(true);
	});

	it("rejects invalid signatures when a webhook secret is configured", () => {
		expect(
			validateMercadoPagoWebhookSignature({
				xSignature: "ts=1781009491,v1=bad",
				xRequestId: "request-1",
				dataId: "123456",
				secret: "webhook-secret",
			}),
		).toBe(false);
	});
});
