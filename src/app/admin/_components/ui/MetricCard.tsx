import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { YnsLink } from "@/ui/yns-link";

type MetricCardProps = {
	label: ReactNode;
	value: ReactNode;
	note?: ReactNode;
	tone?: "default" | "danger";
	action?: ReactNode;
	href?: string;
	onClick?: () => void;
	className?: string;
};

/** The panel's number. Value is ALWAYS DCC Ash — never Fertigo. */
export function MetricCard({
	label,
	value,
	note,
	tone = "default",
	action,
	href,
	onClick,
	className,
}: MetricCardProps) {
	const clickable = Boolean(href || onClick);
	const content = (
		<>
			<span className="flex items-center justify-between gap-3">
				<span className="text-[var(--sl-size-label)] font-black tracking-[var(--sl-track-label-tight)] text-[var(--sl-accent)] uppercase">
					{label}
				</span>
				{clickable ? (
					<span className="text-[var(--sl-size-label)] font-black tracking-[var(--sl-track-label-tight)] text-[var(--sl-text-label)] uppercase">
						{action || "Ver"} →
					</span>
				) : null}
			</span>
			<span
				className={cn(
					"mt-4 block font-[family-name:var(--sl-font-display)] text-[30px] tracking-[var(--sl-track-card)]",
					tone === "danger" ? "text-[var(--sl-danger)]" : "text-[var(--sl-text)]",
				)}
			>
				{value}
			</span>
			{note ? <span className="mt-1 block text-[11px] text-[var(--sl-text-soft)]">{note}</span> : null}
		</>
	);

	const classes = cn(
		"block w-full rounded-[var(--sl-radius)] bg-[var(--sl-surface-card)] p-[var(--sl-pad-metric)] text-left text-[var(--sl-text)] no-underline transition-[var(--sl-transition)]",
		clickable ? "border border-[var(--sl-line)] cursor-pointer" : "border border-[var(--sl-line-hairline)]",
		className,
	);

	if (href) {
		return (
			<YnsLink href={href} className={classes}>
				{content}
			</YnsLink>
		);
	}

	if (onClick) {
		return (
			<button type="button" onClick={onClick} className={classes}>
				{content}
			</button>
		);
	}

	return <div className={classes}>{content}</div>;
}
