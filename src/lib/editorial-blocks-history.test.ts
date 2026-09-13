import { describe, expect, it } from "vitest";
import type { EditorialContentDoc } from "@/lib/editorial-blocks";
import {
	EDITORIAL_BLOCKS_HISTORY_LIMIT,
	initEditorialBlocksHistory,
	pushEditorialBlocksHistory,
	redoEditorialBlocksHistory,
	undoEditorialBlocksHistory,
} from "@/lib/editorial-blocks-history";

function docWithText(text: string): EditorialContentDoc {
	return [{ id: "a", type: "paragraph", text }];
}

describe("editorial-blocks-history", () => {
	it("undoes and redoes a single step", () => {
		let state = initEditorialBlocksHistory(docWithText("v0"));
		state = pushEditorialBlocksHistory(state, docWithText("v1"));
		state = undoEditorialBlocksHistory(state);
		expect(state.doc).toEqual(docWithText("v0"));
		state = redoEditorialBlocksHistory(state);
		expect(state.doc).toEqual(docWithText("v1"));
	});

	it("is a no-op undo/redo at the boundaries", () => {
		const state = initEditorialBlocksHistory(docWithText("v0"));
		expect(undoEditorialBlocksHistory(state)).toBe(state);
		expect(redoEditorialBlocksHistory(state)).toBe(state);
	});

	it("caps history at 10 steps (acceptance: desfazer funciona em 10 passos)", () => {
		let state = initEditorialBlocksHistory(docWithText("v0"));
		for (let i = 1; i <= 15; i++) {
			state = pushEditorialBlocksHistory(state, docWithText(`v${i}`));
		}
		expect(state.past).toHaveLength(EDITORIAL_BLOCKS_HISTORY_LIMIT);

		let undone = state;
		for (let i = 0; i < EDITORIAL_BLOCKS_HISTORY_LIMIT; i++) {
			undone = undoEditorialBlocksHistory(undone);
		}
		expect(undone.doc).toEqual(docWithText("v5"));
		expect(undoEditorialBlocksHistory(undone)).toBe(undone);
	});

	it("clears future on a new push after an undo", () => {
		let state = initEditorialBlocksHistory(docWithText("v0"));
		state = pushEditorialBlocksHistory(state, docWithText("v1"));
		state = undoEditorialBlocksHistory(state);
		state = pushEditorialBlocksHistory(state, docWithText("v2"));
		expect(state.future).toHaveLength(0);
		expect(redoEditorialBlocksHistory(state)).toBe(state);
	});
});
