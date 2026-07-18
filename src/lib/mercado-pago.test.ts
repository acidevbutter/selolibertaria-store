import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
	getMercadoPagoPixPaymentData,
	isMercadoPagoPixPayment,
	mapMercadoPagoStatus,
	validateMercadoPagoPaymentResponse,
	validateMercadoPagoWebhookSignature,
} from "@/lib/mercado-pago";

describe("mapMercadoPagoStatus", () => {
	it("maps Mercado Pago statuses to local checkout statuses", () => {
		expect(mapMercadoPagoStatus("approved")).toBe("succeeded");
		expect(mapMercadoPagoStatus("pending")).toBe("processing");
		expect(mapMercadoPagoStatus("in_process")).toBe("processing");
		expect(mapMercadoPagoStatus("charged_back")).toBe("disputed");
		expect(mapMercadoPagoStatus("cancelled")).toBe("failed");
		expect(mapMercadoPagoStatus("rejected")).toBe("failed");
	});
});

describe("isMercadoPagoPixPayment", () => {
	it("recognizes the Pix payment method without accepting card-like IDs", () => {
		expect(isMercadoPagoPixPayment("pix")).toBe(true);
		expect(isMercadoPagoPixPayment("visa")).toBe(false);
	});
});

describe("getMercadoPagoPixPaymentData", () => {
	it("exposes only the Pix data needed to resume a pending checkout", () => {
		expect(
			getMercadoPagoPixPaymentData({
				id: 123,
				status: "pending",
				payment_method_id: "pix",
				date_of_expiration: "2026-07-19T12:00:00.000Z",
				point_of_interaction: {
					transaction_data: {
						qr_code: "pix-copy-paste",
						qr_code_base64: "base64-png",
						ticket_url: "https://mercadopago.example/pix",
					},
				},
			}),
		).toEqual({
			paymentId: "123",
			status: "processing",
			qrCode: "pix-copy-paste",
			qrCodeBase64: "base64-png",
			ticketUrl: "https://mercadopago.example/pix",
			expiresAt: "2026-07-19T12:00:00.000Z",
		});
	});

	it("does not expose card payment data as Pix", () => {
		expect(getMercadoPagoPixPaymentData({ id: 123, payment_method_id: "visa" })).toBeNull();
	});

	it("keeps the expiration data when Mercado Pago reports a terminal Pix state", () => {
		expect(
			getMercadoPagoPixPaymentData({
				id: 123,
				status: "cancelled",
				payment_method_id: "pix",
				date_of_expiration: "2026-07-19T12:00:00.000Z",
			}),
		).toMatchObject({ status: "failed", expiresAt: "2026-07-19T12:00:00.000Z" });
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

describe("validateMercadoPagoPaymentResponse", () => {
	const expected = { amountInCents: 4200, currency: "BRL", externalReference: "ord_test" };

	it("accepts the authenticated provider contract", () => {
		expect(
			validateMercadoPagoPaymentResponse(
				{ transaction_amount: 42, currency_id: "BRL", external_reference: "ord_test" },
				expected,
			),
		).toEqual({ ok: true });
	});

	it.each([
		["amount", { transaction_amount: 41.99, currency_id: "BRL", external_reference: "ord_test" }],
		["currency", { transaction_amount: 42, currency_id: "USD", external_reference: "ord_test" }],
		["reference", { transaction_amount: 42, currency_id: "BRL", external_reference: "ord_other" }],
	])("rejects a divergent %s", (_field, payment) => {
		expect(validateMercadoPagoPaymentResponse(payment, expected)).toMatchObject({ ok: false });
	});

	it("does not accept missing provider fields", () => {
		expect(validateMercadoPagoPaymentResponse({}, expected)).toMatchObject({ ok: false });
	});
});
