import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shipping choice for the cart and the delivery step. Never show a carrier
 * without its deadline — always in dias úteis (kit rule). Selected = ink border
 * on sand. Renders as a button when `onSelect` is given, otherwise a static row.
 */
export function SlShippingOption({
	label,
	price,
	selected = false,
	onSelect,
	className,
}: {
	label: ReactNode;
	price: ReactNode;
	selected?: boolean;
	onSelect?: () => void;
	className?: string;
}) {
	const Tag = onSelect ? "button" : "div";
	return (
		<Tag
			{...(onSelect ? { type: "button" as const, onClick: onSelect } : {})}
			aria-pressed={onSelect ? selected : undefined}
			className={cn(
				"flex w-full items-center justify-between gap-3 px-3.5 text-left text-[14px] transition-[border-color] duration-150",
				className,
			)}
			style={{
				height: "var(--sl-h-field)",
				border: `1px solid ${selected ? "var(--sl-ink)" : "var(--sl-line-strong)"}`,
				background: selected ? "var(--sl-sand)" : "transparent",
				color: selected ? "var(--sl-text)" : "var(--sl-text-muted)",
			}}
		>
			<span>{label}</span>
			<span className={selected ? "font-bold" : undefined}>{price}</span>
		</Tag>
	);
}
