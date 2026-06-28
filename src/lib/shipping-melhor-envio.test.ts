import { afterEach, describe, expect, it, vi } from "vitest";
import { toShippingRate } from "@/lib/shipping-core";
import {
	buildMelhorEnvioQuoteRequest,
	fetchMelhorEnvioQuotes,
	normalizeMelhorEnvioQuoteResponse,
} from "@/lib/shipping-melhor-envio";

const baseInput = {
	providerCode: "melhor-envio",
	providerLabel: "Melhor Envio",
	originPostalCode: "01001-000",
	destinationPostalCode: "20040-020",
	package: {
		heightCm: 20,
		widthCm: 15,
		lengthCm: 30,
		weightGrams: 750,
	},
	declaredValueCents: 19990,
	accessToken: "token-123",
	userAgent: "Selo Libertaria (tech@example.com)",
	currency: "BRL",
} as const;

describe("shipping-melhor-envio", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("builds a Melhor Envio request with BR postal codes, kilograms and declared value in BRL", () => {
		const quotedAt = "2026-06-28T12:00:00.000Z";
		const request = buildMelhorEnvioQuoteRequest({
			...baseInput,
			environment: "sandbox",
			quotedAt,
		});
		const headers = new Headers(request.init.headers);
		const body = JSON.parse(String(request.init.body)) as {
			from: { postal_code: string };
			to: { postal_code: string };
			volumes: Array<{
				height: number;
				width: number;
				length: number;
				weight: number;
				insurance: number;
			}>;
		};

		expect(request.url).toBe("https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate");
		expect(request.quotedAt).toBe(quotedAt);
		expect(headers.get("authorization")).toBe("Bearer token-123");
		expect(headers.get("user-agent")).toBe("Selo Libertaria (tech@example.com)");
		expect(body).toEqual({
			from: { postal_code: "01001000" },
			to: { postal_code: "20040020" },
			volumes: [
				{
					height: 20,
					width: 15,
					length: 30,
					weight: 0.75,
					insurance: 199.9,
				},
			],
		});
	});

	it("normalizes Melhor Envio services into the shipping quote contract and preserves quotedAt", () => {
		const quotes = normalizeMelhorEnvioQuoteResponse({
			payload: {
				deliveryDetails: [
					{
						id: 1,
						name: "PAC",
						error: "Servico indisponivel para o trecho.",
					},
					{
						id: 2,
						name: "SEDEX",
						custom_price: "18.08",
						currency: "R$",
						custom_delivery_time: 2,
						company: {
							id: 1,
							name: "Correios",
						},
					},
				],
			},
			providerCode: "melhor-envio",
			providerLabel: "Melhor Envio",
			quotedAt: "2026-06-28T12:30:00.000Z",
		});

		expect(quotes).toHaveLength(1);
		expect(quotes[0]).toMatchObject({
			providerCode: "melhor-envio",
			providerLabel: "Correios",
			serviceCode: "2",
			serviceName: "SEDEX",
			amount: 1808,
			currency: "BRL",
			estimatedDays: 2,
			quotedAt: "2026-06-28T12:30:00.000Z",
		});
		expect(toShippingRate(quotes[0])?.quotedAt).toBe("2026-06-28T12:30:00.000Z");
	});

	it("fails safely with a normalized timeout error", async () => {
		const abortError = new Error("aborted");
		abortError.name = "AbortError";
		vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(abortError);

		await expect(
			fetchMelhorEnvioQuotes({
				...baseInput,
				quotedAt: "2026-06-28T13:00:00.000Z",
			}),
		).rejects.toThrow("A cotacao do Melhor Envio expirou antes de responder.");
	});
});
