import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/address/postal-lookup/route";

describe("postal lookup route", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("fills a Brazilian address from ViaCEP", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
			Response.json({
				cep: "01001-000",
				logradouro: "Praça da Sé",
				bairro: "Sé",
				localidade: "São Paulo",
				uf: "SP",
			}),
		);

		const res = await GET(
			new Request("http://localhost/api/address/postal-lookup?country=BR&postalCode=01001000"),
		);
		const body = (await res.json()) as { result: Record<string, string> };

		expect(res.status).toBe(200);
		expect(body.result).toMatchObject({
			line1: "Praça da Sé",
			line2: "",
			district: "Sé",
			city: "São Paulo",
			state: "SP",
			postalCode: "01001-000",
			country: "BR",
		});
	});

	it("falls back to BrasilAPI when ViaCEP is unavailable", async () => {
		vi.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(new Response(null, { status: 502 }))
			.mockResolvedValueOnce(
				Response.json({
					cep: "01001-000",
					street: "Praça da Sé",
					neighborhood: "Sé",
					city: "São Paulo",
					state: "SP",
				}),
			);

		const res = await GET(
			new Request("http://localhost/api/address/postal-lookup?country=BR&postalCode=01001000"),
		);
		const body = (await res.json()) as { result: Record<string, string> };

		expect(res.status).toBe(200);
		expect(body.result).toMatchObject({
			line1: "Praça da Sé",
			line2: "",
			district: "Sé",
			city: "São Paulo",
			state: "SP",
			postalCode: "01001-000",
			country: "BR",
		});
	});
});
