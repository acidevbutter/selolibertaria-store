import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const sizeClass = {
	xl: "text-[clamp(32px,5vw,44px)]",
	lg: "text-[30px]",
	md: "text-[22px]",
	sm: "text-[18px]",
} as const;

/**
 * Price in DCC Ash — the only display-font use outside short titles. Installment
 * copy sits *beside* it in ink-grey body, never underneath (kit rule).
 */
export function SlPriceTag({
	value,
	aside,
	size = "md",
	onInk = false,
	className,
}: {
	value: ReactNode;
	aside?: ReactNode;
	size?: keyof typeof sizeClass;
	onInk?: boolean;
	className?: string;
}) {
	return (
		<span className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", className)}>
			<span
				className={cn("sl-price", sizeClass[size])}
				style={{ color: onInk ? "var(--sl-text-on-ink)" : "var(--sl-text)", letterSpacing: "-0.03em" }}
			>
				{value}
			</span>
			{aside ? (
				<span
					className="text-[14px]"
					style={{ color: onInk ? "var(--sl-text-on-ink-soft)" : "var(--sl-text-soft)" }}
				>
					{aside}
				</span>
			) : null}
		</span>
	);
}
