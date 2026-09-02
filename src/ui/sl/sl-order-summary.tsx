import type { ReactNode } from "react";

/**
 * Cart + checkout money summary. System rule: shipping is already in here, so the
 * total never changes between cart and payment.
 */
export function SlOrderSummary({
	lines,
	total,
	footnote = "Valor final. Não há taxas adicionais na próxima etapa.",
	className,
}: {
	lines: Array<{ label: ReactNode; value: ReactNode; tone?: "default" | "accent" }>;
	total: ReactNode;
	footnote?: ReactNode;
	className?: string;
}) {
	return (
		<div className={className}>
			<div className="flex flex-col gap-2.5 text-[14px]">
				{lines.map((line, index) => (
					<div
						key={index}
						className="flex items-center justify-between"
						style={line.tone === "accent" ? { color: "var(--sl-accent)" } : undefined}
					>
						<span>{line.label}</span>
						<span>{line.value}</span>
					</div>
				))}
				<div className="flex items-baseline justify-between border-t border-[color:var(--sl-line-hairline)] pt-2.5">
					<span className="font-bold">Total</span>
					<span className="sl-price text-[28px]">{total}</span>
				</div>
			</div>
			{footnote ? <p className="mt-2 text-[12px] text-[color:var(--sl-text-soft)]">{footnote}</p> : null}
		</div>
	);
}
