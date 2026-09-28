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

	it("renders the fixed Melhor Envio block with environment token status only", async () => {
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
						envTokenStatus: "configured",
						oauthStatus: "coming-soon",
					},
				},
			}),
		});

		render(<AdminShippingProviders />);

		// The checkbox is rendered unconditionally from the very first paint
		// (only its `disabled` state depends on the pending GET), so waiting
		// for its mere presence resolves before the mocked fetch's settings
		// have actually landed in state. Wait for a value that only exists
		// once the GET response has been applied, so every assertion below
		// is guaranteed to see post-load state instead of racing it.
		await waitFor(() => {
			expect(screen.getByLabelText("CEP de origem")).toHaveValue("01310-100");
		});

		expect(screen.getByLabelText("Ativar cálculo de frete")).toBeTruthy();
		expect(screen.getByText("Conexão Melhor Envio")).toBeTruthy();
		expect(screen.getByText("Token de ambiente configurado")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Conectar Melhor Envio" })).toBeDisabled();
		expect(
			screen.getByText(
				"Nesta versão, a cotação usa o token configurado no ambiente da aplicação. A conexão OAuth completa fica preparada para uma próxima etapa.",
			),
		).toBeTruthy();
		expect(screen.getByLabelText("País suportado")).toHaveValue("BR");
		expect(screen.queryByText("env-token")).toBeNull();
		expect(screen.queryByText("Correios")).toBeNull();
	});

	it("saves only operational Melhor Envio settings", async () => {
		fetchMock
			.mockResolvedValueOnce({
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
							envTokenStatus: "missing",
							oauthStatus: "coming-soon",
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
							envTokenStatus: "missing",
							oauthStatus: "coming-soon",
						},
					},
				}),
			});

		render(<AdminShippingProviders />);

		// Same reasoning as the test above: the checkbox exists on first paint
		// regardless of whether the GET has resolved, so asserting on it alone
		// doesn't guarantee the initial `shippingEnabled` from the mocked
		// response has been applied yet. If the GET's state update landed
		// *after* this click (order that varies with system load, which is
		// why this only flaked under the full suite), it would silently
		// overwrite the toggle back to its loaded value before "Salvar frete"
		// captured it — producing exactly the `shippingEnabled` mismatch this
		// test used to see intermittently. Waiting on a value that only
		// exists post-load closes that race.
		await waitFor(() => {
			expect(screen.getByLabelText("CEP de origem")).toHaveValue("01310-100");
		});

		const checkbox = screen.getByLabelText("Ativar cálculo de frete");
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
