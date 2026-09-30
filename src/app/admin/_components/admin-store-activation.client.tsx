"use client";

import { useState, useTransition } from "react";
import {
	type ActivationRecord,
	activateSiteAction,
	deactivateSiteAction,
} from "@/app/ativacao/activation-actions";
import { SlButton } from "@/ui/sl/sl-button";

function formatDateTime(iso: string | null) {
	if (!iso) return null;
	// Fixed zone: the SSR pass runs in UTC and the browser in its own zone, and a mismatch is a hydration error (#418).
	return new Date(iso).toLocaleString("pt-BR", {
		dateStyle: "short",
		timeStyle: "short",
		timeZone: "America/Sao_Paulo",
	});
}

export function AdminStoreActivation({ initial }: { initial: ActivationRecord | null }) {
	const [activation, setActivation] = useState(initial);
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const activated = activation?.activated ?? false;

	function handleToggle() {
		if (activated) {
			const confirmed = window.confirm(
				"Desativar a loja tira o site do ar para clientes imediatamente. Continuar?",
			);
			if (!confirmed) return;
		}
		setError(null);
		startTransition(async () => {
			const result = activated ? await deactivateSiteAction() : await activateSiteAction();
			if (!result.ok) {
				setError(result.message ?? "Não foi possível atualizar o status da loja.");
				return;
			}
			if (result.activation) setActivation(result.activation);
		});
	}

	const activatedAtLabel = formatDateTime(activation?.activatedAt ?? null);
	const deactivatedAtLabel = formatDateTime(activation?.deactivatedAt ?? null);

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-3">
				<span
					className="inline-flex h-6 items-center rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.14em]"
					style={{
						background: activated ? "rgba(38,120,68,0.12)" : "rgba(122,30,34,0.12)",
						color: activated ? "#267844" : "var(--ad-wine, #7A1E22)",
					}}
				>
					{activated ? "Loja no ar" : "Loja desativada"}
				</span>
				{activated && activatedAtLabel && (
					<span className="text-sm text-[var(--sl-text-muted)]">Ativada em {activatedAtLabel}</span>
				)}
				{!activated && deactivatedAtLabel && (
					<span className="text-sm text-[var(--sl-text-muted)]">Desativada em {deactivatedAtLabel}</span>
				)}
			</div>
			<p className="text-sm leading-6 text-[var(--sl-text-muted)]">
				{activated
					? "Desativar redireciona clientes para a página de manutenção. O admin continua acessível."
					: "A loja fica em manutenção para clientes até que um admin reative."}
			</p>
			<SlButton
				type="button"
				variant={activated ? "secondary" : "primary"}
				onClick={handleToggle}
				disabled={pending}
			>
				{pending ? "Atualizando..." : activated ? "Desativar loja" : "Ativar loja"}
			</SlButton>
			{error && <div className="text-sm text-[var(--ad-wine,_#7A1E22)]">{error}</div>}
		</div>
	);
}

export default AdminStoreActivation;
