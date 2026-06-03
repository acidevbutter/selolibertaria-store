import { describe, expect, it } from "vitest";
import { getDefaultCurrencyForLocale, resolveSupportedCurrency } from "@/lib/currency";

describe("currency helpers", () => {
	it("resolves only supported currencies", () => {
		expect(resolveSupportedCurrency("brl")).toBe("BRL");
		expect(resolveSupportedCurrency(" EUR ")).toBe("EUR");
		expect(resolveSupportedCurrency("cad")).toBeNull();
	});

	it("derives sensible defaults from locale", () => {
		expect(getDefaultCurrencyForLocale("pt-BR")).toBe("BRL");
		expect(getDefaultCurrencyForLocale("es-ES")).toBe("EUR");
		expect(getDefaultCurrencyForLocale("en-US")).toBe("USD");
		expect(getDefaultCurrencyForLocale("de-DE")).toBe("USD");
	});
});
