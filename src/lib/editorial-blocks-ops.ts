import type { EditorialBlock, EditorialBlockType, EditorialContentDoc } from "@/lib/editorial-blocks";

let counter = 0;

/** Not crypto-grade -- only needs to be unique within one editing session. */
export function createBlockId() {
	counter += 1;
	return `blk_${Date.now().toString(36)}_${counter}`;
}

export function createEmptyBlock(type: EditorialBlockType): EditorialBlock {
	const id = createBlockId();
	switch (type) {
		case "heading":
			return { id, type, level: 2, text: "" };
		case "paragraph":
			return { id, type, text: "" };
		case "list":
			return { id, type, style: "bullet", items: [""] };
		case "quote":
			return { id, type, text: "", attribution: null };
		case "highlight":
			return { id, type, text: "" };
		case "image":
			return {
				id,
				type,
				assetId: "",
				cropId: null,
				src: "",
				layout: "center",
				align: null,
				caption: null,
				href: null,
				alt: null,
			};
		case "gallery":
			return { id, type, images: [] };
		case "button":
			return { id, type, label: "Saiba mais", href: "", variant: "primary" };
		case "divider":
			return { id, type };
		case "productShelf":
			return { id, type, title: null, productSlugs: [] };
		case "agenda":
			return { id, type, title: null, eventSlugs: [] };
	}
}

export function insertBlockAt(
	doc: EditorialContentDoc,
	index: number,
	block: EditorialBlock,
): EditorialContentDoc {
	const next = [...doc];
	next.splice(Math.max(0, Math.min(index, doc.length)), 0, block);
	return next;
}

export function insertBlockAfter(doc: EditorialContentDoc, afterId: string | null, block: EditorialBlock) {
	const index = afterId ? doc.findIndex((b) => b.id === afterId) : -1;
	return insertBlockAt(doc, index === -1 ? doc.length : index + 1, block);
}

export function removeBlock(doc: EditorialContentDoc, id: string): EditorialContentDoc {
	return doc.filter((block) => block.id !== id);
}

export function duplicateBlock(doc: EditorialContentDoc, id: string): EditorialContentDoc {
	const index = doc.findIndex((block) => block.id === id);
	if (index === -1) return doc;
	const clone = { ...doc[index], id: createBlockId() } as EditorialBlock;
	return insertBlockAt(doc, index + 1, clone);
}

export function moveBlock(
	doc: EditorialContentDoc,
	id: string,
	direction: "up" | "down",
): EditorialContentDoc {
	const index = doc.findIndex((block) => block.id === id);
	if (index === -1) return doc;
	const target = direction === "up" ? index - 1 : index + 1;
	if (target < 0 || target >= doc.length) return doc;
	const next = [...doc];
	const [moved] = next.splice(index, 1) as [EditorialBlock];
	next.splice(target, 0, moved);
	return next;
}

/** The toolbar's level selector converts between paragraph and heading (H2/H3) in place, keeping the text. No-op for any other block type. */
export function convertTextBlockLevel(
	doc: EditorialContentDoc,
	id: string,
	level: "paragraph" | 2 | 3,
): EditorialContentDoc {
	return doc.map((block) => {
		if (block.id !== id || (block.type !== "paragraph" && block.type !== "heading")) return block;
		return level === "paragraph"
			? { id, type: "paragraph", text: block.text }
			: { id, type: "heading", level, text: block.text };
	});
}

/** Drops `fromId`'s block where `toId`'s block currently sits, shifting the rest — the semantic a drag-and-drop reorder needs. */
export function reorderBlock(doc: EditorialContentDoc, fromId: string, toId: string): EditorialContentDoc {
	if (fromId === toId) return doc;
	const fromIndex = doc.findIndex((block) => block.id === fromId);
	const toIndex = doc.findIndex((block) => block.id === toId);
	if (fromIndex === -1 || toIndex === -1) return doc;
	const next = [...doc];
	const [moved] = next.splice(fromIndex, 1) as [EditorialBlock];
	next.splice(toIndex, 0, moved);
	return next;
}

export function updateBlock<T extends EditorialBlock>(
	doc: EditorialContentDoc,
	id: string,
	patch: Partial<T>,
): EditorialContentDoc {
	return doc.map((block) => (block.id === id ? ({ ...block, ...patch } as EditorialBlock) : block));
}
