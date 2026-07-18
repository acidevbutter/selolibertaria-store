import { describe, expect, it } from "vitest";
import { resolveMercadoPagoCardPaymentMethod } from "@/lib/checkout/mercado-pago-card";

describe("resolveMercadoPagoCardPaymentMethod", () => {
	it("seleciona o método de cartão resolvido pelo BIN", () => {
		expect(
			resolveMercadoPagoCardPaymentMethod([
				{ id: "pix", payment_type_id: "bank_transfer" },
				{ id: "master", payment_type_id: "credit_card" },
			]),
		).toBe("master");
	});

	it("rejeita resposta sem método de cartão", () => {
		expect(
			resolveMercadoPagoCardPaymentMethod([{ id: "pix", payment_type_id: "bank_transfer" }]),
		).toBeUndefined();
	});
});
