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

	it("renders only the shipping toggle and helper copy", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				current: {
					shippingEnabled: true,
				},
			}),
		});

		render(<AdminShippingProviders />);

		await waitFor(() => {
			expect(screen.getByLabelText("Ativar cálculo de frete")).toBeTruthy();
		});

		expect(
			screen.getByText("A cotação usa o Melhor Envio configurado no ambiente da aplicação."),
		).toBeTruthy();
		expect(screen.queryByText("Correios")).toBeNull();
		expect(screen.queryByText("Configuração legada de frete")).toBeNull();
		expect(screen.queryByRole("button", { name: "Adicionar Melhor Envio" })).toBeNull();
	});

	it("saves only shippingEnabled", async () => {
		fetchMock
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					current: {
						shippingEnabled: true,
					},
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					current: {
						shippingEnabled: false,
					},
				}),
			});

		render(<AdminShippingProviders />);

		const checkbox = await screen.findByLabelText("Ativar cálculo de frete");
		fireEvent.click(checkbox);
		fireEvent.click(screen.getByRole("button", { name: "Salvar frete" }));

		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});

		const request = fetchMock.mock.calls[1];
		expect(request?.[0]).toBe("/api/admin/settings");
		expect(request?.[1]).toMatchObject({ method: "PATCH" });
		expect(JSON.parse(String(request?.[1]?.body))).toEqual({
			shippingEnabled: false,
		});
	});
});
