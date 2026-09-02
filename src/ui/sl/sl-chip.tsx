import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SlChipTone = "ink" | "buy" | "paper" | "line";
type SlChipSize = "chip" | "badge";

const toneClass: Record<SlChipTone, string> = {
	ink: "sl-badge-ink",
	buy: "sl-badge-buy",
	paper: "sl-badge-paper",
	line: "",
};

/**
 * Category / state label — the smallest typographic unit in the system.
 * `tone="buy"` only for real urgency (pré-venda, lançamento); `tone="paper"`
 * marks sold-out. `size="badge"` anchors to an image's top-left with no margin.
 */
export function SlChip({
	children,
	tone = "line",
	size = "chip",
	className,
}: {
	children: ReactNode;
	tone?: SlChipTone;
	size?: SlChipSize;
	className?: string;
}) {
	if (size === "badge") {
		return <span className={cn("sl-badge", toneClass[tone], className)}>{children}</span>;
	}

	return (
		<span
			className={cn(
				"inline-flex h-[var(--sl-h-chip)] items-center px-[10px] text-[10px] font-black uppercase tracking-[0.2em]",
				className,
			)}
			style={
				tone === "line"
					? { border: "1px solid var(--sl-line-strong)", color: "var(--sl-text)" }
					: tone === "paper"
						? { border: "1px solid var(--sl-ink)", background: "var(--sl-paper)", color: "var(--sl-ink)" }
						: {
								background: tone === "buy" ? "var(--sl-buy)" : "var(--sl-ink)",
								color: "var(--sl-text-on-ink)",
							}
			}
		>
			{children}
		</span>
	);
}
