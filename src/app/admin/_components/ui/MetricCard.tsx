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

/** The panel's number. Value is ALWAYS mono — never editorial serif. */
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
				<span className="ad-eb">{label}</span>
				{clickable ? <span className="ad-ml">{action || "Ver"} →</span> : null}
			</span>
			<span
				className={cn("ad-num mt-4 block text-[30px]")}
				style={{ color: tone === "danger" ? "var(--ad-wine)" : "var(--ad-text)" }}
			>
				{value}
			</span>
			{note ? (
				<span className="mt-1 block text-[11px]" style={{ color: "var(--ad-text-soft)" }}>
					{note}
				</span>
			) : null}
		</>
	);

	const classes = cn(
		"ad-panel block w-full p-[var(--ad-pad-sheet)] text-left no-underline transition-[var(--ad-transition)]",
		clickable && "cursor-pointer",
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
