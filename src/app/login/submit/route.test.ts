import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/env.mjs", () => ({
	env: { FASTAPI_API_URL: "http://fastapi.test" },
	publicUrl: "http://localhost:3001",
}));

import { POST } from "@/app/login/submit/route";

function formRequest(fields: Record<string, string>) {
	const formData = new FormData();
	for (const [key, value] of Object.entries(fields)) formData.set(key, value);
	return new Request("http://localhost/login/submit", { method: "POST", body: formData });
}

describe("login/submit route", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it.each([
		["Credenciais inválidas", "invalid"],
		["E-mail não verificado. Enviamos um novo link de confirmação para o seu e-mail.", "unverified"],
		["Esta conta foi bloqueada", "server"],
	])(
		// Each backend AuthenticationError detail (app/auth/service.py) must land in
		// its own login_error bucket -- selolibertaria_backend#68 added the
		// "unverified" case, which must not collapse into the generic "server"
		// bucket the way it would have before this route knew about it.
		"maps backend detail %j to login_error=%s",
		async (detail, expectedBucket) => {
			vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json({ detail }, { status: 401 }));

			const res = await POST(formRequest({ username: "reader@example.com", password: "wrong" }));

			expect(res.status).toBe(303);
			expect(res.headers.get("location")).toBe(`http://localhost:3001/login?login_error=${expectedBucket}`);
		},
	);
});
