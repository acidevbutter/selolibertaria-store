"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/ui/shadcn/button";

type Operation = "cancel" | "refund";

export default function AdminPaymentOperations({
	orderId,
	status,
	amountInCents,
	currency,
}: {
	orderId: string;
	status: string;
	amountInCents: number;
	currency: string;
}) {
	const router = useRouter();
	const [running, setRunning] = useState<Operation | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const normalized = status.trim().toLowerCase();
	const canCancel = normalized === "pending";
	const canRefund = normalized === "paid" || normalized === "succeeded" || normalized === "approved";

	async function run(operation: Operation) {
		const label = operation === "cancel" ? "cancelar" : "estornar";
		if (!window.confirm(`Confirma ${label} este pedido? A operação será registrada no histórico.`)) return;
		setRunning(operation);
		setMessage(null);
		setError(null);
		try {
			const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/payment`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ operation }),
			});
			const payload = (await response.json().catch(() => null)) as { error?: string } | null;
			if (!response.ok) throw new Error(payload?.error || "Não foi possível concluir a operação.");
			setMessage(operation === "cancel" ? "Cancelamento confirmado." : "Estorno confirmado.");
			router.refresh();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Não foi possível concluir a operação.");
		} finally {
			setRunning(null);
		}
	}

	return (
		<div className="border border-[color:var(--editorial-border)] bg-[color:var(--editorial-paper)] p-4 sm:p-5">
			<div className="space-y-1">
				<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
					Operações de pagamento
				</div>
				<p className="text-sm leading-6 text-[color:var(--editorial-muted)]">
					A consulta ao Mercado Pago acontece antes da operação. O pedido local só muda após confirmação.
				</p>
			</div>
			<div className="mt-4 flex flex-wrap items-center gap-2">
				<Button
					size="sm"
					variant="outline"
					disabled={!canCancel || running !== null}
					onClick={() => run("cancel")}
				>
					{running === "cancel" ? "Cancelando..." : "Cancelar order"}
				</Button>
				<Button
					size="sm"
					variant="outline"
					disabled={!canRefund || running !== null}
					onClick={() => run("refund")}
				>
					{running === "refund" ? "Estornando..." : "Estorno total"}
				</Button>
				<span className="text-xs text-[color:var(--editorial-muted)]">
					{new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format((amountInCents || 0) / 100)}
				</span>
			</div>
			{message ? <div className="mt-3 text-sm text-emerald-700">{message}</div> : null}
			{error ? <div className="mt-3 text-sm text-destructive">{error}</div> : null}
		</div>
	);
}
