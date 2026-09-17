import Image from "next/image";
import type { EditorialBlock, EditorialContentDoc } from "@/lib/editorial-blocks";
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
	const figure = (
		<figure className={cn("my-6", imageLayoutClass[block.layout], sideFloat)}>
			<Image
				src={block.src}
				alt={block.alt ?? ""}
				width={1200}
				height={800}
				unoptimized
				className="h-auto w-full object-cover"
			/>
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
			return (
				<SlButton href={block.href} variant={block.variant === "secondary" ? "secondary" : "primary"}>
					{block.label}
				</SlButton>
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

export function EditorialBlocksRenderer({
	doc,
	className,
}: {
	doc: EditorialContentDoc;
	className?: string;
}) {
	if (doc.length === 0) return null;

	return (
		<div className={cn("flex flex-wrap gap-5", className)}>
			{doc.map((block) => (
				<div
					key={block.id}
					className={cn("clear-both", block.width === "half" ? "w-full sm:w-[calc(50%-10px)]" : "w-full")}
				>
					{renderBlock(block)}
				</div>
			))}
		</div>
	);
}
