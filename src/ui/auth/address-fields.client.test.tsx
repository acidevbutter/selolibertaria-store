import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IntlClientProvider } from "@/i18n/client";
import { AddressFields, type AddressValue } from "@/ui/auth/address-fields.client";
import ptBrMessages from "../../../messages/pt-BR.json";

vi.mock("@/ui/auth/country-select", () => ({
	CountrySelect: () => <div data-testid="country-select">country-select</div>,
}));

describe("AddressFields", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("preenche o endereco a partir da resposta plana de /api/address/postal-lookup", async () => {
		// Regressão: o backend (backend/app/address/schemas.py::PostalLookupRead)
		// responde com os campos na raiz, não em `{ result: {...} }`. Um cliente
		// que espere o envelope `result` sempre cai no ramo "indisponível" mesmo
		// com a busca funcionando.
		vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
			Response.json({
				line1: "Avenida Paulista",
				line2: "",
				district: "Bela Vista",
				city: "São Paulo",
				state: "SP",
				postalCode: "01311-000",
				country: "BR",
			}),
		);

		let current: AddressValue = {
			line1: "",
			line2: "",
			number: "",
			complement: "",
			district: "",
			city: "",
			state: "",
			postalCode: "",
			country: "BR",
		};
		const handleChange = vi.fn((next: AddressValue) => {
			current = next;
		});

		const { rerender } = render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<AddressFields
					idPrefix="checkout-address"
					value={current}
					onChange={handleChange}
					countryMode="br-only"
				/>
			</IntlClientProvider>,
		);

		const postalInput = screen.getByLabelText("CEP");
		fireEvent.change(postalInput, { target: { value: "01311-000" } });
		rerender(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<AddressFields
					idPrefix="checkout-address"
					value={current}
					onChange={handleChange}
					countryMode="br-only"
				/>
			</IntlClientProvider>,
		);
		fireEvent.blur(postalInput);

		await waitFor(() => {
			expect(current.line1).toBe("Avenida Paulista");
		});
		expect(current.district).toBe("Bela Vista");
		expect(current.city).toBe("São Paulo");
		expect(current.state).toBe("SP");
	});

	it("remove o campo de pais quando o modo BR-only esta ativo", () => {
		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<AddressFields
					idPrefix="checkout-address"
					value={{
						line1: "",
						line2: "",
						number: "",
						complement: "",
						district: "",
						city: "",
						state: "",
						postalCode: "",
						country: "US",
					}}
					onChange={vi.fn()}
					countryMode="br-only"
				/>
			</IntlClientProvider>,
		);

		expect(screen.getByText("No momento, atendemos apenas endereços no Brasil.")).toBeTruthy();
		expect(screen.queryByLabelText("País")).toBeNull();
		expect(screen.queryByTestId("country-select")).toBeNull();
	});
});
