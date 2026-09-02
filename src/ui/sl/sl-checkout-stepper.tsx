import { cn } from "@/lib/utils";

/**
 * Checkout progress. Current step is a solid block (red on black); completed
 * steps get a ✓ and stay usable. Three steps, always: Identificação / Entrega / Pagamento.
 */
export function SlCheckoutStepper({
	steps,
	current,
	onInk = true,
	onStepClick,
}: {
	steps: string[];
	/** 1-based index of the active step. */
	current: number;
	onInk?: boolean;
	onStepClick?: (index: number) => void;
}) {
	return (
		<ol className="m-0 flex list-none flex-wrap items-center gap-x-2.5 gap-y-2 p-0 text-[11px] font-black uppercase tracking-[0.22em]">
			{steps.map((label, index) => {
				const step = index + 1;
				const done = step < current;
				const active = step === current;
				const clickable = Boolean(onStepClick) && (done || active);

				return (
					<li key={label} className="flex items-center gap-2.5">
						{index > 0 ? (
							<span
								aria-hidden
								className="h-px w-6"
								style={{
									background: onInk ? "var(--sl-line-on-ink-mid)" : "var(--sl-line-strong)",
								}}
							/>
						) : null}
						<button
							type="button"
							disabled={!clickable}
							onClick={clickable ? () => onStepClick?.(step) : undefined}
							className={cn(
								"inline-flex items-center gap-1.5",
								active && "h-7 px-2.5",
								clickable ? "cursor-pointer" : "cursor-default",
							)}
							style={
								active
									? { background: "var(--sl-buy)", color: "var(--sl-text-on-ink)" }
									: {
											color: onInk
												? done
													? "var(--sl-text-on-ink)"
													: "var(--sl-text-on-ink-quiet)"
												: done
													? "var(--sl-text)"
													: "var(--sl-text-quiet)",
										}
							}
						>
							<span>
								{step} · {label}
							</span>
							{done ? <span aria-hidden>✓</span> : null}
						</button>
					</li>
				);
			})}
		</ol>
	);
}
