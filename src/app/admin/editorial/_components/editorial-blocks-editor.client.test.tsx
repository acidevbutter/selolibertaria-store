import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

/** jsdom doesn't implement DataTransfer -- a plain object with the two
 *  methods the component calls, sharing state across dragstart/drop like a
 *  real drag operation does. */
function fakeDataTransfer() {
	const store = new Map<string, string>();
	return {
		effectAllowed: "",
		setData: (type: string, value: string) => store.set(type, value),
		getData: (type: string) => store.get(type) ?? "",
	};
}

describe("EditorialBlocksEditor", () => {
	afterEach(() => {
		cleanup();
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

	it("inserts a new block right after a specific one via its hover '+' button", () => {
		const { container } = render(<EditorialBlocksEditor name="content" initialDoc={doc()} />);

		const addButtons = screen.getAllByRole("button", { name: "Inserir bloco abaixo" });
		fireEvent.click(addButtons[0]); // opens the picker anchored to the first block, not the end

		const dialog = screen.getByRole("dialog", { name: "Inserir bloco" });
		const row = within(dialog).getByText("Separador").closest("button") as HTMLButtonElement;
		fireEvent.click(row);

		const next = hiddenValue(container, "content");
		expect(next.map((block) => block.type)).toEqual(["paragraph", "divider", "paragraph"]);
		expect(screen.queryByRole("dialog", { name: "Inserir bloco" })).toBeNull();
	});

	describe("block picker modal", () => {
		function openPicker() {
			render(<EditorialBlocksEditor name="content" initialDoc={doc()} />);
			fireEvent.click(screen.getAllByRole("button", { name: "Inserir bloco abaixo" })[0]);
			return screen.getByRole("dialog", { name: "Inserir bloco" });
		}

		it("closes when the backdrop outside it is clicked", () => {
			openPicker();
			fireEvent.mouseDown(screen.getByTestId("insert-dialog-backdrop"));
			expect(screen.queryByRole("dialog", { name: "Inserir bloco" })).toBeNull();
		});

		it("stays open when the click lands inside the dialog", () => {
			const dialog = openPicker();
			fireEvent.mouseDown(dialog);
			expect(screen.getByRole("dialog", { name: "Inserir bloco" })).toBeTruthy();
		});

		it("closes on Escape, wherever the focus is", () => {
			openPicker();
			fireEvent.keyDown(window, { key: "Escape" });
			expect(screen.queryByRole("dialog", { name: "Inserir bloco" })).toBeNull();
		});

		it("is a centred overlay whose option list scrolls on its own", () => {
			const dialog = openPicker();
			expect(screen.getByTestId("insert-dialog-backdrop").className).toContain("ad-scrim-center");
			expect(dialog.className).toContain("ad-popover-modal");
			expect(dialog.querySelector(".ad-popover-results")).not.toBeNull();
		});

		it("filters by typing and inserts the highlighted type on Enter, then closes", () => {
			const { container } = render(<EditorialBlocksEditor name="content" initialDoc={doc()} />);
			fireEvent.click(screen.getAllByRole("button", { name: "Inserir bloco abaixo" })[0]);
			const input = screen.getByPlaceholderText("digite para filtrar");
			fireEvent.change(input, { target: { value: "separ" } });
			fireEvent.keyDown(input, { key: "Enter" });

			expect(hiddenValue(container, "content").map((block) => block.type)).toEqual([
				"paragraph",
				"divider",
				"paragraph",
			]);
			expect(screen.queryByRole("dialog", { name: "Inserir bloco" })).toBeNull();
		});

		it("moves the highlight with the arrow keys", () => {
			openPicker();
			const input = screen.getByPlaceholderText("digite para filtrar");
			fireEvent.keyDown(input, { key: "ArrowDown" });
			const current = screen
				.getAllByRole("button")
				.filter((el) => el.getAttribute("aria-current") === "true");
			expect(current).toHaveLength(1);
			expect(screen.getAllByRole("button").filter((el) => el.className.includes("ad-row"))[1]).toBe(
				current[0],
			);
		});

		it("says so when nothing matches", () => {
			openPicker();
			fireEvent.change(screen.getByPlaceholderText("digite para filtrar"), { target: { value: "zzzz" } });
			expect(screen.getByText("Nenhum tipo encontrado.")).toBeTruthy();
		});
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

	it("reorders blocks inside the canvas by dragging a block's bar and dropping on the paper", () => {
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

		const bars = container.querySelectorAll(".ad-bbar");
		const paper = container.querySelector(".ad-paper") as HTMLElement;
		// A real drag keeps the same DataTransfer across dragstart/dragover/drop.
		const dataTransfer = fakeDataTransfer();

		fireEvent.dragStart(bars[0], { dataTransfer }); // grab "primeiro"
		// Dropping on the paper itself (no block hovered) appends at the end.
		fireEvent.drop(paper, { dataTransfer });

		expect(hiddenValue(container, "content").map((b) => b.id)).toEqual(["b", "c", "a"]);
	});

	it("shows the block being dragged from the canvas as dimmed until the drag ends", () => {
		const { container } = render(<EditorialBlocksEditor name="content" initialDoc={doc()} />);
		const bars = container.querySelectorAll(".ad-bbar");
		const blocks = container.querySelectorAll(".ad-blk");

		fireEvent.dragStart(bars[0], { dataTransfer: fakeDataTransfer() });
		expect(blocks[0]).toHaveStyle({ opacity: "0.4" });

		fireEvent.dragEnd(bars[0]);
		expect(blocks[0]).not.toHaveStyle({ opacity: "0.4" });
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

	it("changes the image preview's width when picking a different shape (not just the stored layout)", () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "n/a" }), { status: 500 })),
		);
		URL.createObjectURL = vi.fn(() => "blob:mock");

		const { container } = render(<EditorialBlocksEditor name="content" initialDoc={[]} />);
		const paper = container.querySelector(".ad-paper") as HTMLElement;
		fireEvent.drop(paper, { dataTransfer: { files: [new File(["x"], "p.png", { type: "image/png" })] } });

		// The shape picker opens automatically after a drop; default layout is "wide".
		// Scoped to .ad-blk (the canvas block) -- the always-mounted "Ver como
		// fica" preview renders its own <img> for the same block via a
		// completely different layout system (Tailwind classes, not this style).
		const wrapper = () => container.querySelector(".ad-blk img")?.parentElement?.parentElement as HTMLElement;
		expect(wrapper()).toHaveStyle({ width: "100%" });

		fireEvent.click(screen.getByRole("button", { name: "Ao lado" }));
		expect(hiddenValue(container, "content")[0]).toMatchObject({ layout: "side" });
		expect(wrapper()).toHaveStyle({ width: "260px" });

		fireEvent.click(screen.getByRole("button", { name: "Centralizada" }));
		expect(hiddenValue(container, "content")[0]).toMatchObject({ layout: "center" });
		expect(wrapper()).toHaveStyle({ width: "440px", marginInline: "auto" });
	});

	it("fills an existing empty image block instead of inserting a new one when a file lands on it", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ url: "https://cdn.example/real.jpg", publicId: "abc123" }), {
				status: 200,
			}),
		);
		vi.stubGlobal("fetch", fetchMock);
		URL.createObjectURL = vi.fn(() => "blob:mock");

		const initial: EditorialContentDoc = [
			{ id: "a", type: "paragraph", text: "primeiro parágrafo" },
			{
				id: "img",
				type: "image",
				assetId: "",
				cropId: null,
				src: "",
				layout: "wide",
				align: null,
				caption: null,
				href: null,
				alt: null,
			},
		];
		const { container } = render(<EditorialBlocksEditor name="content" initialDoc={initial} />);
		const emptyImageBlock = container.querySelectorAll(".ad-blk")[1] as HTMLElement;
		const file = new File(["fake"], "photo.png", { type: "image/png" });

		fireEvent.dragOver(emptyImageBlock);
		expect(screen.getByText("Solte para usar nesta imagem")).toBeInTheDocument();

		fireEvent.drop(emptyImageBlock, { dataTransfer: { files: [file] } });

		await waitFor(() => {
			const next = hiddenValue(container, "content");
			expect(next).toHaveLength(2);
			expect(next[1]).toMatchObject({ id: "img", src: "https://cdn.example/real.jpg", assetId: "abc123" });
		});
	});

	it("toggles a block between full row and half row, side by side in the canvas", () => {
		const { container } = render(
			<EditorialBlocksEditor
				name="content"
				initialDoc={[
					{ id: "a", type: "paragraph", text: "primeiro" },
					{ id: "b", type: "paragraph", text: "segundo" },
				]}
			/>,
		);
		const canvasWrapper = (index: number) =>
			container.querySelectorAll(".ad-paper > div")[index] as HTMLElement;

		expect(canvasWrapper(0)).toHaveStyle({ width: "100%" });
		expect(hiddenValue(container, "content")[0].width).toBeUndefined();

		fireEvent.click(screen.getAllByRole("button", { name: "Linha inteira" })[0]);
		expect(hiddenValue(container, "content")[0]).toMatchObject({ width: "half" });
		expect(canvasWrapper(0)).toHaveStyle({ width: "calc(50% - 10px)" });

		fireEvent.click(screen.getByRole("button", { name: "Metade" }));
		expect(hiddenValue(container, "content")[0]).toMatchObject({ width: "full" });
		expect(canvasWrapper(0)).toHaveStyle({ width: "100%" });
	});

	it("mirrors the block width toggle and the image layout in EditorialBlocksRenderer (ver como fica)", () => {
		render(
			<EditorialBlocksEditor
				name="content"
				initialDoc={[{ id: "a", type: "heading", level: 2, text: "Meio a meio" }]}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Linha inteira" }));
		fireEvent.click(screen.getByRole("button", { name: "Ver como fica" }));

		const dialog = screen.getByRole("dialog", { name: "Ver como fica" });
		const previewWrapper = within(dialog).getByText("Meio a meio").closest("div.clear-both") as HTMLElement;
		expect(previewWrapper.className).toContain("sm:w-[calc(50%-10px)]");
	});

	it("edits an image's credit separately from its caption", () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "n/a" }), { status: 500 })),
		);
		URL.createObjectURL = vi.fn(() => "blob:mock");

		const { container } = render(<EditorialBlocksEditor name="content" initialDoc={[]} />);
		const paper = container.querySelector(".ad-paper") as HTMLElement;
		fireEvent.drop(paper, { dataTransfer: { files: [new File(["x"], "p.png", { type: "image/png" })] } });

		const credit = screen.getByRole("textbox", { name: "Crédito" });
		credit.textContent = "Foto: Alguém";
		fireEvent.input(credit);

		const caption = screen.getByRole("textbox", { name: "Legenda" });
		caption.textContent = "Uma legenda";
		fireEvent.input(caption);

		expect(hiddenValue(container, "content")[0]).toMatchObject({
			credit: "Foto: Alguém",
			caption: "Uma legenda",
		});
	});

	it("focuses the credit field when 'Crédito' is clicked, same as 'Legenda' does for the caption", () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "n/a" }), { status: 500 })),
		);
		URL.createObjectURL = vi.fn(() => "blob:mock");

		render(<EditorialBlocksEditor name="content" initialDoc={[]} />);
		const paper = document.querySelector(".ad-paper") as HTMLElement;
		fireEvent.drop(paper, { dataTransfer: { files: [new File(["x"], "p.png", { type: "image/png" })] } });

		fireEvent.click(screen.getByRole("button", { name: "Crédito" }));
		expect(screen.getByRole("textbox", { name: "Crédito" })).toHaveFocus();
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
