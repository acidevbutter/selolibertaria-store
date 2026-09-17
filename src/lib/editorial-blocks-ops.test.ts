import { describe, expect, it } from "vitest";
import type { EditorialContentDoc } from "@/lib/editorial-blocks";
import {
	convertTextBlockLevel,
	createEmptyBlock,
	duplicateBlock,
	insertBlockAfter,
	moveBlock,
	moveBlockToIndex,
	removeBlock,
	reorderBlock,
	updateBlock,
} from "@/lib/editorial-blocks-ops";

function doc(): EditorialContentDoc {
	return [
		{ id: "a", type: "paragraph", text: "primeiro" },
		{ id: "b", type: "paragraph", text: "segundo" },
		{ id: "c", type: "paragraph", text: "terceiro" },
	];
}

describe("editorial-blocks-ops", () => {
	it("creates an empty block for every closed type without throwing", () => {
		const types = [
			"heading",
			"paragraph",
			"list",
			"quote",
			"highlight",
			"image",
			"gallery",
			"button",
			"divider",
			"productShelf",
			"agenda",
		] as const;
		for (const type of types) {
			expect(createEmptyBlock(type).type).toBe(type);
		}
	});

	it("inserts a block right after a given id", () => {
		const next = insertBlockAfter(doc(), "b", createEmptyBlock("divider"));
		expect(next.map((block) => block.id)).toEqual(["a", "b", next[2].id, "c"]);
		expect(next[2].type).toBe("divider");
	});

	it("removes a block by id", () => {
		const next = removeBlock(doc(), "b");
		expect(next.map((block) => block.id)).toEqual(["a", "c"]);
	});

	it("duplicates a block with a new id, right after the original", () => {
		const next = duplicateBlock(doc(), "b");
		expect(next).toHaveLength(4);
		expect(next[1].id).toBe("b");
		expect(next[2].id).not.toBe("b");
		expect(next[2].type).toBe("paragraph");
	});

	it("moves a block up and down, no-op at the edges", () => {
		expect(moveBlock(doc(), "b", "up").map((b) => b.id)).toEqual(["b", "a", "c"]);
		expect(moveBlock(doc(), "b", "down").map((b) => b.id)).toEqual(["a", "c", "b"]);
		expect(moveBlock(doc(), "a", "up").map((b) => b.id)).toEqual(["a", "b", "c"]);
		expect(moveBlock(doc(), "c", "down").map((b) => b.id)).toEqual(["a", "b", "c"]);
	});

	it("drops a dragged block where the drop target currently sits", () => {
		expect(reorderBlock(doc(), "c", "a").map((b) => b.id)).toEqual(["c", "a", "b"]);
		expect(reorderBlock(doc(), "a", "c").map((b) => b.id)).toEqual(["b", "c", "a"]);
	});

	it("is a no-op when reordering onto itself or an unknown id", () => {
		expect(reorderBlock(doc(), "b", "b")).toEqual(doc());
		expect(reorderBlock(doc(), "missing", "a")).toEqual(doc());
		expect(reorderBlock(doc(), "a", "missing")).toEqual(doc());
	});

	it("drops a block at the target index, accounting for the removal shift (canvas drag)", () => {
		// Dragging "c" (index 2) to "before index 0" -- no shift needed since the
		// removal happens after the target.
		expect(moveBlockToIndex(doc(), "c", 0).map((b) => b.id)).toEqual(["c", "a", "b"]);
		// Dragging "a" (index 0) to "before index 2" -- the removal shifts the
		// target left by one, landing "a" between "b" and "c", not after "c".
		expect(moveBlockToIndex(doc(), "a", 2).map((b) => b.id)).toEqual(["b", "a", "c"]);
		// Dropping past the end appends.
		expect(moveBlockToIndex(doc(), "a", doc().length).map((b) => b.id)).toEqual(["b", "c", "a"]);
		// Unknown id is a no-op.
		expect(moveBlockToIndex(doc(), "missing", 1)).toEqual(doc());
	});

	it("patches a single block's fields without touching the others", () => {
		const next = updateBlock(doc(), "b", { text: "editado" });
		expect(next[1]).toMatchObject({ id: "b", text: "editado" });
		expect(next[0]).toEqual(doc()[0]);
	});

	it("converts a paragraph to a heading and back, keeping the text", () => {
		const asH2 = convertTextBlockLevel(doc(), "b", 2);
		expect(asH2[1]).toMatchObject({ type: "heading", level: 2, text: "segundo" });

		const backToParagraph = convertTextBlockLevel(asH2, "b", "paragraph");
		expect(backToParagraph[1]).toMatchObject({ type: "paragraph", text: "segundo" });
	});

	it("leaves non-text blocks untouched by the level converter", () => {
		const withDivider = insertBlockAfter(doc(), "b", createEmptyBlock("divider"));
		const dividerId = withDivider[2].id;
		expect(convertTextBlockLevel(withDivider, dividerId, 2)[2]).toEqual(withDivider[2]);
	});
});
