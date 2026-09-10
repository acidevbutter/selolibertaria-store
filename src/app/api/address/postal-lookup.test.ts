import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/env.mjs", () => ({ env: { FASTAPI_API_URL: "http://fastapi.test" } }));

import { GET } from "@/app/api/address/postal-lookup/route";

describe("postal lookup route", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("proxies a Brazilian address lookup to FastAPI", async () => {
		// FastAPI's PostalLookupRead (backend/app/address/schemas.py) responds with
		// the address fields at the top level, not wrapped in a `result` key. This
		// route is a pure passthrough (`return new Response(await response.text(), ...)`),
		// so the proxied body must mirror that flat shape exactly.
		vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
			Response.json({
				line1: "Praça da Sé",
				line2: "",
				district: "Sé",
				city: "São Paulo",
				state: "SP",
				postalCode: "01001-000",
				country: "BR",
			}),
		);

		const res = await GET(
			new Request("http://localhost/api/address/postal-lookup?country=BR&postalCode=01001000"),
		);
		const body = (await res.json()) as Record<string, string>;

		expect(res.status).toBe(200);
		expect(body).toMatchObject({
			line1: "Praça da Sé",
			line2: "",
			district: "Sé",
			city: "São Paulo",
			state: "SP",
			postalCode: "01001-000",
			country: "BR",
		});
	});

	it("forwards FastAPI lookup failures", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
			Response.json({ error: "Lookup failed" }, { status: 502 }),
		);

		const res = await GET(
			new Request("http://localhost/api/address/postal-lookup?country=BR&postalCode=01001000"),
		);
		expect(res.status).toBe(502);
		expect(await res.json()).toEqual({ error: "Lookup failed" });
	});
});
