"use client";

import { useState } from "react";

export function ReconcileOrdersButton() {
	const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
	async function reconcile() {
		setState("loading");
		try {
			const response = await fetch("/api/admin/asaas/reconcile", { method: "POST" });
			if (!response.ok) throw new Error("reconciliation failed");
			setState("done");
		} catch {
			setState("error");
		}
	}
	return (
		<button
			type="button"
			className="sl-btn sl-btn-secondary"
			disabled={state === "loading"}
			onClick={reconcile}
		>
			{state === "loading" ? "Verificando…" : state === "done" ? "Verificado" : "Reconciliar cobranças"}
		</button>
	);
}
