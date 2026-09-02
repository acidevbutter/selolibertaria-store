import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Section header from the UI kit: a hairline rule, an uppercase Fertigo title,
 * and an optional trailing action. Used on "Em destaque", catalog blocks, etc.
 */
export function SlSectionHead({
	title,
	action,
	onInk = false,
	className,
}: {
	title: ReactNode;
	action?: ReactNode;
	onInk?: boolean;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-wrap items-end justify-between gap-4 border-b pb-5",
				onInk ? "border-[color:var(--sl-line-on-ink)]" : "border-[color:var(--sl-line-hairline)]",
				className,
			)}
		>
			<h2
				className="sl-head m-0 text-[clamp(28px,4vw,var(--sl-size-section))] leading-[0.98]"
				style={{ color: onInk ? "var(--sl-text-on-ink)" : "var(--sl-text)" }}
			>
				{title}
			</h2>
			{action ? <div className="shrink-0">{action}</div> : null}
		</div>
	);
}

/** Uppercase micro-label used above headlines. Wine on paper, sand on ink. */
export function SlEyebrow({
	children,
	onInk = false,
	className,
}: {
	children: ReactNode;
	onInk?: boolean;
	className?: string;
}) {
	return (
		<p
			className={cn("sl-eyebrow", className)}
			style={{ color: onInk ? "var(--sl-text-on-ink-label)" : "var(--sl-accent)" }}
		>
			{children}
		</p>
	);
}
