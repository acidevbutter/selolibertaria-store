import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusTone = "neutral" | "active" | "alert";

const toneClass: Record<StatusTone, string> = {
	neutral: "ad-b-pub",
	active: "ad-b-run",
	alert: "ad-b-err",
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
	return <span className={cn("ad-badge", toneClass[tone], className)}>{children}</span>;
}
