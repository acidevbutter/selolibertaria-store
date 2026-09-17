import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
	auth: async () => ({ user: { role: "admin", name: "Marina", email: "marina@selo.test" } }),
}));

const { publishEditorialDraftAction } = await import("@/app/admin/editorial/blocks-actions");

function form(fields: Record<string, string>) {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.set(key, value);
	return data;
}

const paragraph = { id: "b1", type: "paragraph", text: "Uma noite de leitura aberta." };

describe("publishEditorialDraftAction", () => {
	it("publishes a valid document and reports its blocks and images", async () => {
		const state = await publishEditorialDraftAction(
			{ status: "idle" },
			form({ contentDoc: JSON.stringify([paragraph]) }),
		);

		expect(state.status).toBe("published");
		if (state.status !== "published") return;
		expect(state.blocks).toBe(1);
		expect(state.images).toBe(0);
	});

	it("refuses a forged twelfth type with 422 instead of rendering it silently", async () => {
		const state = await publishEditorialDraftAction(
			{ status: "idle" },
			form({ contentDoc: JSON.stringify([{ id: "x", type: "carousel", slides: [] }]) }),
		);

		expect(state).toMatchObject({ status: "invalid", code: 422 });
	});

	it("refuses to publish while an image is still uploading, naming the saved draft", async () => {
		const pending = { id: "b2", type: "image", assetId: "a", src: "blob:x", layout: "wide" };
		const state = await publishEditorialDraftAction(
			{ status: "idle" },
			form({ contentDoc: JSON.stringify([paragraph, pending]) }),
		);

		expect(state.status).toBe("failed");
		if (state.status !== "failed") return;
		expect(state.message).toContain("A imagem 2 não terminou de subir");
		expect(state.message).toContain("O rascunho está salvo às");
	});

	it("stops a publish over a page someone else published meanwhile", async () => {
		const state = await publishEditorialDraftAction(
			{ status: "idle" },
			form({
				contentDoc: JSON.stringify([paragraph]),
				publishedAt: "2026-09-14T10:00:00.000Z",
				serverPublishedAt: "2026-09-14T14:10:00.000Z",
			}),
		);

		expect(state.status).toBe("conflict");
		if (state.status !== "conflict") return;
		expect(state.message).toContain("Veja o que mudou antes de publicar por cima.");
	});
});
