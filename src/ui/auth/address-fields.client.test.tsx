import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IntlClientProvider } from "@/i18n/client";
import { AddressFields } from "@/ui/auth/address-fields.client";
import ptBrMessages from "../../../messages/pt-BR.json";

vi.mock("@/ui/auth/country-select", () => ({
	CountrySelect: () => <div data-testid="country-select">country-select</div>,
}));

describe("AddressFields", () => {
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
