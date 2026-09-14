import type { EditorialContentDoc } from "@/lib/editorial-blocks";

/** Acceptance criteria for fatia 02.4 calls for undo across 10 steps. */
export const EDITORIAL_BLOCKS_HISTORY_LIMIT = 10;

export type EditorialBlocksHistory = {
	doc: EditorialContentDoc;
	past: EditorialContentDoc[];
	future: EditorialContentDoc[];
};

export function initEditorialBlocksHistory(doc: EditorialContentDoc): EditorialBlocksHistory {
	return { doc, past: [], future: [] };
}

export function pushEditorialBlocksHistory(
	state: EditorialBlocksHistory,
	next: EditorialContentDoc,
): EditorialBlocksHistory {
	if (next === state.doc) return state;
	return {
		doc: next,
		past: [...state.past, state.doc].slice(-EDITORIAL_BLOCKS_HISTORY_LIMIT),
		future: [],
	};
}

export function undoEditorialBlocksHistory(state: EditorialBlocksHistory): EditorialBlocksHistory {
	if (state.past.length === 0) return state;
	const previous = state.past[state.past.length - 1] as EditorialContentDoc;
	return {
		doc: previous,
		past: state.past.slice(0, -1),
		future: [state.doc, ...state.future],
	};
}

export function redoEditorialBlocksHistory(state: EditorialBlocksHistory): EditorialBlocksHistory {
	if (state.future.length === 0) return state;
	const [next, ...rest] = state.future;
	return {
		doc: next as EditorialContentDoc,
		past: [...state.past, state.doc],
		future: rest,
	};
}
