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
		MELHOR_ENVIO_ACCESS_TOKEN: "env-token",
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

import { resolveShippingQuotesForDestination, serializeMelhorEnvioSettingsForAdmin } from "@/lib/shipping";

const melhorEnvioSettings = {
	environment: "sandbox" as const,
	baseUrl: "https://sandbox.melhorenvio.com.br/api/v2",
	originPostalCode: "01310-100",
	defaultWeightGrams: 300,
	defaultLengthCm: 20,
	defaultWidthCm: 15,
	defaultHeightCm: 10,
	userAgent: "Selo Libertária (tech@selolibertaria.com)",
	contactEmail: "tech@selolibertaria.com",
	supportedCountry: "BR" as const,
	requiresPostalCode: true,
};

const legacyMelhorEnvioProvider = {
	code: "melhorenvio",
	label: "Melhor Envio",
	enabled: true,
	priority: 0,
	mode: "http" as const,
	kind: "melhorenvio" as const,
	authType: "bearer" as const,
	baseUrl: "https://www.melhorenvio.com.br/api/v2",
	environment: "production" as const,
	endpoints: {
		quote: "/me/shipment/calculate",
		shipment: null,
		tracking: null,
		token: null,
	},
	supportedCountries: ["BR"],
	requiresPostalCode: true,
	defaultWeightGrams: 400,
	defaultLengthCm: 25,
	defaultWidthCm: 18,
	defaultHeightCm: 12,
	credentialsEncrypted: "legacy-melhor-envio",
};

describe("shipping resolution", () => {
	beforeEach(() => {
		envMock.MELHOR_ENVIO_ACCESS_TOKEN = "env-token";
		getDefaultCountrySettingMock.mockReset();
		getSettingsDocMock.mockReset();
		decryptStoredSecretMock.mockReset();
		fetchMelhorEnvioQuotesMock.mockReset();

		getDefaultCountrySettingMock.mockResolvedValue("BR");
		decryptStoredSecretMock.mockImplementation((value: string | null | undefined) => {
			if (value === "legacy-melhor-envio") {
				return JSON.stringify({
					originPostalCode: "22220-000",
					userAgent: "Legacy App (legacy@selolibertaria.com)",
					contactEmail: "legacy@selolibertaria.com",
				});
			}

			return null;
		});
		getSettingsDocMock.mockResolvedValue({
			current: {
				shippingEnabled: true,
				shippingMelhorEnvio: melhorEnvioSettings,
				shippingProviders: [legacyMelhorEnvioProvider],
			},
		});
	});

	it("builds Melhor Envio from admin settings and env token", async () => {
		fetchMelhorEnvioQuotesMock.mockResolvedValue([
			{
				providerCode: "melhorenvio",
				providerLabel: "Melhor Envio",
				serviceCode: "2",
				serviceName: "SEDEX",
				amount: 1890,
				currency: "BRL",
				estimatedDays: 2,
				quotedAt: "2026-06-29T18:00:00.000Z",
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
				quotedAt: "2026-06-29T18:00:00.000Z",
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
				baseUrl: "https://sandbox.melhorenvio.com.br/api/v2",
				environment: "sandbox",
				userAgent: "Selo Libertária (tech@selolibertaria.com)",
			}),
		);
		expect(result.provider?.code).toBe("melhorenvio");
		expect(result.selected?.serviceCode).toBe("1");
		expect(result.selected?.amount).toBe(1290);
		expect(result.error ?? null).toBeNull();
	});

	it("returns no shipping quote when the admin toggle is off", async () => {
		getSettingsDocMock.mockResolvedValue({
			current: {
				shippingEnabled: false,
				shippingMelhorEnvio: melhorEnvioSettings,
				shippingProviders: [legacyMelhorEnvioProvider],
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

	it("keeps pickup working even when shipping is disabled", async () => {
		getSettingsDocMock.mockResolvedValue({
			current: {
				shippingEnabled: false,
				shippingMelhorEnvio: melhorEnvioSettings,
			},
		});

		const result = await resolveShippingQuotesForDestination({
			destination: null,
			subtotal: 4990,
			currency: "BRL",
			items: [{ productId: "prod_1", variantId: "var_1", quantity: 1, price: 4990 }],
			deliveryMethod: "pickup",
		});

		expect(fetchMelhorEnvioQuotesMock).not.toHaveBeenCalled();
		expect(result.selected?.providerCode).toBe("pickup");
		expect(result.selected?.amount).toBe(0);
	});

	it("falls back to legacy Melhor Envio fields when the admin config is absent", async () => {
		getSettingsDocMock.mockResolvedValue({
			current: {
				shippingEnabled: true,
				shippingProviders: [legacyMelhorEnvioProvider],
			},
		});
		fetchMelhorEnvioQuotesMock.mockResolvedValue([
			{
				providerCode: "melhorenvio",
				providerLabel: "Melhor Envio",
				serviceCode: "1",
				serviceName: "PAC",
				amount: 1590,
				currency: "BRL",
				estimatedDays: 4,
				quotedAt: "2026-06-29T18:00:00.000Z",
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

		expect(fetchMelhorEnvioQuotesMock).toHaveBeenCalledWith(
			expect.objectContaining({
				originPostalCode: "22220-000",
				baseUrl: "https://www.melhorenvio.com.br/api/v2",
				environment: "production",
				userAgent: "Legacy App (legacy@selolibertaria.com)",
				accessToken: "env-token",
			}),
		);
		expect(result.provider?.code).toBe("melhorenvio");
		expect(result.selected?.amount).toBe(1590);
	});

	it("returns the existing shipping error flow when the env token is missing", async () => {
		envMock.MELHOR_ENVIO_ACCESS_TOKEN = "";
		fetchMelhorEnvioQuotesMock.mockRejectedValue(new Error("O token do Melhor Envio nao foi configurado."));

		const result = await resolveShippingQuotesForDestination({
			destination: { country: "BR", postalCode: "20040-020" },
			subtotal: 4990,
			currency: "BRL",
			items: [{ productId: "prod_1", variantId: "var_1", quantity: 1, price: 4990 }],
			deliveryMethod: "saved-address",
		});

		expect(fetchMelhorEnvioQuotesMock).toHaveBeenCalledWith(
			expect.objectContaining({
				accessToken: "",
				originPostalCode: "01310-100",
			}),
		);
		expect(result.quotes).toEqual([]);
		expect(result.selected).toBeNull();
		expect(result.error).toBe("O token do Melhor Envio nao foi configurado.");
	});

	it("serializes only non-secret Melhor Envio admin status", () => {
		const serialized = serializeMelhorEnvioSettingsForAdmin(melhorEnvioSettings);

		expect(serialized.envTokenStatus).toBe("configured");
		expect(serialized.oauthStatus).toBe("coming-soon");
		expect(serialized).not.toHaveProperty("accessToken");
		expect(JSON.stringify(serialized)).not.toContain("env-token");
	});
});
