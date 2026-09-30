import type { EditorialContentDoc } from "@/lib/editorial-blocks";
import { EditorialBlocksRenderer } from "@/ui/editorial/editorial-blocks-renderer";

/** Ids minted by the block editor (`createBlockId`); seeded slot blocks use descriptive ids instead. */
export const EDITOR_BLOCK_ID_PREFIX = "blk_";

/** The published blocks a page's slots do not claim: the ones an editor added in /admin/editorial. */
export function editorAddedBlocks(doc: EditorialContentDoc | null | undefined): EditorialContentDoc {
	return (doc ?? []).filter((block) => block.id.startsWith(EDITOR_BLOCK_ID_PREFIX));
}

/**
 * Renders what the owner added in the block editor, at the end of a public page.
 *
 * Public pages look their copy up by fixed block id (see lib/editorial-blocks-slots.ts), so a block the
 * editor creates has no slot to land in and used to vanish after "Publicar". This section gives those blocks
 * a home, rendered by the same EditorialBlocksRenderer as the admin preview ("ver como fica"), without
 * touching the layout of the existing slots. Renders nothing when there are none.
 */
export function EditorialExtraBlocks({ doc }: { doc: EditorialContentDoc | null | undefined }) {
	const blocks = editorAddedBlocks(doc);
	if (blocks.length === 0) return null;
	return (
		<section
			aria-label="Conteúdo editorial"
			data-editorial-extra-blocks=""
			className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-8"
		>
			<EditorialBlocksRenderer doc={blocks} />
		</section>
	);
}
