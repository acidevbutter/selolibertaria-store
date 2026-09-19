import "server-only";

import type { EditorialContentDoc } from "@/lib/editorial-blocks";

/**
 * Looks up one block by id in a page's published contentDoc, for pages that keep their
 * existing design components untouched and only swap the *text values* those components
 * receive. Reordering/deleting a seeded block degrades to the caller's own fallback (see
 * scripts/seed_editorial_blocks.py on the backend for the matching ids) -- never blank. A
 * block the editor adds beyond these known ids has nowhere to render: lookups are by fixed
 * id on purpose, so the storefront's layout never changes shape from block edits alone.
 */
export function blockText(doc: EditorialContentDoc | null | undefined, id: string): string | undefined {
	const block = doc?.find((node) => node.id === id);
	if (!block) return undefined;
	return block.type === "heading" ||
		block.type === "paragraph" ||
		block.type === "quote" ||
		block.type === "highlight"
		? block.text
		: undefined;
}

export function blockList(doc: EditorialContentDoc | null | undefined, id: string): string[] | undefined {
	const block = doc?.find((node) => node.id === id);
	return block?.type === "list" ? block.items : undefined;
}

/**
 * Label of a `button` block -- for CTA slots seeded as real buttons (see
 * scripts/seed_editorial_blocks.py) so the block editor previews them as buttons. Only the
 * label is read: href/variant stay whatever the page itself computes (some are dynamic,
 * e.g. depending on a featured event), so the block never overrides routing logic.
 */
export function blockButtonLabel(
	doc: EditorialContentDoc | null | undefined,
	id: string,
): string | undefined {
	const block = doc?.find((node) => node.id === id);
	return block?.type === "button" ? block.label : undefined;
}

/** Source URL of an `image` block, for slots seeded with a real media asset (see
 * scripts/seed_editorial_blocks.py). Only `.src` is read -- a live product/commerce image,
 * where one exists, still wins ahead of this in the caller's own fallback chain. */
export function blockImageSrc(doc: EditorialContentDoc | null | undefined, id: string): string | undefined {
	const block = doc?.find((node) => node.id === id);
	return block?.type === "image" && block.src ? block.src : undefined;
}
