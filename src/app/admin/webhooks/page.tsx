import { Activity } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/app/admin/_components/ui/DataTable";
import { MetricCard } from "@/app/admin/_components/ui/MetricCard";
import { env } from "@/env.mjs";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { auth } from "@/lib/auth";
import { getDefaultLocaleSetting } from "@/lib/settings-store";
import { StatusBadge } from "@/ui/status-badge";
import { ReconcileOrdersButton } from "./reconcile-orders-button.client";

export const dynamic = "force-dynamic";

interface WebhookLogDoc {
	id: string;
	event_id?: string | null;
	event_type?: string | null;
	status?: string | null;
	verified?: boolean | null;
	received_at?: Date | string | null;
	processed_at?: Date | string | null;
	error?: string | null;
	raw?: unknown;
	headers?: Record<string, string>;
}

type SearchParams = {
	limit?: string | string[];
	skip?: string | string[];
	status?: string | string[];
};

function asString(value: string | string[] | undefined) {
	return typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
}

function toDateString(value: Date | string | null | undefined, locale: string) {
	if (!value) return "-";
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime())
		? "-"
		: new Intl.DateTimeFormat(locale, {
				dateStyle: "short",
				timeStyle: "medium",
			}).format(date);
}

function formatJson(value: unknown) {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

export default async function AdminWebhooksPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
	const session = await auth();
	if (!session) redirect("/login");
	if (session.user.role !== "admin") redirect("/forbidden");
	const locale = (await getDefaultLocaleSetting()) ?? DEFAULT_LOCALE;

	const resolved = (await searchParams) || {};
	const limit = Math.min(Math.max(Number(asString(resolved.limit) || "50"), 1), 200);
	const skip = Math.max(Number(asString(resolved.skip) || "0"), 0);
	const status = (asString(resolved.status) || "all").toLowerCase();

	const token = (await cookies()).get("session")?.value;
	const response = token
		? await fetch(
				`${env.FASTAPI_API_URL}/webhooks?page=${Math.floor(skip / limit) + 1}&page_size=${limit}${status !== "all" ? `&status=${encodeURIComponent(status)}` : ""}`,
				{ headers: { authorization: `Bearer ${token}` }, cache: "no-store" },
			)
		: null;
	const payload = response?.ok ? ((await response.json()) as { items?: WebhookLogDoc[] }) : { items: [] };
	const items = payload.items ?? [];

	const processedCount = items.filter((item) => item.status === "processed").length;
	const failedCount = items.filter((item) => item.status === "failed").length;
	const unverifiedCount = items.filter((item) => item.verified === false).length;

	const columns: DataTableColumn<WebhookLogDoc>[] = [
		{
			key: "received_at",
			label: "Recebido em",
			width: "170px",
			numeric: true,
			render: (item) => toDateString(item.received_at, locale),
		},
		{
			key: "status",
			label: "Status",
			width: "140px",
			render: (item) => <StatusBadge status={item.status || "unknown"} />,
		},
		{
			key: "verified",
			label: "Verificação",
			width: "190px",
			render: (item) => (item.verified ? "Assinatura validada" : "Assinatura sem validação"),
		},
		{
			key: "event_type",
			label: "Tipo",
			width: "160px",
			numeric: true,
			render: (item) => item.event_type || "-",
		},
		{
			key: "event_id",
			label: "ID do evento",
			numeric: true,
			render: (item) => item.event_id || "-",
		},
		{
			key: "error",
			label: "Erro",
			width: "220px",
			render: (item) => (item.error ? <span style={{ color: "var(--ad-wine)" }}>{item.error}</span> : "-"),
		},
		{
			key: "details",
			label: "Detalhes",
			width: "140px",
			render: (item) => (
				<details style={{ maxWidth: 420 }}>
					<summary
						className="ad-mono"
						style={{ cursor: "pointer", fontSize: 12, textDecoration: "underline" }}
					>
						Ver detalhes
					</summary>
					<div className="mt-3 space-y-3">
						<div>
							<p className="ad-ml" style={{ marginBottom: 4 }}>
								Cabeçalhos da requisição
							</p>
							<pre
								className="ad-mono"
								style={{
									maxHeight: 224,
									overflow: "auto",
									border: "1px solid var(--ad-line-strong)",
									background: "var(--ad-sand)",
									padding: 12,
									fontSize: 11,
								}}
							>
								{formatJson(item.headers || {})}
							</pre>
						</div>
						<div>
							<p className="ad-ml" style={{ marginBottom: 4 }}>
								Conteúdo recebido
							</p>
							<pre
								className="ad-mono"
								style={{
									maxHeight: 320,
									overflow: "auto",
									border: "1px solid var(--ad-line-strong)",
									background: "var(--ad-sand)",
									padding: 12,
									fontSize: 11,
								}}
							>
								{formatJson(item.raw ?? null)}
							</pre>
						</div>
					</div>
				</details>
			),
		},
	];

	return (
		<>
			<div className="ad-head">
				<h1>Recebimento de webhooks</h1>
				<span className="ad-meta">Acompanhe eventos recebidos, falhas e validação de assinatura.</span>
				<div className="ad-acts">
					<ReconcileOrdersButton />
					{[
						{ href: "/admin/webhooks?status=all", label: "Todos", active: status === "all" },
						{
							href: "/admin/webhooks?status=processed",
							label: "Processados",
							active: status === "processed",
						},
						{ href: "/admin/webhooks?status=pending", label: "Pendentes", active: status === "pending" },
						{ href: "/admin/webhooks?status=failed", label: "Com falha", active: status === "failed" },
					].map((item) => (
						<Link key={item.href} href={item.href} className={`ad-chip ${item.active ? "on" : ""}`}>
							{item.label}
						</Link>
					))}
				</div>
			</div>

			<div className="ad-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
				<MetricCard label="Registros" value={items.length} note={`Últimos ${limit} eventos carregados.`} />
				<MetricCard label="Processados" value={processedCount} note="Recebidos sem falha." />
				<MetricCard
					label="Com falha"
					value={failedCount}
					note="Precisam de revisão."
					tone={failedCount > 0 ? "danger" : "default"}
				/>
				<MetricCard
					label="Não verificados"
					value={unverifiedCount}
					note="Assinatura sem validação."
					tone={unverifiedCount > 0 ? "danger" : "default"}
				/>
			</div>

			<div className="ad-ml" style={{ display: "flex", alignItems: "center", gap: 8 }}>
				<Activity className="h-4 w-4" />
				Eventos recebidos
			</div>

			<DataTable<WebhookLogDoc>
				columns={columns}
				rows={items}
				empty="Nenhum registro encontrado para este filtro."
			/>

			{items.length === 0 ? (
				<div
					className="ad-panel"
					style={{
						display: "flex",
						flexDirection: "column",
						gap: 16,
						padding: "var(--ad-pad-sheet)",
					}}
				>
					<div>
						<p style={{ fontWeight: 900 }}>Ainda não há registros de recebimento neste filtro.</p>
						<p className="ad-body">
							Valide uma compra recente ou revise os pedidos para confirmar se os eventos estão chegando como
							esperado.
						</p>
					</div>
					<div className="ad-acts" style={{ marginLeft: 0 }}>
						<Link href="/admin/orders" className="ad-btn ad-sec">
							Ver pedidos
						</Link>
						<Link href="/admin/emails" className="ad-btn ad-ink">
							Ver e-mails
						</Link>
					</div>
				</div>
			) : null}
		</>
	);
}
