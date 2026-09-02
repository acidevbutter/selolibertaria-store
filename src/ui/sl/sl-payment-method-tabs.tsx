import { cn } from "@/lib/utils";

export interface SlPaymentMethod {
	id: string;
	label: string;
	/** The consequence, not just the name: "Aprovação imediata", "Até 6x sem juros". */
	note: string;
	disabled?: boolean;
}

/**
 * Payment selector. Each method carries its consequence. Selected = ink border on
 * paper. Boleto should be omitted by the caller when the cart is digital-only.
 */
export function SlPaymentMethodTabs({
	methods,
	active,
	onSelect,
}: {
	methods: SlPaymentMethod[];
	active: string;
	onSelect: (id: string) => void;
}) {
	return (
		<div
			role="tablist"
			aria-label="Formas de pagamento"
			className="grid gap-3"
			style={{ gridTemplateColumns: `repeat(${Math.min(methods.length, 3)}, minmax(0, 1fr))` }}
		>
			{methods.map((method) => {
				const selected = method.id === active;
				return (
					<button
						key={method.id}
						type="button"
						role="tab"
						aria-selected={selected}
						disabled={method.disabled}
						onClick={() => onSelect(method.id)}
						className={cn(
							"flex flex-col gap-1.5 p-4 text-left transition-[border-color] duration-150 disabled:opacity-40",
						)}
						style={{
							border: `1px solid ${selected ? "var(--sl-ink)" : "rgba(11,11,11,0.28)"}`,
							background: selected ? "var(--sl-paper)" : "transparent",
						}}
					>
						<span className="text-[12px] font-black uppercase tracking-[0.2em]">{method.label}</span>
						<span className="text-[13px] text-[color:var(--sl-text-muted)]">{method.note}</span>
					</button>
				);
			})}
		</div>
	);
}
