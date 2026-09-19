import Image from "next/image";
import { Fragment } from "react";
import {
	cropWindowStyle,
	decodeCropId,
	type EditorialBlock,
	type EditorialContentDoc,
} from "@/lib/editorial-blocks";
import { cn } from "@/lib/utils";
import { renderInline } from "@/ui/editorial/editorial-rich-text";
import { SlButton } from "@/ui/sl/sl-button";
import { YnsLink } from "@/ui/yns-link";

/**
 * Maps a validated EditorialContentDoc to JSX. This is the ONLY place that
 * turns block nodes into markup -- imported as-is by both the admin "ver como
 * fica" preview and the public page renderer, so "ver como fica" being true
 * is a structural guarantee, not a convention someone can drift away from.
 * Every node maps to real JSX below -- none of them ever inject raw markup.
 *
 * Every image uses loading="eager": today this renderer only mounts inside
 * the admin preview's `.ad-scrim`, which starts `display: none`, and native
 * lazy-loading's intersection check can permanently miss images that were
 * `display: none` at mount. Revisit once this renders on the live public
 * page too, where lazy-loading long articles is worth the tradeoff.
 */

const imageLayoutClass: Record<string, string> = {
	wide: "w-full",
	side: "w-full sm:w-[45%]",
	center: "mx-auto w-full max-w-md",
	gallery: "mx-auto w-full max-w-md",
};

function BlockImage({ block }: { block: Extract<EditorialBlock, { type: "image" }> }) {
	// A freshly inserted image block starts with an empty src until someone
	// uploads a file -- render nothing rather than pass "" to next/image.
	if (!block.src) return null;
	const sideFloat =
		block.layout === "side"
			? block.align === "left"
				? "sm:float-left sm:mr-6"
				: "sm:float-right sm:ml-6"
			: "";
	const cropRect = decodeCropId(block.cropId);
	const figure = (
		<figure className={cn("my-6", imageLayoutClass[block.layout], sideFloat)}>
			{cropRect ? (
				<div className="relative w-full overflow-hidden" style={{ aspectRatio: cropRect.ratio }}>
					<Image
						src={block.src}
						alt={block.alt ?? ""}
						width={1200}
						height={800}
						unoptimized
						loading="eager"
						className="object-cover"
						style={{ position: "absolute", ...cropWindowStyle(cropRect) }}
					/>
				</div>
			) : (
				<Image
					src={block.src}
					alt={block.alt ?? ""}
					width={1200}
					height={800}
					unoptimized
					loading="eager"
					className="h-auto w-full object-cover"
				/>
			)}
			{block.caption || block.credit ? (
				<figcaption className="mt-2 text-xs text-[color:var(--editorial-muted)]">
					{block.caption}
					{block.caption && block.credit ? " " : null}
					{block.credit ? <span className="opacity-70">{block.credit}</span> : null}
				</figcaption>
			) : null}
		</figure>
	);
	return block.href ? (
		<YnsLink href={block.href} className="block">
			{figure}
		</YnsLink>
	) : (
		figure
	);
}

function BlockGallery({ block }: { block: Extract<EditorialBlock, { type: "gallery" }> }) {
	return (
		<div className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
			{block.images
				.filter((image) => image.src)
				.map((image, index) => (
					<figure key={`${image.assetId}-${index}`}>
						<Image
							src={image.src}
							alt={image.alt ?? ""}
							width={600}
							height={600}
							unoptimized
							loading="eager"
							className="h-auto w-full object-cover"
						/>
						{image.caption || image.credit ? (
							<figcaption className="mt-1 text-xs text-[color:var(--editorial-muted)]">
								{image.caption}
								{image.caption && image.credit ? " " : null}
								{image.credit ? <span className="opacity-70">{image.credit}</span> : null}
							</figcaption>
						) : null}
					</figure>
				))}
		</div>
	);
}

function renderBlock(block: EditorialBlock) {
	switch (block.type) {
		case "heading": {
			const Tag = block.level === 2 ? "h2" : "h3";
			return (
				<Tag
					className={
						block.level === 2
							? "display-font text-2xl leading-tight font-black tracking-[-.02em] text-current"
							: "text-lg leading-7 font-semibold text-current"
					}
				>
					{renderInline(block.text)}
				</Tag>
			);
		}
		case "paragraph":
			return <p>{renderInline(block.text)}</p>;
		case "list": {
			const Tag = block.style === "number" ? "ol" : "ul";
			return (
				<Tag
					className={block.style === "number" ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"}
				>
					{block.items.map((item, index) => (
						<li key={index}>{renderInline(item)}</li>
					))}
				</Tag>
			);
		}
		case "quote":
			return (
				<blockquote className="border-l-2 border-current/30 pl-4 italic">
					{renderInline(block.text)}
					{block.attribution ? (
						<footer className="mt-2 text-xs not-italic text-[color:var(--editorial-muted)]">
							— {block.attribution}
						</footer>
					) : null}
				</blockquote>
			);
		case "highlight":
			return (
				<div className="border border-[color:var(--editorial-accent)] bg-[color:rgba(139,26,26,0.06)] px-5 py-4 text-[color:var(--editorial-accent)]">
					{renderInline(block.text)}
				</div>
			);
		case "image":
			return <BlockImage block={block} />;
		case "gallery":
			return <BlockGallery block={block} />;
		case "button":
			return block.href ? (
				<SlButton href={block.href} variant={block.variant === "secondary" ? "secondary" : "primary"}>
					{block.label}
				</SlButton>
			) : (
				<SlButton variant={block.variant === "secondary" ? "secondary" : "primary"}>{block.label}</SlButton>
			);
		case "divider":
			return <hr className="border-t border-[color:var(--editorial-border)]" />;
		case "productShelf":
			return (
				<div
					className="border border-dashed border-[color:var(--editorial-border)] px-4 py-3 text-xs text-[color:var(--editorial-muted)]"
					data-block="productShelf"
					data-product-slugs={block.productSlugs.join(",")}
				>
					{block.title ?? "Vitrine de produtos"} ({block.productSlugs.length})
				</div>
			);
		case "agenda":
			return (
				<div
					className="border border-dashed border-[color:var(--editorial-border)] px-4 py-3 text-xs text-[color:var(--editorial-muted)]"
					data-block="agenda"
					data-event-slugs={block.eventSlugs.join(",")}
				>
					{block.title ?? "Agenda"} ({block.eventSlugs.length})
				</div>
			);
		default: {
			const exhaustive: never = block;
			return exhaustive;
		}
	}
}

function SectionDivider({ label }: { label: string }) {
	return (
		<div className="w-full">
			<p className="mb-1.5 text-[11px] font-bold tracking-[0.14em] text-[color:var(--editorial-muted)] uppercase">
				{label}
			</p>
			<hr className="border-t border-[color:var(--editorial-border)]" />
		</div>
	);
}

/** A standalone block, or a `row` group split into its `left`/`right` `column`s -- rows are
 *  built by matching `row` ids anywhere in the doc, not just adjacent entries, so a block
 *  added elsewhere still joins its row instead of silently rendering on its own. */
type RenderItem =
	| { kind: "block"; block: EditorialBlock }
	| { kind: "row"; rowId: string; left: EditorialBlock[]; right: EditorialBlock[] };

function groupIntoRenderItems(doc: EditorialContentDoc): RenderItem[] {
	const seenRows = new Set<string>();
	const items: RenderItem[] = [];
	for (const block of doc) {
		if (block.row) {
			if (seenRows.has(block.row)) continue;
			seenRows.add(block.row);
			const rowBlocks = doc.filter((candidate) => candidate.row === block.row);
			items.push({
				kind: "row",
				rowId: block.row,
				left: rowBlocks.filter((candidate) => candidate.column !== "right"),
				right: rowBlocks.filter((candidate) => candidate.column === "right"),
			});
		} else {
			items.push({ kind: "block", block });
		}
	}
	return items;
}

function sectionOfItem(item: RenderItem): string | null {
	return (item.kind === "block" ? item.block.section : (item.left[0] ?? item.right[0])?.section) ?? null;
}

export function EditorialBlocksRenderer({
	doc,
	className,
}: {
	doc: EditorialContentDoc;
	className?: string;
}) {
	if (doc.length === 0) return null;

	let lastSection: string | null = null;

	return (
		<div className={cn("flex flex-wrap gap-5", className)}>
			{groupIntoRenderItems(doc).map((item) => {
				const section = sectionOfItem(item);
				const divider = section && section !== lastSection ? <SectionDivider label={section} /> : null;
				lastSection = section ?? lastSection;

				if (item.kind === "block") {
					return (
						<Fragment key={item.block.id}>
							{divider}
							<div
								className={cn(
									"clear-both",
									item.block.width === "half" ? "w-full sm:w-[calc(50%-10px)]" : "w-full",
								)}
							>
								{renderBlock(item.block)}
							</div>
						</Fragment>
					);
				}

				return (
					<Fragment key={item.rowId}>
						{divider}
						<div
							className={cn(
								"grid w-full gap-5",
								item.right.length > 0 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
							)}
						>
							<div className="flex flex-col gap-4">
								{item.left.map((block) => (
									<div key={block.id}>{renderBlock(block)}</div>
								))}
							</div>
							{item.right.length > 0 ? (
								<div className="flex flex-col gap-4">
									{item.right.map((block) => (
										<div key={block.id}>{renderBlock(block)}</div>
									))}
								</div>
							) : null}
						</div>
					</Fragment>
				);
			})}
		</div>
	);
}
