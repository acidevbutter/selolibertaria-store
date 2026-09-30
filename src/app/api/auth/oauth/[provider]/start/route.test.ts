import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/env.mjs", () => ({
	env: { FASTAPI_API_URL: "http://fastapi.test" },
	publicUrl: "http://localhost:3001",
}));

import { GET } from "@/app/api/auth/oauth/[provider]/start/route";

function makeContext(provider: string) {
	return { params: Promise.resolve({ provider }) };
}

describe("oauth start route", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("redirects the browser straight to the provider's consent page, not to FastAPI's JSON", async () => {
		// FastAPI's GET /auth/oauth/{provider}/start responds 200 with
		// {authorization_url}, not an HTTP redirect (app/auth/router.py's
		// start_oauth). This route used to just NextResponse.redirect() to that
		// FastAPI URL, which sends the browser to a page that renders raw JSON
		// instead of ever reaching Google/Facebook/Instagram.
		vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
			Response.json({ authorization_url: "https://accounts.google.com/o/oauth2/v2/auth?client_id=x" }),
		);

		const res = await GET(new Request("http://localhost/api/auth/oauth/google/start"), makeContext("google"));

		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toBe("https://accounts.google.com/o/oauth2/v2/auth?client_id=x");
	});

	it("redirects to /login with an error for an unknown provider", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch");

		const res = await GET(new Request("http://localhost/api/auth/oauth/bogus/start"), makeContext("bogus"));

		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toBe("http://localhost:3001/login?oauth_error=provider");
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("redirects to /login with an error when FastAPI fails", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json({ detail: "boom" }, { status: 502 }));

		const res = await GET(new Request("http://localhost/api/auth/oauth/google/start"), makeContext("google"));

		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toBe("http://localhost:3001/login?oauth_error=provider");
	});
});
