import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The store offers a single economy shipping option ("Envio módico"). The carrier
 * behind it is an implementation detail — we surface the deadline (always in dias
 * úteis, kit rule), never the carrier name on its own.
 */
export function economyShippingLabel(estimatedDays?: number | null): string {
	if (!estimatedDays || estimatedDays <= 0) return "Envio módico";
	return `Envio módico · ${estimatedDays} ${estimatedDays === 1 ? "dia útil" : "dias úteis"}`;
}

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
