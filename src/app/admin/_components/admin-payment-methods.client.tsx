"use client";

import { useEffect, useState } from "react";
import { SlButton } from "@/ui/sl/sl-button";

/**
 * Admin toggle for optional checkout payment methods. Pix + credit card are
 * always on; boleto is opt-in and off by default (the backend must also accept
 * `payment_method: { type: "boleto" }`).
 */
export function AdminPaymentMethods() {
	const [boletoEnabled, setBoletoEnabled] = useState(false);
	const [loaded, setLoaded] = useState(false);
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const res = await fetch("/api/admin/settings");
				const data = (await res.json()) as { current?: { paymentBoletoEnabled?: boolean } } | null;
				if (mounted) {
					setBoletoEnabled(data?.current?.paymentBoletoEnabled === true);
					setLoaded(true);
				}
			} catch {
				if (mounted) setLoaded(true);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	async function save(next: boolean) {
		setLoading(true);
		setStatus(null);
		const previous = boletoEnabled;
		setBoletoEnabled(next);
		try {
			const res = await fetch("/api/admin/settings", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ paymentBoletoEnabled: next }),
				credentials: "include",
			});
			setStatus(res.ok ? "Preferência salva." : "Não foi possível salvar.");
			if (!res.ok) setBoletoEnabled(previous);
		} catch {
			setStatus("Não foi possível salvar.");
			setBoletoEnabled(previous);
		}
		setLoading(false);
		setTimeout(() => setStatus(null), 3000);
	}

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="text-sm font-medium">Boleto no checkout</p>
					<p className="text-sm text-[var(--sl-text-muted)]">
						Pix e cartão de crédito estão sempre ativos. O boleto atrasa a separação do pedido, então fica
						desligado até você habilitar.
					</p>
				</div>
				<SlButton
					type="button"
					variant={boletoEnabled ? "primary" : "secondary"}
					disabled={!loaded || loading}
					onClick={() => void save(!boletoEnabled)}
				>
					{boletoEnabled ? "Ativado" : "Desativado"}
				</SlButton>
			</div>
			{status ? <p className="text-sm text-[var(--sl-text-muted)]">{status}</p> : null}
		</div>
	);
}

export default AdminPaymentMethods;
