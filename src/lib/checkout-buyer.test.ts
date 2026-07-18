import { describe, expect, it } from "vitest";
import { formatCpf, getCheckoutIdentificationType, normalizeCheckoutBuyer } from "@/lib/checkout-buyer";

describe("checkout buyer document", () => {
	it("accepts and formats a valid CNPJ", () => {
		expect(formatCpf("11222333000181")).toBe("11.222.333/0001-81");
		expect(getCheckoutIdentificationType("11.222.333/0001-81")).toBe("CNPJ");
		expect(
			normalizeCheckoutBuyer({
				fullName: "Selo Libertária",
				email: "contato@selo.test",
				cpf: "11.222.333/0001-81",
				phone: "11999999999",
			}),
		).toMatchObject({ cpf: "11222333000181" });
	});

	it("keeps CPF behavior", () => {
		expect(formatCpf("52998224725")).toBe("529.982.247-25");
		expect(getCheckoutIdentificationType("529.982.247-25")).toBe("CPF");
	});
});
