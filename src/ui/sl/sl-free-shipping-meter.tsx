/**
 * Free-shipping bar at the top of the cart. The only public-area progress bar
 * outside the "Processando" state — wine on sand, and it never animates its fill.
 */
export function SlFreeShippingMeter({
	remainingLabel,
	thresholdLabel,
	progress,
	reachedLabel = "Frete grátis liberado nesta compra.",
}: {
	remainingLabel: string;
	thresholdLabel: string;
	progress: number;
	reachedLabel?: string;
}) {
	const clamped = Math.max(0, Math.min(1, progress));
	const reached = clamped >= 1;

	return (
		<div className="flex flex-col gap-2 px-5 py-3.5" style={{ background: "var(--sl-surface-band)" }}>
			<p className="m-0 text-[13px] font-bold">
				{reached ? (
					reachedLabel
				) : (
					<>
						Faltam {remainingLabel} para o frete grátis{" "}
						<span className="font-normal text-[color:var(--sl-text-soft)]">(acima de {thresholdLabel})</span>
					</>
				)}
			</p>
			<div className="h-2 bg-[color:rgba(11,11,11,0.16)]">
				<div className="h-2 bg-[color:var(--sl-wine)]" style={{ width: `${clamped * 100}%` }} />
			</div>
		</div>
	);
}
