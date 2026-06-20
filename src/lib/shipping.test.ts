import { describe, expect, it } from "vitest";
import { normalizeShippingProviderInput, selectBestShippingQuote, toShippingRate } from "@/lib/shipping-core";

describe("shipping", () => {
	it("normalizes provider settings and preserves configuration", () => {
		const provider = normalizeShippingProviderInput({
			code: "Correios",
			label: "Correios",
			enabled: true,
			priority: 2,
			mode: "http",
			kind: "correios",
			baseUrl: "https://api.correios.com.br",
			authType: "bearer",
			environment: "production",
			endpoints: {
				quote: "/preco/v1/nacional",
				token: "/token/v1/autentica/contrato",
			},
			credentials: {
				username: "teste",
				accessCode: "segredo",
				originPostalCode: "01000-000",
			},
			credentialsEncrypted: "encrypted-value",
			serviceCode: "PAC",
			serviceName: "Economy",
			fixedAmount: 2500,
			estimatedDays: 5,
			currency: "brl",
			supportedCountries: ["br", "US", "br"],
			requiresPostalCode: true,
			defaultWeightGrams: 400,
			defaultLengthCm: 25,
			defaultWidthCm: 15,
			defaultHeightCm: 8,
		});

		expect(provider.code).toBe("correios");
		expect(provider.label).toBe("Correios");
		expect(provider.enabled).toBe(true);
		expect(provider.priority).toBe(2);
		expect(provider.mode).toBe("http");
		expect(provider.kind).toBe("correios");
		expect(provider.authType).toBe("bearer");
		expect(provider.baseUrl).toBe("https://api.correios.com.br");
		expect(provider.environment).toBe("production");
		expect(provider.endpoints?.quote).toBe("/preco/v1/nacional");
		expect(provider.endpoints?.token).toBe("/token/v1/autentica/contrato");
		expect(provider.credentialsEncrypted).toBe("encrypted-value");
		expect(provider.serviceCode).toBe("PAC");
		expect(provider.serviceName).toBe("Economy");
		expect(provider.fixedAmount).toBe(2500);
		expect(provider.estimatedDays).toBe(5);
		expect(provider.currency).toBeNull();
		expect(provider.supportedCountries).toEqual(["BR", "US"]);
		expect(provider.requiresPostalCode).toBe(true);
		expect(provider.defaultWeightGrams).toBe(400);
		expect(provider.defaultLengthCm).toBe(25);
		expect(provider.defaultWidthCm).toBe(15);
		expect(provider.defaultHeightCm).toBe(8);
	});

	it("chooses the best quote by amount and then by delivery time", () => {
		const selected = selectBestShippingQuote([
			{
				providerCode: "a",
				providerLabel: "A",
				serviceCode: "slow",
				serviceName: "Slow",
				amount: 3000,
				currency: "BRL",
				estimatedDays: 7,
				method: "flat",
			},
			{
				providerCode: "b",
				providerLabel: "B",
				serviceCode: "fast",
				serviceName: "Fast",
				amount: 3000,
				currency: "BRL",
				estimatedDays: 4,
				method: "flat",
			},
		]);

		expect(selected?.serviceCode).toBe("fast");
		expect(toShippingRate(selected)?.fixed_amount.amount).toBe(3000);
	});
});
