import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusTone = "neutral" | "active" | "alert";

const toneStyle: Record<StatusTone, string> = {
	neutral: "bg-[var(--sl-sand)] text-[var(--sl-wine)]",
	active: "bg-[var(--sl-ink)] text-[var(--sl-text-on-ink)]",
	alert: "border border-[var(--sl-danger-line)] bg-[var(--sl-danger-wash)] text-[var(--sl-wine)]",
};

/**
 * The panel's single status indicator — neutral (paid/done), active (in
 * progress/shipped) or alert (failed/attention). No shadcn green/red.
 */
export function StatusBadge({
	tone = "neutral",
	children,
	className,
}: {
	tone?: StatusTone;
	children: ReactNode;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex h-[var(--sl-h-badge)] items-center px-[10px] text-[10px] font-black uppercase tracking-[var(--sl-track-label-tight)]",
				toneStyle[tone],
				className,
			)}
			style={{ borderRadius: "var(--sl-radius)" }}
		>
			{children}
		</span>
	);
}
