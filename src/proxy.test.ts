// @vitest-environment node

import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "@/proxy";

describe("proxy public auth paths", () => {
	it("stores the locale cookie and redirects locale-prefixed storefront routes", async () => {
		const res = await proxy(new NextRequest("http://localhost/pt-br"));

		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toBe("http://localhost/");
		expect(res.headers.get("set-cookie")).toContain("storefront_locale=pt-BR");
	});

	it("stores the locale cookie and preserves the remaining pathname", async () => {
		const res = await proxy(new NextRequest("http://localhost/es/product/test-slug?ref=nav"));

		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toBe("http://localhost/product/test-slug?ref=nav");
		expect(res.headers.get("set-cookie")).toContain("storefront_locale=es-ES");
	});

	it("allows oauth start without an authenticated session", async () => {
		const res = await proxy(new NextRequest("http://localhost/api/auth/oauth/google/start"));

		expect(res.status).toBe(200);
	});

	it("allows oauth callback without an authenticated session", async () => {
		const res = await proxy(new NextRequest("http://localhost/api/auth/oauth/google/callback?code=test"));

		expect(res.status).toBe(200);
	});

	it("allows classic login form post route without an authenticated session", async () => {
		const res = await proxy(new NextRequest("http://localhost/api/auth/login/form"));

		expect(res.status).toBe(200);
	});

	it("still protects private api routes", async () => {
		const res = await proxy(new NextRequest("http://localhost/api/user"));

		expect(res.status).toBe(401);
	});
});
