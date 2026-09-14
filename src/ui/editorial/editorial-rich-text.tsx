import type { ReactNode } from "react";
import { readEditorialText } from "@/lib/editorial-style";
import { cn } from "@/lib/utils";

type EditorialRichTextProps = {
	source?: string | null;
	className?: string;
};

function normalizeBlocks(source: string) {
	return source.replace(/\s+(>\s+)/g, "\n\n$1").replace(/\s+(#{3}\s+)/g, "\n\n$1");
}

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/;

export function renderInline(text: string) {
	const parts = text
		.split(/(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|\+\+[^+]+\+\+|\[[^\]]+\]\([^)]+\))/g)
		.filter(Boolean);

	return parts.map((part, index) => {
		const link = part.match(LINK_PATTERN);
		if (link) {
			return (
				<a key={`${part}-${index}`} href={link[2]} className="underline decoration-1 underline-offset-2">
					{link[1]}
				</a>
			);
		}

		if (part.startsWith("**") && part.endsWith("**")) {
			return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
		}

		if (part.startsWith("++") && part.endsWith("++")) {
			return <u key={`${part}-${index}`}>{part.slice(2, -2)}</u>;
		}

		if (part.startsWith("*") && part.endsWith("*")) {
			return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>;
		}

		if (part.startsWith("_") && part.endsWith("_")) {
			return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>;
		}

		return <span key={`${part}-${index}`}>{part}</span>;
	});
}

function renderBlock(block: string, index: number): ReactNode {
	const trimmed = block.trim();

	if (!trimmed) return null;

	if (trimmed.startsWith("### ")) {
		return (
			<h3 key={index} className="text-lg leading-7 font-semibold text-current">
				{renderInline(trimmed.slice(4))}
			</h3>
		);
	}

	if (trimmed.startsWith("> ")) {
		return (
			<blockquote key={index} className="border-l-2 border-current/30 pl-4 italic">
				{renderInline(trimmed.replace(/^>\s?/gm, ""))}
			</blockquote>
		);
	}

	return <p key={index}>{renderInline(trimmed)}</p>;
}

export function EditorialRichText({ source, className }: EditorialRichTextProps) {
	const text = readEditorialText(source);
	const styleClasses =
		{
			serif: "font-serif",
			sans: "font-sans",
		}[text.style.font] +
		" " +
		{ sm: "text-sm", base: "text-base", lg: "text-lg" }[text.style.scale] +
		" " +
		{
			ink: "text-[color:var(--editorial-ink)]",
			muted: "text-[color:var(--editorial-muted)]",
			wine: "text-[color:var(--editorial-accent)]",
			paper: "text-[color:var(--editorial-paper)]",
		}[text.style.color] +
		" " +
		(text.style.emphasis === "strong" ? "font-semibold" : "");
	const blocks = normalizeBlocks(text.source)
		.split(/\n{2,}/)
		.map(renderBlock)
		.filter(Boolean);

	if (blocks.length === 0) return null;

	return <div className={cn("space-y-4", styleClasses, className)}>{blocks}</div>;
}
