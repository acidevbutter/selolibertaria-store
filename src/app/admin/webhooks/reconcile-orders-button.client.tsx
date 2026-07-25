"use client";

import { useState } from "react";

export function ReconcileOrdersButton() {
	const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

	async function reconcile() {
		setState("loading");
		try {
			const response = await fetch("/api/admin/mercado-pago/reconcile", { method: "POST" });
			if (!response.ok) throw new Error("reconciliation failed");
			setState("done");
		} catch {
			setState("error");
		}
	}

	return (
		<button
			type="button"
			onClick={reconcile}
			disabled={state === "loading"}
			className="inline-flex h-10 items-center rounded-none bg-[color:var(--editorial-accent)] px-4 text-sm font-medium text-white transition-opacity disabled:opacity-60"
		>
			{state === "loading"
				? "Reconciliando..."
				: state === "done"
					? "Reconciliação executada"
					: state === "error"
						? "Tentar novamente"
						: "Reconciliar orders pendentes"}
		</button>
	);
}
