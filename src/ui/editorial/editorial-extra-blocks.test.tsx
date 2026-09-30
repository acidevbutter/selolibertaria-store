import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { EditorialContentDoc } from "@/lib/editorial-blocks";
import { EditorialExtraBlocks, editorAddedBlocks } from "./editorial-extra-blocks";

const doc: EditorialContentDoc = [
	{ id: "sarau-hero-title", type: "heading", level: 2, text: "Título semeado" },
	{ id: "sarau-hero-body", type: "paragraph", text: "Texto semeado" },
	{ id: "blk_lm1x2y_1", type: "paragraph", text: "Parágrafo novo da editora" },
	{ id: "blk_lm1x2y_2", type: "heading", level: 2, text: "Título novo" },
];

describe("editorAddedBlocks", () => {
	it("keeps only blocks created in the editor, never the seeded slot blocks", () => {
		expect(editorAddedBlocks(doc).map((block) => block.id)).toEqual(["blk_lm1x2y_1", "blk_lm1x2y_2"]);
	});

	it("tolerates a missing document", () => {
		expect(editorAddedBlocks(null)).toEqual([]);
		expect(editorAddedBlocks(undefined)).toEqual([]);
	});
});

describe("EditorialExtraBlocks", () => {
	afterEach(cleanup);

	it("renders editor-added blocks and leaves seeded ones to the page's own slots", () => {
		render(<EditorialExtraBlocks doc={doc} />);

		expect(screen.getByText("Parágrafo novo da editora")).toBeTruthy();
		expect(screen.getByText("Título novo")).toBeTruthy();
		expect(screen.queryByText("Título semeado")).toBeNull();
		expect(screen.queryByText("Texto semeado")).toBeNull();
	});

	it("renders nothing when there is nothing to add", () => {
		const { container } = render(<EditorialExtraBlocks doc={doc.slice(0, 2)} />);
		expect(container.innerHTML).toBe("");
	});
});
