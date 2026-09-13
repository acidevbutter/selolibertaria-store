import { describe, expect, it } from "vitest";
import type { EditorialContentDoc } from "@/lib/editorial-blocks";
import {
	convertTextBlockLevel,
	createEmptyBlock,
	duplicateBlock,
	insertBlockAfter,
	moveBlock,
	removeBlock,
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
