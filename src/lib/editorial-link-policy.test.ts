import { describe, expect, it } from "vitest";
import {
	EDITORIAL_HOME_CUSTOM_LINK_VALUE,
	parseEditorialHomeHref,
	parseEditorialHomeHrefChoice,
} from "@/lib/editorial-link-policy";

describe("parseEditorialHomeHref", () => {
	it("accepts predictable public editorial routes", () => {
		expect(parseEditorialHomeHref("/products", "Campo")).toBe("/products");
		expect(parseEditorialHomeHref(" /projects?origem=home#agenda ", "Campo")).toBe(
			"/projects?origem=home#agenda",
		);
	});

	it("rejects external, admin and nonexistent routes", () => {
		expect(() => parseEditorialHomeHref("https://example.com", "Campo")).toThrow("rota interna");
		expect(() => parseEditorialHomeHref("/admin", "Campo")).toThrow("rota não permitida");
		expect(() => parseEditorialHomeHref("/livros", "Campo")).toThrow("rota não permitida");
	});

	it("keeps empty fields optional", () => {
		expect(parseEditorialHomeHref("", "Campo")).toBeNull();
		expect(parseEditorialHomeHref(null, "Campo")).toBeNull();
	});

	it("parses selected preset values", () => {
		const formData = new FormData();
		formData.set("ctaHrefPreset", "/contact");

		expect(parseEditorialHomeHrefChoice(formData, "ctaHref", "Campo")).toBe("/contact");
	});

	it("parses explicit custom values", () => {
		const formData = new FormData();
		formData.set("ctaHrefPreset", EDITORIAL_HOME_CUSTOM_LINK_VALUE);
		formData.set("ctaHrefCustom", "https://example.com/campanha");

		expect(parseEditorialHomeHrefChoice(formData, "ctaHref", "Campo")).toBe("https://example.com/campanha");
	});

	it("rejects unsafe custom values", () => {
		const formData = new FormData();
		formData.set("ctaHrefPreset", EDITORIAL_HOME_CUSTOM_LINK_VALUE);
		formData.set("ctaHrefCustom", "javascript:alert(1)");

		expect(() => parseEditorialHomeHrefChoice(formData, "ctaHref", "Campo")).toThrow("http, https");
	});
});
