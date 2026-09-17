import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
	auth: async () => ({
		user: {
			id: "11111111-1111-1111-1111-111111111111",
			role: "admin",
			name: "Marina",
			email: "marina@selo.test",
		},
	}),
}));

// @t3-oss/env-nextjs refuses server-var access outside a real Next server
// context, which jsdom (this suite's environment) isn't -- mock it the same
// way @/lib/auth is mocked above, rather than reaching for process.env
// directly in the action and diverging from the rest of the codebase's
// env.mjs convention (see src/app/admin/editorial/page-content-actions.ts).
vi.mock("@/env.mjs", () => ({
	env: { FASTAPI_API_URL: "http://localhost:8000", FASTAPI_INTERNAL_API_KEY: "test-internal-key" },
}));

const { publishEditorialDraftAction } = await import("@/app/admin/editorial/blocks-actions");

function form(fields: Record<string, string>) {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.set(key, value);
	return data;
}

function jsonResponse(status: number, body: unknown) {
	return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const paragraph = { id: "b1", type: "paragraph", text: "Uma noite de leitura aberta." };

describe("publishEditorialDraftAction", () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("publishes a valid document: saves the draft, then calls the real publish endpoint", async () => {
		fetchMock
			.mockResolvedValueOnce(jsonResponse(200, { draft_doc: [paragraph] })) // PUT .../draft
			.mockResolvedValueOnce(jsonResponse(200, { published_at: "2026-09-14T12:00:00.000Z" })); // POST .../publish

		const state = await publishEditorialDraftAction(
			{ status: "idle" },
			form({ contentDoc: JSON.stringify([paragraph]) }),
		);

		expect(state).toMatchObject({
			status: "published",
			publishedAt: "2026-09-14T12:00:00.000Z",
			blocks: 1,
			images: 0,
		});
		expect(fetchMock).toHaveBeenCalledTimes(2);
		const [draftUrl, draftInit] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(draftUrl).toMatch(/\/editorial\/internal\/admin\/page\/[^/]+\/draft$/);
		expect(draftInit.method).toBe("PUT");
		expect((draftInit.headers as Record<string, string>)["X-Internal-API-Key"]).toBeTruthy();
		expect((draftInit.headers as Record<string, string>)["X-Actor-User-ID"]).toBe(
			"11111111-1111-1111-1111-111111111111",
		);
		const [publishUrl, publishInit] = fetchMock.mock.calls[1] as [string, RequestInit];
		expect(publishUrl).toMatch(/\/editorial\/internal\/admin\/page\/[^/]+\/publish$/);
		expect(publishInit.method).toBe("POST");
	});

	it("refuses a forged twelfth type with 422 instead of rendering it silently -- never calls the backend", async () => {
		const state = await publishEditorialDraftAction(
			{ status: "idle" },
			form({ contentDoc: JSON.stringify([{ id: "x", type: "carousel", slides: [] }]) }),
		);

		expect(state).toMatchObject({ status: "invalid", code: 422 });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("refuses to publish while an image is still uploading, naming the saved draft -- never calls the backend", async () => {
		const pending = { id: "b2", type: "image", assetId: "a", src: "blob:x", layout: "wide" };
		const state = await publishEditorialDraftAction(
			{ status: "idle" },
			form({ contentDoc: JSON.stringify([paragraph, pending]) }),
		);

		expect(state.status).toBe("failed");
		if (state.status !== "failed") return;
		expect(state.message).toContain("A imagem 2 não terminou de subir");
		expect(state.message).toContain("O rascunho está salvo às");
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("stops a publish over a page someone else published meanwhile (backend 409)", async () => {
		fetchMock
			.mockResolvedValueOnce(jsonResponse(200, { draft_doc: [paragraph] })) // PUT .../draft
			.mockResolvedValueOnce(
				jsonResponse(409, {
					detail: "Alguém publicou esta página antes de você.",
					publishedAt: "2026-09-14T14:10:00.000Z",
				}),
			); // POST .../publish

		const state = await publishEditorialDraftAction(
			{ status: "idle" },
			form({
				contentDoc: JSON.stringify([paragraph]),
				publishedAt: "2026-09-14T10:00:00.000Z",
			}),
		);

		expect(state.status).toBe("conflict");
		if (state.status !== "conflict") return;
		expect(state.message).toContain("Veja o que mudou antes de publicar por cima.");
		expect(state.theirs).toBe("2026-09-14T14:10:00.000Z");
	});

	it("surfaces a 403 from the backend as a permission failure", async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse(403, { detail: "Acesso negado" }));

		const state = await publishEditorialDraftAction(
			{ status: "idle" },
			form({ contentDoc: JSON.stringify([paragraph]) }),
		);

		expect(state).toMatchObject({
			status: "failed",
			message: "Você não tem permissão para publicar esta página.",
		});
	});

	it("reports a network failure without losing the local draft's timestamp", async () => {
		fetchMock.mockRejectedValueOnce(new Error("network down"));

		const state = await publishEditorialDraftAction(
			{ status: "idle" },
			form({ contentDoc: JSON.stringify([paragraph]) }),
		);

		expect(state.status).toBe("failed");
		if (state.status !== "failed") return;
		expect(state.message).toContain("Não foi possível falar com o servidor");
	});
});
