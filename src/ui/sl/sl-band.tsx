import type { ElementType, ReactNode } from "react";
import { readEditorialText } from "@/lib/editorial-style";
import { cn } from "@/lib/utils";

type SlTone = "paper" | "ink" | "sand";

const toneStyle: Record<SlTone, { background: string; color: string }> = {
	paper: { background: "var(--sl-surface-page)", color: "var(--sl-text)" },
	ink: { background: "var(--sl-surface-invert)", color: "var(--sl-text-on-ink)" },
	sand: { background: "var(--sl-surface-band)", color: "var(--sl-text)" },
};

/**
 * Full-bleed section from the SL UI kit: one of three surfaces (paper → ink →
 * sand), with the 1440-wide inner column and the kit's page gutters. Depth in
 * this system comes from swapping surface, never from elevation — see the
 * design README ("no decorative box-shadow").
 */
export function SlBand({
	children,
	tone = "paper",
	as: Tag = "section",
	className,
	innerClassName,
}: {
	children: ReactNode;
	tone?: SlTone;
	as?: ElementType;
	/** Extra classes on the full-bleed wrapper (e.g. a hairline `border-b`). */
	className?: string;
	/** Replaces the default inner padding/layout when you need a custom grid. */
	innerClassName?: string;
}) {
	return (
		<Tag className={className} style={toneStyle[tone]}>
			<div
				className={cn(
					"mx-auto w-full max-w-[var(--sl-w-desktop)] px-4 py-14 sm:px-8 lg:px-12",
					innerClassName,
				)}
			>
				{children}
			</div>
		</Tag>
	);
}

function renderInline(text: string): ReactNode[] {
	return text
		.split(/(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g)
		.filter(Boolean)
		.map((part, index) => {
			if (part.startsWith("**") && part.endsWith("**")) {
				return <strong key={index}>{part.slice(2, -2)}</strong>;
			}
			if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
				return <em key={index}>{part.slice(1, -1)}</em>;
			}
			return <span key={index}>{part}</span>;
		});
}

/**
 * Admin body copy rendered for an SL surface. Mirrors EditorialRichText's
 * markdown subset (**bold**, *italic*, `### `, `> `) but inherits `color` from
 * the band instead of forcing an `--editorial-*` colour, so the same stored
 * text reads correctly on paper, ink or sand.
 */
export function SlProse({ source, className }: { source?: string | null; className?: string }) {
	const { source: text } = readEditorialText(source);
	const blocks = text
		.replace(/\s+(>\s+)/g, "\n\n$1")
		.replace(/\s+(#{3}\s+)/g, "\n\n$1")
		.split(/\n{2,}/)
		.map((block) => block.trim())
		.filter(Boolean);

	if (blocks.length === 0) return null;

	return (
		<div className={cn("flex flex-col gap-4 text-[color:inherit]", className)}>
			{blocks.map((block, index) => {
				if (block.startsWith("### ")) {
					return (
						<h3
							key={index}
							className="sl-head m-0 text-[color:inherit] text-[var(--sl-size-card-title)] leading-[1.05]"
						>
							{renderInline(block.slice(4))}
						</h3>
					);
				}
				if (block.startsWith("> ")) {
					return (
						<blockquote key={index} className="m-0 border-l-2 border-[color:currentColor]/30 pl-4 italic">
							{renderInline(block.replace(/^>\s?/gm, ""))}
						</blockquote>
					);
				}
				return (
					<p key={index} className="m-0">
						{renderInline(block)}
					</p>
				);
			})}
		</div>
	);
}
