"use client";

import { useEffect, useState } from "react";

/**
 * Coupon input. An applied coupon uses the same wine wash as an error — in this
 * system wine means "attention", not "bad". Remove is always visible, never behind hover.
 */
export function SlCouponField({
	appliedCode,
	discountLabel,
	errorMessage,
	onApply,
	onRemove,
}: {
	appliedCode?: string | null;
	discountLabel?: string | null;
	errorMessage?: string | null;
	onApply: (code: string) => void | Promise<void>;
	onRemove: () => void | Promise<void>;
}) {
	const [code, setCode] = useState(appliedCode ?? "");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		setCode(appliedCode ?? "");
	}, [appliedCode]);

	if (appliedCode) {
		return (
			<div
				className="flex flex-col gap-1.5 p-3.5"
				style={{ border: "1px solid var(--sl-wine)", background: "var(--sl-danger-wash)" }}
			>
				<div className="flex items-center justify-between gap-3 text-[13px]">
					<span className="font-bold text-[color:var(--sl-accent)]">
						Cupom {appliedCode}
						{discountLabel ? ` · ${discountLabel}` : ""}
					</span>
					<button
						type="button"
						className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--sl-accent)] underline"
						onClick={() => void onRemove()}
					>
						Remover
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-1.5">
			<span className="sl-lbl">Cupom</span>
			<div className="flex gap-2">
				<input
					value={code}
					onChange={(event) => setCode(event.target.value.toUpperCase())}
					placeholder="SARAU10"
					className="sl-field flex-1 bg-[color:var(--sl-surface-card)] text-[14px] outline-none"
				/>
				<button
					type="button"
					className="sl-btn sl-btn-secondary"
					disabled={busy || !code.trim()}
					onClick={async () => {
						setBusy(true);
						try {
							await onApply(code.trim());
						} finally {
							setBusy(false);
						}
					}}
				>
					Aplicar
				</button>
			</div>
			{errorMessage ? <p className="m-0 text-[12px] text-[color:var(--sl-accent)]">{errorMessage}</p> : null}
		</div>
	);
}
