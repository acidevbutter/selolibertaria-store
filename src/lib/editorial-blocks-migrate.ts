import type { EditorialBlock, EditorialContentDoc } from "@/lib/editorial-blocks";

/**
 * Best-effort starter content for a page that has never been edited in the
 * block editor: turns the legacy per-field record (`title`/`eyebrow`/
 * `summary`/`body`, per `EditorialBase`) into a small initial doc, so
 * "carregar conteúdo editorial nela" holds even before anyone touches the
 * new editor. This does not attempt to reproduce richer structures (Home's
 * hero/manifesto/catalog/program sub-objects, etc.) block-for-block — it's a
 * starting point the page owner refines directly with the block tools
 * (image, productShelf, agenda, ...), not a lossless conversion.
 */
export function convertLegacyEditorialContentToBlocks(
	content: Record<string, unknown> | null | undefined,
): EditorialContentDoc {
	if (!content) return [];

	const blocks: EditorialBlock[] = [];
	let counter = 0;
	const nextId = (prefix: string) => `${prefix}-${counter++}`;

	const title = typeof content.title === "string" ? content.title.trim() : "";
	if (title) blocks.push({ id: nextId("heading"), type: "heading", level: 2, text: title });

	const eyebrow = typeof content.eyebrow === "string" ? content.eyebrow.trim() : "";
	if (eyebrow) blocks.push({ id: nextId("paragraph"), type: "paragraph", text: eyebrow });

	const summary = typeof content.summary === "string" ? content.summary.trim() : "";
	if (summary) blocks.push({ id: nextId("paragraph"), type: "paragraph", text: summary });

	const body = typeof content.body === "string" ? content.body.trim() : "";
	if (body && body !== summary) blocks.push({ id: nextId("paragraph"), type: "paragraph", text: body });

	return blocks;
}
