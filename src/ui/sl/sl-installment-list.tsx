import { cn } from "@/lib/utils";

export interface SlInstallmentOption {
	times: string;
	value: string;
	note: string;
	highlight?: boolean;
}

/**
 * Installment options, stacked. System rule: the store never offers interest —
 * if you see "com juros" here, the data is wrong. Purely informational alongside
 * the Mercado Pago Brick, which owns the real selection.
 */
export function SlInstallmentList({
	options,
	note = "Até 6x sem juros. O valor final nunca aumenta.",
	selectedIndex,
	onSelect,
	className,
}: {
	options: SlInstallmentOption[];
	note?: string;
	selectedIndex?: number;
	onSelect?: (index: number) => void;
	className?: string;
}) {
	return (
		<div className={cn("flex flex-col", className)}>
			{options.map((option, index) => {
				const selected = selectedIndex === index;
				const Tag = onSelect ? "button" : "div";
				return (
					<Tag
						key={`${option.times}-${index}`}
						{...(onSelect ? { type: "button" as const, onClick: () => onSelect(index) } : {})}
						className="flex items-center justify-between px-3.5 text-left text-[15px]"
						style={{
							height: index === 0 ? "52px" : "48px",
							border: `1px solid ${selected || option.highlight ? "var(--sl-ink)" : "rgba(11,11,11,0.2)"}`,
							borderTop: index === 0 ? undefined : "none",
							background: "var(--sl-surface-card)",
							color: option.highlight ? "var(--sl-text)" : "var(--sl-text-muted)",
						}}
					>
						<span>
							<strong>{option.times}</strong> de {option.value}
						</span>
						<span className="text-[13px] text-[color:var(--sl-accent)]">{option.note}</span>
					</Tag>
				);
			})}
			{note ? (
				<p className="mt-2 text-[12px] leading-[1.6] text-[color:var(--sl-text-soft)]">{note}</p>
			) : null}
		</div>
	);
}
