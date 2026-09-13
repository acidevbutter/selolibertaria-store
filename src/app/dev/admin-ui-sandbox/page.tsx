import { DataTable } from "@/app/admin/_components/ui/DataTable";
import { Field } from "@/app/admin/_components/ui/Field";
import { MetricCard } from "@/app/admin/_components/ui/MetricCard";
import { StatusBadge } from "@/app/admin/_components/ui/StatusBadge";

export const dynamic = "force-static";

type SandboxRow = { id: number; produto: string; formato: string; total: string; status: string };

const rows: SandboxRow[] = [
	{ id: 1, produto: "Ninfas do Tietê", formato: "Livro", total: "R$ 89,00", status: "Pago" },
	{ id: 2, produto: "Vírus do Beijo", formato: "Zine", total: "R$ 42,00", status: "Enviado" },
];

/**
 * Dev-only sandbox for the four shared admin UI pieces (fatia 00.2).
 * Lives outside `/admin` on purpose: the admin layout requires an
 * authenticated backoffice session, and this page needs to render without one.
 */
export default function AdminUiSandboxPage() {
	return (
		<div className="min-h-dvh bg-[var(--sl-paper)] p-10 text-[var(--sl-text)]">
			<h1 className="sl-head mb-8 text-2xl">Admin UI sandbox — fatia 00.2</h1>

			<section className="mb-10">
				<h2 className="sl-eyebrow mb-4 text-[var(--sl-accent)]">MetricCard</h2>
				<div className="grid max-w-3xl grid-cols-3 gap-5">
					<MetricCard label="Pagamentos recebidos" value="R$ 4.280,00" />
					<MetricCard label="Pedidos" value="37" href="/admin/orders" action="Ver todos" />
					<MetricCard label="Estoque crítico" value="3" tone="danger" note="Reabastecer esta semana" />
				</div>
			</section>

			<section className="mb-10">
				<h2 className="sl-eyebrow mb-4 text-[var(--sl-accent)]">StatusBadge</h2>
				<div className="flex gap-3">
					<StatusBadge tone="neutral">Pago</StatusBadge>
					<StatusBadge tone="active">Enviado</StatusBadge>
					<StatusBadge tone="alert">Falhou</StatusBadge>
				</div>
			</section>

			<section className="mb-10">
				<h2 className="sl-eyebrow mb-4 text-[var(--sl-accent)]">Field — repouso, foco, erro</h2>
				<div className="grid max-w-xl grid-cols-1 gap-5">
					<Field label="E-mail" placeholder="voce@exemplo.com" />
					<Field label="CEP" defaultValue="01310-100" hint="Endereço de entrega" />
					<Field label="Cupom" state="error" hint="Cupom inválido ou expirado." defaultValue="PROMO10" />
				</div>
			</section>

			<section className="mb-10">
				<h2 className="sl-eyebrow mb-4 text-[var(--sl-accent)]">DataTable — com dados e vazio</h2>
				<div className="mb-6 max-w-2xl">
					<DataTable
						columns={[
							{ key: "produto", label: "Produto" },
							{ key: "formato", label: "Formato" },
							{ key: "total", label: "Total", numeric: true },
							{
								key: "status",
								label: "Status",
								render: (row: SandboxRow) => (
									<StatusBadge tone={row.status === "Pago" ? "neutral" : "active"}>{row.status}</StatusBadge>
								),
							},
						]}
						rows={rows}
					/>
				</div>
				<div className="max-w-2xl">
					<DataTable
						columns={[
							{ key: "produto", label: "Produto" },
							{ key: "total", label: "Total", numeric: true },
						]}
						rows={[]}
						empty="Nenhum produto encontrado. Ajuste o filtro ou cadastre um novo produto."
					/>
				</div>
			</section>
		</div>
	);
}
