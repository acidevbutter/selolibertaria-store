import { describe, expect, it } from "vitest";
import { parseEditorialHomeHref } from "@/lib/editorial-link-policy";

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
});
