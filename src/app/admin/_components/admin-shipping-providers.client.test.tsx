import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminShippingProviders from "./admin-shipping-providers.client";

type JsonResponse = {
	ok: boolean;
	json: () => Promise<unknown>;
};

const fetchMock = vi.fn<() => Promise<JsonResponse>>();

describe("AdminShippingProviders", () => {
	beforeEach(() => {
		fetchMock.mockReset();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("renders a fixed Melhor Envio section without generic provider UI", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				current: {
					shippingEnabled: true,
					shippingMelhorEnvio: {
						environment: "sandbox",
						baseUrl: "https://sandbox.melhorenvio.com.br/api/v2",
						originPostalCode: "01310-100",
						defaultWeightGrams: 300,
						defaultLengthCm: 20,
						defaultWidthCm: 15,
						defaultHeightCm: 10,
						userAgent: "Selo Libertária (tech@selolibertaria.com)",
						contactEmail: "tech@selolibertaria.com",
						supportedCountry: "BR",
						requiresPostalCode: true,
					},
				},
			}),
		});

		render(<AdminShippingProviders />);

		await waitFor(() => {
			expect(screen.getByLabelText("Ativar cálculo de frete")).toBeTruthy();
		});

		expect(screen.getByLabelText("CEP de origem")).toHaveValue("01310-100");
		expect(screen.getByLabelText("País suportado")).toHaveValue("BR");
		expect(screen.getByLabelText("Exige CEP")).toHaveValue("true");
		expect(
			screen.getByText("O token continua no ambiente do servidor e nunca é salvo no admin.", {
				exact: false,
			}),
		).toBeTruthy();
		expect(screen.queryByText("Correios")).toBeNull();
		expect(screen.queryByRole("button", { name: "Adicionar provedor" })).toBeNull();
		expect(screen.queryByRole("button", { name: "Adicionar Melhor Envio" })).toBeNull();
	});

	it("saves shipping toggle and fixed Melhor Envio settings only", async () => {
		fetchMock
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					current: {
						shippingEnabled: true,
						shippingMelhorEnvio: {
							environment: "sandbox",
							baseUrl: "",
							originPostalCode: "01310-100",
							defaultWeightGrams: 300,
							defaultLengthCm: 20,
							defaultWidthCm: 15,
							defaultHeightCm: 10,
							userAgent: "",
							contactEmail: "",
							supportedCountry: "BR",
							requiresPostalCode: true,
						},
					},
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					current: {
						shippingEnabled: false,
						shippingMelhorEnvio: {
							environment: "sandbox",
							baseUrl: "https://sandbox.melhorenvio.com.br/api/v2",
							originPostalCode: "20040-020",
							defaultWeightGrams: 350,
							defaultLengthCm: 21,
							defaultWidthCm: 16,
							defaultHeightCm: 11,
							userAgent: "Selo Libertária (ops@selolibertaria.com)",
							contactEmail: "ops@selolibertaria.com",
							supportedCountry: "BR",
							requiresPostalCode: true,
						},
					},
				}),
			});

		render(<AdminShippingProviders />);

		const checkbox = await screen.findByLabelText("Ativar cálculo de frete");
		fireEvent.click(checkbox);
		fireEvent.change(screen.getByLabelText("URL base"), {
			target: { value: "https://sandbox.melhorenvio.com.br/api/v2" },
		});
		fireEvent.change(screen.getByLabelText("CEP de origem"), {
			target: { value: "20040-020" },
		});
		fireEvent.change(screen.getByLabelText("Peso padrão (g)"), {
			target: { value: "350" },
		});
		fireEvent.change(screen.getByLabelText("Comprimento padrão (cm)"), {
			target: { value: "21" },
		});
		fireEvent.change(screen.getByLabelText("Largura padrão (cm)"), {
			target: { value: "16" },
		});
		fireEvent.change(screen.getByLabelText("Altura padrão (cm)"), {
			target: { value: "11" },
		});
		fireEvent.change(screen.getByLabelText("User-Agent técnico"), {
			target: { value: "Selo Libertária (ops@selolibertaria.com)" },
		});
		fireEvent.change(screen.getByLabelText("E-mail técnico de contato"), {
			target: { value: "ops@selolibertaria.com" },
		});

		fireEvent.click(screen.getByRole("button", { name: "Salvar frete" }));

		await waitFor(() => {
			expect(screen.getByText("Configurações de frete salvas.")).toBeTruthy();
		});

		const request = fetchMock.mock.calls[1];
		expect(request?.[0]).toBe("/api/admin/settings");
		expect(request?.[1]).toMatchObject({
			method: "PATCH",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
		});

		const body = JSON.parse(String(request?.[1]?.body));
		expect(body).toEqual({
			shippingEnabled: false,
			shippingMelhorEnvio: {
				environment: "sandbox",
				baseUrl: "https://sandbox.melhorenvio.com.br/api/v2",
				originPostalCode: "20040-020",
				defaultWeightGrams: "350",
				defaultLengthCm: "21",
				defaultWidthCm: "16",
				defaultHeightCm: "11",
				userAgent: "Selo Libertária (ops@selolibertaria.com)",
				contactEmail: "ops@selolibertaria.com",
			},
		});
		expect(body.shippingProviders).toBeUndefined();
	});
});
