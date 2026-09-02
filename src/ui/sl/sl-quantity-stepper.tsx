import { cn } from "@/lib/utils";

/**
 * `−  n  +` — no typeable field, 44px min target in every viewport (kit rule).
 * `onInk` places it on a black surface (buy panel); `size="field"` matches the 52px field row.
 */
export function SlQuantityStepper({
	value,
	onDecrement,
	onIncrement,
	min = 1,
	disabled = false,
	onInk = false,
	size = "control",
	decrementLabel = "Diminuir quantidade",
	incrementLabel = "Aumentar quantidade",
	className,
}: {
	value: number;
	onDecrement: () => void;
	onIncrement: () => void;
	min?: number;
	disabled?: boolean;
	onInk?: boolean;
	size?: "control" | "field";
	decrementLabel?: string;
	incrementLabel?: string;
	className?: string;
}) {
	const border = onInk ? "var(--sl-line-on-ink-mid)" : "var(--sl-line-strong)";
	const h = size === "field" ? "h-[var(--sl-h-field)]" : "h-[var(--sl-h-small)]";

	return (
		<div
			className={cn("inline-flex items-center justify-between gap-3 px-3 text-[16px]", h, className)}
			style={{ border: `1px solid ${border}`, color: onInk ? "var(--sl-text-on-ink)" : "var(--sl-text)" }}
		>
			<button
				type="button"
				aria-label={decrementLabel}
				disabled={disabled || value <= min}
				onClick={onDecrement}
				className="inline-flex h-full w-6 items-center justify-center disabled:opacity-40"
			>
				−
			</button>
			<span className="min-w-5 text-center tabular-nums">{value}</span>
			<button
				type="button"
				aria-label={incrementLabel}
				disabled={disabled}
				onClick={onIncrement}
				className="inline-flex h-full w-6 items-center justify-center disabled:opacity-40"
			>
				+
			</button>
		</div>
	);
}
