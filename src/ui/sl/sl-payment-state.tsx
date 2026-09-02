import type { ReactNode } from "react";

type SlPaymentStateKind = "processing" | "approved" | "declined" | "waiting";

/**
 * The four charge states from the design system:
 *  - processing: solid black, red bar, "não feche a página".
 *  - approved:   paper with a wine ✓ and the order number.
 *  - declined:   wine on wash, with a required exit and "nada foi cobrado".
 *  - waiting:    sand, with the item-reservation window.
 */
export function SlPaymentState({
	kind,
	title,
	body,
	actions,
	progress = 0.6,
}: {
	kind: SlPaymentStateKind;
	title: ReactNode;
	body?: ReactNode;
	actions?: ReactNode;
	progress?: number;
}) {
	if (kind === "processing") {
		return (
			<div
				className="flex flex-col gap-1.5 p-4"
				style={{ background: "var(--sl-ink)", color: "var(--sl-text-on-ink)" }}
			>
				<p className="m-0 text-[11px] font-black uppercase tracking-[0.22em] text-[color:var(--sl-text-on-ink-label)]">
					Processando
				</p>
				<p className="m-0 text-[15px]">{title}</p>
				{body ? <p className="m-0 text-[13px] text-[color:var(--sl-text-on-ink-muted)]">{body}</p> : null}
				<div className="mt-1 h-1.5 bg-[color:rgba(247,244,239,0.2)]">
					<div
						className="h-1.5 bg-[color:var(--sl-buy)]"
						style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
					/>
				</div>
			</div>
		);
	}

	if (kind === "approved") {
		return (
			<div
				className="flex items-start gap-3 p-4"
				style={{ border: "1px solid var(--sl-ink)", background: "var(--sl-surface-card)" }}
			>
				<span className="text-[18px] font-black text-[color:var(--sl-accent)]">✓</span>
				<div>
					<p className="m-0 text-[15px] font-bold">{title}</p>
					{body ? (
						<p className="m-0 mt-1 text-[13px] leading-[1.55] text-[color:var(--sl-text-muted)]">{body}</p>
					) : null}
				</div>
			</div>
		);
	}

	if (kind === "waiting") {
		return (
			<div
				className="flex flex-col gap-1.5 p-4"
				style={{ border: "1px solid rgba(11,11,11,0.28)", background: "var(--sl-sand)" }}
			>
				<p className="m-0 text-[14px] font-bold">{title}</p>
				{body ? <p className="m-0 text-[12px] text-[color:var(--sl-text-muted)]">{body}</p> : null}
			</div>
		);
	}

	// declined
	return (
		<div
			className="flex flex-col gap-2 p-4"
			style={{ border: "1px solid var(--sl-wine)", background: "var(--sl-danger-wash)" }}
		>
			<p className="m-0 text-[14px] font-bold text-[color:var(--sl-accent)]">{title}</p>
			{body ? <p className="m-0 text-[12px] text-[color:var(--sl-accent)]">{body}</p> : null}
			{actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
		</div>
	);
}
