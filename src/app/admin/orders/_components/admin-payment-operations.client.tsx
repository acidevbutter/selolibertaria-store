"use client";

import { useState } from "react";

export default function AdminPaymentOperations({ orderId }: { orderId: string }) {
	const [message, setMessage] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function submit(operation: "cancel" | "refund") {
		setPending(true);
		setMessage(null);
		try {
			const response = await fetch("/api/admin/asaas/payment-operation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderId, operation }),
			});
			const body = (await response.json().catch(() => null)) as { detail?: string; error?: string } | null;
			if (!response.ok) throw new Error(body?.detail || body?.error || "Operação indisponível");
			setMessage(operation === "cancel" ? "Cobrança cancelada." : "Estorno solicitado à Asaas.");
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Operação indisponível");
		} finally {
			setPending(false);
		}
	}

	return (
		<div className="border border-[color:var(--editorial-border)] bg-[#fbf7f1] p-4 sm:p-5">
			<p className="m-0 text-sm leading-6 text-[color:var(--editorial-muted)]">
				Operações são confirmadas diretamente com a Asaas; o webhook atualiza o estado final.
			</p>
			<div className="mt-3 flex flex-wrap gap-2">
				<button
					disabled={pending}
					type="button"
					onClick={() => submit("cancel")}
					className="sl-btn sl-btn-secondary"
				>
					Cancelar cobrança
				</button>
				<button
					disabled={pending}
					type="button"
					onClick={() => submit("refund")}
					className="sl-btn sl-btn-secondary"
				>
					Solicitar estorno
				</button>
			</div>
			{message ? (
				<p className="mt-3 mb-0 text-sm" role="status">
					{message}
				</p>
			) : null}
		</div>
	);
}
