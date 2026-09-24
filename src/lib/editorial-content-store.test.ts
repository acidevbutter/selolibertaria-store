import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/env.mjs", () => ({
	env: { FASTAPI_API_URL: "http://fastapi.test", FASTAPI_INTERNAL_API_KEY: "internal" },
}));
vi.mock("server-only", () => ({}));

const editorialItem = (overrides: Record<string, unknown> = {}) => ({
	id: "1",
	type: "event",
	slug: "sarau-oculto",
	title: "Sarau oculto",
	content: {},
	published: false,
	order: 1,
	created_at: "2026-01-01T00:00:00Z",
	updated_at: "2026-01-01T00:00:00Z",
	...overrides,
});

describe("getEditorialEventRecordBySlug", () => {
	afterEach(() => vi.restoreAllMocks());

	it("looks up the admin (not public, published-only) endpoint, so unpublished events are findable", async () => {
		const fetchMock = vi
			.spyOn(global, "fetch")
			.mockResolvedValue(new Response(JSON.stringify([editorialItem()]), { status: 200 }));

		const { getEditorialEventRecordBySlug } = await import("@/lib/editorial-content-store");
		const result = await getEditorialEventRecordBySlug("sarau-oculto");

		expect(fetchMock).toHaveBeenCalledWith(
			"http://fastapi.test/editorial/internal/admin/event",
			expect.objectContaining({ headers: { "X-Internal-API-Key": "internal" } }),
		);
		expect(result?.slug).toBe("sarau-oculto");
	});
});

describe("getEditorialProjectRecordBySlugForAdmin", () => {
	afterEach(() => vi.restoreAllMocks());

	it("looks up the admin endpoint so an unpublished project is still findable by its own detail page", async () => {
		const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
			new Response(JSON.stringify([editorialItem({ type: "project", slug: "projeto-em-rascunho" })]), {
				status: 200,
			}),
		);

		const { getEditorialProjectRecordBySlugForAdmin } = await import("@/lib/editorial-content-store");
		const result = await getEditorialProjectRecordBySlugForAdmin("projeto-em-rascunho");

		expect(fetchMock).toHaveBeenCalledWith(
			"http://fastapi.test/editorial/internal/admin/project",
			expect.objectContaining({ headers: { "X-Internal-API-Key": "internal" } }),
		);
		expect(result?.slug).toBe("projeto-em-rascunho");
	});
});

describe("getEditorialProjectRecordBySlug (public)", () => {
	afterEach(() => vi.restoreAllMocks());

	it("still uses the published-only public endpoint, unaffected by the admin variant", async () => {
		const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
			new Response(JSON.stringify([editorialItem({ type: "project", slug: "projeto-publico" })]), {
				status: 200,
			}),
		);

		const { getEditorialProjectRecordBySlug } = await import("@/lib/editorial-content-store");
		await getEditorialProjectRecordBySlug("projeto-publico");

		expect(fetchMock).toHaveBeenCalledWith(
			"http://fastapi.test/editorial/public/project",
			expect.objectContaining({ headers: undefined }),
		);
	});
});
