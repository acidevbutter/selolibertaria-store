import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EditorialContentDoc } from "@/lib/editorial-blocks";
import { EditorialBlocksEditor } from "./editorial-blocks-editor.client";

function doc(): EditorialContentDoc {
	return [
		{ id: "a", type: "paragraph", text: "primeiro parágrafo" },
		{ id: "b", type: "paragraph", text: "segundo parágrafo" },
	];
}

function hiddenValue(container: HTMLElement, name: string) {
	const input = container.querySelector(`input[name="${name}"]`) as HTMLInputElement;
	return JSON.parse(input.value) as EditorialContentDoc;
}

describe("EditorialBlocksEditor", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("inserts a divider block via the toolbar without touching code", () => {
		const { container } = render(<EditorialBlocksEditor name="content" initialDoc={doc()} />);
		fireEvent.click(screen.getByRole("button", { name: "Separador" }));

		const next = hiddenValue(container, "content");
		expect(next).toHaveLength(3);
		expect(next.some((block) => block.type === "divider")).toBe(true);
	});

	it("duplicates and removes a block via its hover controls", () => {
		const { container } = render(<EditorialBlocksEditor name="content" initialDoc={doc()} />);

		fireEvent.click(screen.getAllByRole("button", { name: "Duplicar" })[0]);
		expect(hiddenValue(container, "content")).toHaveLength(3);

		fireEvent.click(screen.getAllByRole("button", { name: "Remover" })[0]);
		expect(hiddenValue(container, "content")).toHaveLength(2);
	});

	it("undoes an insertion back to the original document", () => {
		const { container } = render(<EditorialBlocksEditor name="content" initialDoc={doc()} />);

		fireEvent.click(screen.getByRole("button", { name: "Separador" }));
		expect(hiddenValue(container, "content")).toHaveLength(3);

		fireEvent.click(screen.getByRole("button", { name: "Desfazer" }));
		expect(hiddenValue(container, "content")).toEqual(doc());
	});

	it("never exposes a font, color, size or spacing control (fatia 02 hard limit)", () => {
		const { container } = render(<EditorialBlocksEditor name="content" initialDoc={doc()} />);
		// Whole words only: "Recortar" legitimately contains "cor", and the limit is
		// about controls FOR colour/font/size/spacing, not about those letters.
		const forbidden = ["fonte", "font", "cor", "cores", "color", "tamanho", "espaçamento", "spacing"];
		const labels = Array.from(container.querySelectorAll("[aria-label], [title]")).map(
			(el) => el.getAttribute("aria-label") ?? el.getAttribute("title") ?? "",
		);
		for (const label of labels) {
			for (const term of forbidden) {
				expect(label.toLowerCase()).not.toMatch(new RegExp(`\\b${term}\\b`));
			}
		}
	});

	it("moves a block down and up via the fixed direction buttons, disabling at the edges", () => {
		const { container } = render(<EditorialBlocksEditor name="content" initialDoc={doc()} />);

		const downButtons = screen.getAllByRole("button", { name: "Mover para baixo" });
		// First block can move down, second (last) can't.
		expect(downButtons[0]).toBeEnabled();
		expect(downButtons[1]).toBeDisabled();
		fireEvent.click(downButtons[0]);
		expect(hiddenValue(container, "content").map((b) => b.id)).toEqual(["b", "a"]);

		const upButtons = screen.getAllByRole("button", { name: "Mover para cima" });
		expect(upButtons[0]).toBeDisabled();
		expect(upButtons[1]).toBeEnabled();
	});

	it("reorders blocks by dragging one row onto another in the outline", () => {
		const { container } = render(
			<EditorialBlocksEditor
				name="content"
				initialDoc={[
					{ id: "a", type: "paragraph", text: "primeiro" },
					{ id: "b", type: "paragraph", text: "segundo" },
					{ id: "c", type: "paragraph", text: "terceiro" },
				]}
			/>,
		);

		const rows = screen.getAllByText(/^0[1-3]$/).map((el) => el.closest("button") as HTMLButtonElement);
		fireEvent.dragStart(rows[2]);
		fireEvent.drop(rows[0]);

		expect(hiddenValue(container, "content").map((b) => b.id)).toEqual(["c", "a", "b"]);
	});

	it("uploads a dropped image to the real backend and clears the pending blob src", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ url: "https://cdn.example/real.jpg", publicId: "abc123" }), {
				status: 200,
			}),
		);
		vi.stubGlobal("fetch", fetchMock);
		URL.createObjectURL = vi.fn(() => "blob:mock");

		const { container } = render(<EditorialBlocksEditor name="content" initialDoc={[]} />);
		const paper = container.querySelector(".ad-paper") as HTMLElement;
		const file = new File(["fake"], "photo.png", { type: "image/png" });

		fireEvent.drop(paper, { dataTransfer: { files: [file] } });

		await waitFor(() => {
			const next = hiddenValue(container, "content");
			expect(next).toHaveLength(1);
			expect(next[0]).toMatchObject({
				type: "image",
				src: "https://cdn.example/real.jpg",
				assetId: "abc123",
			});
		});
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/admin/media/upload",
			expect.objectContaining({ method: "POST" }),
		);
	});

	it("shows an error and keeps the block if the upload fails", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Falhou" }), { status: 500 })),
		);
		URL.createObjectURL = vi.fn(() => "blob:mock");

		const { container } = render(<EditorialBlocksEditor name="content" initialDoc={[]} />);
		const paper = container.querySelector(".ad-paper") as HTMLElement;
		const file = new File(["fake"], "photo.png", { type: "image/png" });
		fireEvent.drop(paper, { dataTransfer: { files: [file] } });

		await screen.findByText("Falhou");
		expect(hiddenValue(container, "content")[0]).toMatchObject({ src: "blob:mock" });
	});

	it("opens 'Ver como fica' and renders the current draft", () => {
		render(<EditorialBlocksEditor name="content" initialDoc={doc()} />);
		fireEvent.click(screen.getByRole("button", { name: "Ver como fica" }));
		const dialog = screen.getByRole("dialog", { name: "Ver como fica" });
		expect(within(dialog).getByText("primeiro parágrafo")).toBeInTheDocument();
	});

	it("disables 'Voltar ao publicado' when there is nothing published yet", () => {
		render(<EditorialBlocksEditor name="content" initialDoc={doc()} />);
		expect(screen.getByRole("button", { name: "Voltar ao publicado" })).toBeDisabled();
	});

	it("reverts the draft to the published version on confirm", () => {
		const published: EditorialContentDoc = [{ id: "p", type: "paragraph", text: "versão publicada" }];
		vi.spyOn(window, "confirm").mockReturnValue(true);
		const { container } = render(
			<EditorialBlocksEditor name="content" initialDoc={doc()} initialPublishedDoc={published} />,
		);

		const revertButton = screen.getByRole("button", { name: "Voltar ao publicado" });
		expect(revertButton).toBeEnabled();
		fireEvent.click(revertButton);
		expect(hiddenValue(container, "content")).toEqual(published);
	});
});
