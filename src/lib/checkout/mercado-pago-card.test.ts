import { describe, expect, it } from "vitest";
import {
	normalizeMercadoPagoInstallments,
	resolveMercadoPagoCardPaymentMethod,
} from "@/lib/checkout/mercado-pago-card";

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

	it("normaliza parcelas retornadas pelo Mercado Pago", () => {
		expect(
			normalizeMercadoPagoInstallments([
				{ installments: 1, recommended_message: "1x de R$ 42,00" },
				{ installments: 2, recommended_message: "2x de R$ 21,00" },
				{ installments: 2, recommended_message: "duplicada" },
			]),
		).toEqual([
			{ value: "1", label: "1x de R$ 42,00" },
			{ value: "2", label: "2x de R$ 21,00" },
		]);
	});
});
