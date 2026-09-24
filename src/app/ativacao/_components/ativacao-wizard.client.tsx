"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PresaleWizard } from "@/app/admin/pre-venda/_components/presale-wizard.client";
import type { PresaleRecord } from "@/app/admin/pre-venda/presale-actions";
import { activateSiteAction } from "@/app/ativacao/activation-actions";

export function AtivacaoWizard({ presale }: { presale: PresaleRecord }) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);

	async function handlePublished() {
		const result = await activateSiteAction();
		if (!result.ok) {
			setError(result.message ?? "Não foi possível concluir a ativação.");
			return;
		}
		router.push("/admin");
	}

	return (
		<PresaleWizard
			presale={presale}
			onPublished={handlePublished}
			publishLabel="Publicar e liberar o painel"
			rail={{
				eyebrow: "Primeiro acesso",
				title: "Abrir a pré-venda",
				subtitle: "little fish, big fish · Natália Nolli Sasso",
			}}
			banner={
				error ? (
					<p style={{ margin: 0, color: "var(--ad-wine)", fontSize: 14 }}>{error}</p>
				) : (
					<p style={{ margin: 0, fontSize: 13, color: "var(--ad-text-quiet)" }}>
						O painel administrativo fica bloqueado até essa ativação ser concluída.
					</p>
				)
			}
		/>
	);
}
