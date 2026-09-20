// @vitest-environment node

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "@/proxy";

async function signSessionCookie(role: string, expiresInMs = 60_000) {
	return `session=${role}:${expiresInMs > 0 ? "valid" : "expired"}`;
}

// Tests must not depend on whatever MAINTENANCE_MODE happens to be set to in
// the real .env file — start every test from a known "off" state.
beforeEach(() => {
	delete process.env.MAINTENANCE_MODE;
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
			const authorization =
				input instanceof Request
					? input.headers.get("authorization")
					: new Headers(init?.headers).get("authorization");
			if (authorization?.includes("admin:valid")) return Response.json({ role: "admin" });
			if (authorization?.includes("customer:valid")) return Response.json({ role: "customer" });
			return new Response(null, { status: 401 });
		}),
	);
});

describe("proxy public auth paths", () => {
	it("redireciona prefixos legados de locale para a rota canônica", async () => {
		const res = await proxy(new NextRequest("http://localhost/pt-br"));

		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toBe("http://localhost/");
	});

	it("preserva o restante do caminho ao remover prefixos legados", async () => {
		const res = await proxy(new NextRequest("http://localhost/es/product/test-slug?ref=nav"));

		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toBe("http://localhost/product/test-slug?ref=nav");
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

	it("allows the email-availability check during signup without a session", async () => {
		const res = await proxy(new NextRequest("http://localhost/api/auth/email-available", { method: "POST" }));

		expect(res.status).toBe(200);
	});

	it("still protects private api routes", async () => {
		const res = await proxy(new NextRequest("http://localhost/api/user"));

		expect(res.status).toBe(401);
	});
});

describe("proxy maintenance mode", () => {
	it("does not redirect when maintenance mode is off", async () => {
		const res = await proxy(new NextRequest("http://localhost/products"));

		expect(res.status).toBe(200);
	});

	it("redirects anonymous visitors of any page to /maintenance, not /login", async () => {
		process.env.MAINTENANCE_MODE = "true";
		const res = await proxy(new NextRequest("http://localhost/products"));

		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toBe("http://localhost:3000/maintenance");
	});

	it("returns a JSON 503 for api routes instead of redirecting to an HTML page", async () => {
		process.env.MAINTENANCE_MODE = "true";
		const res = await proxy(new NextRequest("http://localhost/api/cart"));

		expect(res.status).toBe(503);
		expect(res.headers.get("content-type")).toContain("application/json");
		await expect(res.json()).resolves.toMatchObject({ code: "MAINTENANCE_MODE" });
	});

	it("lets /maintenance itself load", async () => {
		process.env.MAINTENANCE_MODE = "true";
		const res = await proxy(new NextRequest("http://localhost/maintenance"));

		expect(res.status).toBe(200);
	});

	it("lets /login itself load — direct link is the only way in", async () => {
		process.env.MAINTENANCE_MODE = "true";
		const res = await proxy(new NextRequest("http://localhost/login"));

		expect(res.status).toBe(200);
	});

	it("lets the login submit routes through so credentials can be checked", async () => {
		process.env.MAINTENANCE_MODE = "true";
		const submit = await proxy(new NextRequest("http://localhost/login/submit", { method: "POST" }));
		const apiForm = await proxy(new NextRequest("http://localhost/api/auth/login/form", { method: "POST" }));

		expect(submit.status).toBe(200);
		expect(apiForm.status).toBe(200);
	});

	it("redirects a non-admin session away from every page, to /maintenance", async () => {
		process.env.MAINTENANCE_MODE = "true";
		const cookie = await signSessionCookie("customer");
		const res = await proxy(new NextRequest("http://localhost/", { headers: { cookie } }));

		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toBe("http://localhost:3000/maintenance");
	});

	it("lets an authenticated admin session through to any page", async () => {
		process.env.MAINTENANCE_MODE = "true";
		const cookie = await signSessionCookie("admin");
		const res = await proxy(new NextRequest("http://localhost/admin", { headers: { cookie } }));

		expect(res.status).toBe(200);
	});

	it("does not let an expired admin session bypass maintenance mode", async () => {
		process.env.MAINTENANCE_MODE = "true";
		const cookie = await signSessionCookie("admin", -1000);
		const res = await proxy(new NextRequest("http://localhost/", { headers: { cookie } }));

		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toBe("http://localhost:3000/maintenance");
	});
});
