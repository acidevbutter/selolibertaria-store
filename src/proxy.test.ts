// @vitest-environment node

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "@/proxy";

async function signSessionCookie(role: string, expiresInMs = 60_000) {
	return `session=${role}:${expiresInMs > 0 ? "valid" : "expired"}`;
}

// Site activation status is now backend-driven (GET /site-activation/public),
// not an env var — tests control it via this flag instead of
// process.env.MAINTENANCE_MODE. Default "activated" (maintenance off) so
// tests don't depend on real backend state.
let siteActivated = true;

beforeEach(() => {
	siteActivated = true;
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
			const url = input instanceof Request ? input.url : String(input);
			if (url.includes("/site-activation/public")) {
				return Response.json({ activated: siteActivated });
			}
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
	it("does not redirect when the site is activated", async () => {
		const res = await proxy(new NextRequest("http://localhost/products"));

		expect(res.status).toBe(200);
	});

	it("redirects anonymous visitors of any page to /maintenance, not /login", async () => {
		siteActivated = false;
		const res = await proxy(new NextRequest("http://localhost/products"));

		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toBe("http://localhost:3000/maintenance");
	});

	it("returns a JSON 503 for api routes instead of redirecting to an HTML page", async () => {
		siteActivated = false;
		const res = await proxy(new NextRequest("http://localhost/api/cart"));

		expect(res.status).toBe(503);
		expect(res.headers.get("content-type")).toContain("application/json");
		await expect(res.json()).resolves.toMatchObject({ code: "MAINTENANCE_MODE" });
	});

	it("lets /maintenance itself load", async () => {
		siteActivated = false;
		const res = await proxy(new NextRequest("http://localhost/maintenance"));

		expect(res.status).toBe(200);
	});

	it("lets /login itself load — direct link is the only way in", async () => {
		siteActivated = false;
		const res = await proxy(new NextRequest("http://localhost/login"));

		expect(res.status).toBe(200);
	});

	it("lets the login submit routes through so credentials can be checked", async () => {
		siteActivated = false;
		const submit = await proxy(new NextRequest("http://localhost/login/submit", { method: "POST" }));
		const apiForm = await proxy(new NextRequest("http://localhost/api/auth/login/form", { method: "POST" }));

		expect(submit.status).toBe(200);
		expect(apiForm.status).toBe(200);
	});

	it("redirects a non-admin session away from every page, to /maintenance", async () => {
		siteActivated = false;
		const cookie = await signSessionCookie("customer");
		const res = await proxy(new NextRequest("http://localhost/", { headers: { cookie } }));

		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toBe("http://localhost:3000/maintenance");
	});

	it("lets an authenticated admin session through to any page", async () => {
		siteActivated = false;
		const cookie = await signSessionCookie("admin");
		const res = await proxy(new NextRequest("http://localhost/admin", { headers: { cookie } }));

		expect(res.status).toBe(200);
	});

	it("does not let an expired admin session bypass maintenance mode", async () => {
		siteActivated = false;
		const cookie = await signSessionCookie("admin", -1000);
		const res = await proxy(new NextRequest("http://localhost/", { headers: { cookie } }));

		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toBe("http://localhost:3000/maintenance");
	});

	it("fails closed to maintenance when the backend is unreachable", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				throw new Error("network error");
			}),
		);
		const res = await proxy(new NextRequest("http://localhost/products"));

		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toBe("http://localhost:3000/maintenance");
	});
});
