import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EditorialRichTextProps = {
	source?: string | null;
	className?: string;
};

function renderInline(text: string) {
	const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).filter(Boolean);

	return parts.map((part, index) => {
		if (part.startsWith("**") && part.endsWith("**")) {
			return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
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
	const blocks = (source ?? "")
		.split(/\n{2,}/)
		.map(renderBlock)
		.filter(Boolean);

	if (blocks.length === 0) return null;

	return <div className={cn("space-y-4", className)}>{blocks}</div>;
}
