import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const {
	envMock,
	getSettingsDocMock,
	getDefaultCountrySettingMock,
	decryptStoredSecretMock,
	fetchMelhorEnvioQuotesMock,
} = vi.hoisted(() => ({
	envMock: {
		MELHOR_ENVIO_ENABLED: "true",
		MELHOR_ENVIO_ENVIRONMENT: "sandbox",
		MELHOR_ENVIO_BASE_URL: "https://www.melhorenvio.com.br/api/v2",
		MELHOR_ENVIO_ACCESS_TOKEN: "env-token",
		MELHOR_ENVIO_ORIGIN_POSTAL_CODE: "01310-100",
		MELHOR_ENVIO_DEFAULT_WEIGHT_GRAMS: "300",
		MELHOR_ENVIO_DEFAULT_LENGTH_CM: "20",
		MELHOR_ENVIO_DEFAULT_WIDTH_CM: "20",
		MELHOR_ENVIO_DEFAULT_HEIGHT_CM: "10",
		MELHOR_ENVIO_USER_AGENT: "Selo Libertaria (tech@selolibertaria.com)",
		MELHOR_ENVIO_CONTACT_EMAIL: "tech@selolibertaria.com",
	},
	getSettingsDocMock: vi.fn(),
	getDefaultCountrySettingMock: vi.fn(),
	decryptStoredSecretMock: vi.fn(),
	fetchMelhorEnvioQuotesMock: vi.fn(),
}));

vi.mock("@/env.mjs", () => ({
	env: envMock,
}));

vi.mock("@/lib/settings-store", () => ({
	getSettingsDoc: getSettingsDocMock,
	getDefaultCountrySetting: getDefaultCountrySettingMock,
}));

vi.mock("@/lib/oauth/secrets", () => ({
	decryptStoredSecret: decryptStoredSecretMock,
}));

vi.mock("@/lib/shipping-melhor-envio", () => ({
	fetchMelhorEnvioQuotes: fetchMelhorEnvioQuotesMock,
}));

import { resolveShippingQuotesForDestination } from "@/lib/shipping";

const flatProvider = {
	code: "frete-fixo",
	label: "Frete fixo",
	enabled: true,
	priority: 0,
	mode: "flat" as const,
	kind: "custom" as const,
	fixedAmount: 2500,
	serviceCode: "FIXO",
	serviceName: "Frete fixo",
	supportedCountries: ["US"],
	requiresPostalCode: true,
};

const legacyMelhorEnvioProvider = {
	code: "correios",
	label: "Correios",
	enabled: true,
	priority: 20,
	mode: "http" as const,
	kind: "correios" as const,
	authType: "bearer" as const,
	baseUrl: "https://api.correios.com.br",
	endpoints: {
		quote: "/preco/v1/nacional",
		shipment: "",
		tracking: "",
		token: "",
	},
	serviceCode: "03220",
	serviceName: "SEDEX",
};

describe("resolveShippingQuotesForDestination", () => {
	beforeEach(() => {
		getSettingsDocMock.mockReset();
		getDefaultCountrySettingMock.mockReset();
		decryptStoredSecretMock.mockReset();
		fetchMelhorEnvioQuotesMock.mockReset();

		envMock.MELHOR_ENVIO_ENABLED = "true";
		envMock.MELHOR_ENVIO_ENVIRONMENT = "sandbox";
		envMock.MELHOR_ENVIO_BASE_URL = "https://www.melhorenvio.com.br/api/v2";
		envMock.MELHOR_ENVIO_ACCESS_TOKEN = "env-token";
		envMock.MELHOR_ENVIO_ORIGIN_POSTAL_CODE = "01310-100";
		envMock.MELHOR_ENVIO_DEFAULT_WEIGHT_GRAMS = "300";
		envMock.MELHOR_ENVIO_DEFAULT_LENGTH_CM = "20";
		envMock.MELHOR_ENVIO_DEFAULT_WIDTH_CM = "20";
		envMock.MELHOR_ENVIO_DEFAULT_HEIGHT_CM = "10";
		envMock.MELHOR_ENVIO_USER_AGENT = "Selo Libertaria (tech@selolibertaria.com)";
		envMock.MELHOR_ENVIO_CONTACT_EMAIL = "tech@selolibertaria.com";

		getDefaultCountrySettingMock.mockResolvedValue("BR");
		getSettingsDocMock.mockResolvedValue({
			current: {
				shippingEnabled: true,
				shippingProviders: [flatProvider, legacyMelhorEnvioProvider],
			},
		});
	});

	it("uses Melhor Envio from env for BR delivery addresses", async () => {
		fetchMelhorEnvioQuotesMock.mockResolvedValue([
			{
				providerCode: "melhorenvio",
				providerLabel: "Melhor Envio",
				serviceCode: "2",
				serviceName: "SEDEX",
				amount: 1890,
				currency: "BRL",
				estimatedDays: 2,
				quotedAt: "2026-06-28T18:00:00.000Z",
				method: "http",
			},
			{
				providerCode: "melhorenvio",
				providerLabel: "Melhor Envio",
				serviceCode: "1",
				serviceName: "PAC",
				amount: 1290,
				currency: "BRL",
				estimatedDays: 5,
				quotedAt: "2026-06-28T18:00:00.000Z",
				method: "http",
			},
		]);

		const result = await resolveShippingQuotesForDestination({
			destination: { country: "BR", postalCode: "20040-020" },
			subtotal: 4990,
			currency: "BRL",
			items: [{ productId: "prod_1", variantId: "var_1", quantity: 1, price: 4990 }],
			deliveryMethod: "saved-address",
		});

		expect(fetchMelhorEnvioQuotesMock).toHaveBeenCalledTimes(1);
		expect(fetchMelhorEnvioQuotesMock).toHaveBeenCalledWith(
			expect.objectContaining({
				originPostalCode: "01310-100",
				accessToken: "env-token",
			}),
		);
		expect(result.provider?.code).toBe("melhorenvio");
		expect(result.provider?.label).toBe("Melhor Envio");
		expect(result.selected?.serviceCode).toBe("1");
		expect(result.selected?.amount).toBe(1290);
		expect(result.error ?? null).toBeNull();
	});

	it("returns no shipping quote when admin toggle is off", async () => {
		getSettingsDocMock.mockResolvedValue({
			current: {
				shippingEnabled: false,
				shippingProviders: [flatProvider],
			},
		});

		const result = await resolveShippingQuotesForDestination({
			destination: { country: "BR", postalCode: "20040-020" },
			subtotal: 4990,
			currency: "BRL",
			items: [{ productId: "prod_1", variantId: "var_1", quantity: 1, price: 4990 }],
			deliveryMethod: "saved-address",
		});

		expect(fetchMelhorEnvioQuotesMock).not.toHaveBeenCalled();
		expect(result.quotes).toEqual([]);
		expect(result.selected).toBeNull();
		expect(result.provider).toBeNull();
		expect(result.error).toBeNull();
	});

	it("keeps pickup working even with env-based Melhor Envio", async () => {
		const result = await resolveShippingQuotesForDestination({
			destination: null,
			subtotal: 4990,
			currency: "BRL",
			items: [{ productId: "prod_1", variantId: "var_1", quantity: 1, price: 4990 }],
			deliveryMethod: "pickup",
		});

		expect(fetchMelhorEnvioQuotesMock).not.toHaveBeenCalled();
		expect(result.selected?.providerCode).toBe("pickup");
	});

	it("falls back to legacy providers only when env Melhor Envio is disabled", async () => {
		envMock.MELHOR_ENVIO_ENABLED = "false";

		const result = await resolveShippingQuotesForDestination({
			destination: { country: "US", postalCode: "10001" },
			subtotal: 4990,
			currency: "USD",
			items: [{ productId: "prod_1", variantId: "var_1", quantity: 1, price: 4990 }],
			deliveryMethod: "saved-address",
		});

		expect(fetchMelhorEnvioQuotesMock).not.toHaveBeenCalled();
		expect(result.provider?.code).toBe("frete-fixo");
		expect(result.selected?.providerCode).toBe("frete-fixo");
		expect(result.selected?.amount).toBe(2500);
	});
});
