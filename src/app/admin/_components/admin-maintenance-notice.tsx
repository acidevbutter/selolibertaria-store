import Link from "next/link";
import type { ActivationRecord } from "@/app/ativacao/activation-actions";

/**
 * Shown on every admin page while the storefront is in maintenance -- the default state, and the
 * state "Desativar loja" puts it back in. `activation` is null when the backend could not be read,
 * which the public gate treats as maintenance too (fail-closed), so the notice says so instead of
 * claiming a status it could not confirm.
 */
export function AdminMaintenanceNotice({ activation }: { activation: ActivationRecord | null }) {
	const neverLaunched = activation !== null && !activation.activatedAt;
	return (
		<div
			role="status"
			className="ad-panel"
			style={{
				display: "flex",
				flexWrap: "wrap",
				alignItems: "center",
				gap: 12,
				padding: "12px 16px",
				marginBottom: 16,
				borderColor: "var(--ad-wine-line)",
			}}
		>
			<span className="ad-badge ad-b-dra">Loja em manutenção</span>
			<span style={{ flex: "1 1 280px", lineHeight: 1.6, fontSize: 14 }}>
				{activation === null
					? "Não foi possível confirmar o status da loja; clientes veem a página de manutenção enquanto isso."
					: "Clientes veem a página de manutenção. O admin continua acessível para você editar e testar."}
			</span>
			<Link className="ad-btn ad-sec" href="/admin/settings">
				Status da loja
			</Link>
			{neverLaunched ? (
				<Link className="ad-btn ad-ink" href="/ativacao">
					Lançar com o assistente
				</Link>
			) : null}
		</div>
	);
}
