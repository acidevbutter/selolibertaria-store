import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { mapMercadoPagoStatus, validateMercadoPagoWebhookSignature } from "@/lib/mercado-pago";

describe("mapMercadoPagoStatus", () => {
	it("maps Mercado Pago statuses to local checkout statuses", () => {
		expect(mapMercadoPagoStatus("approved")).toBe("succeeded");
		expect(mapMercadoPagoStatus("pending")).toBe("processing");
		expect(mapMercadoPagoStatus("in_process")).toBe("processing");
		expect(mapMercadoPagoStatus("charged_back")).toBe("disputed");
		expect(mapMercadoPagoStatus("rejected")).toBe("failed");
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
