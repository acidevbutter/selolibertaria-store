import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { env } from "@/env.mjs";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { getDefaultLocaleSetting } from "@/lib/settings-store";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/ui/shadcn/table";
import { AdminFilters } from "../admin-filters.client";
export const dynamic = "force-dynamic";

import { StatusBadge } from "@/ui/status-badge";

type SearchParams = { status?: string | string[]; period?: string | string[]; sort?: string | string[] };

export default async function AdminOrdersPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "orders.read")) redirect("/forbidden");
	const locale = (await getDefaultLocaleSetting()) ?? DEFAULT_LOCALE;

	const sp = (await searchParams) || {};
	const asStr = (v: unknown): string | undefined =>
		typeof v === "string"
			? v
			: Array.isArray(v)
				? typeof v[0] === "string"
					? (v[0] as string)
					: undefined
				: undefined;
	const status = (asStr(sp?.status) ?? "all").toLowerCase();
	const period = (asStr(sp?.period) ?? "30d").toLowerCase();
	const sort = (asStr(sp?.sort) ?? "date-desc").toLowerCase();

	const token = (await cookies()).get("session")?.value;
	if (!token) redirect("/login");
	const response = await fetch(`${env.FASTAPI_API_URL}/orders/?page=1&page_size=200`, {
		headers: { authorization: `Bearer ${token}` },
		cache: "no-store",
	});
	if (!response.ok) redirect("/forbidden");
	const remote = (await response.json()) as {
		items: Array<{
			id: string;
			buyer_email: string | null;
			amount_total: number;
			currency: string;
			status: string;
			created_at: string;
		}>;
	};
	const now = Date.now();
	const periodMs = { "7d": 7, "30d": 30, "90d": 90, "365d": 365 }[period] ?? null;
	const items = remote.items
		.filter((item) => status === "all" || item.status === status)
		.filter((item) => !periodMs || new Date(item.created_at).getTime() >= now - periodMs * 86400000)
		.sort((left, right) => {
			const byAmount = sort.startsWith("amount");
			const comparison = byAmount
				? left.amount_total - right.amount_total
				: new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
			return sort.endsWith("asc") ? comparison : -comparison;
		})
		.slice(0, 50);
	const paidCount = items.filter((item) => item.status === "paid" || item.status === "approved").length;
	const processingCount = items.filter(
		(item) => item.status === "processing" || item.status === "pending",
	).length;
	const defaultCurrency = String(env.CATALOG_CURRENCY ?? "BRL")
		.trim()
		.toUpperCase();

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Pedidos"
				title="Pedidos"
				description="Acompanhe status, pagamento e operação."
				actions={
					<div className="w-full max-w-3xl border border-[color:var(--editorial-border)] bg-[#fbf7f1] p-4">
						<AdminFilters defaultStatus={status} defaultPeriod={period} defaultSort={sort} />
					</div>
				}
			/>
			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat
					label="Pedidos listados"
					value={items.length}
					helper="Recorte atual limitado aos 50 pedidos mais recentes."
				/>
				<AdminEditorialStat
					label="Pagos"
					value={paidCount}
					helper="Entradas com pagamento confirmado neste filtro."
				/>
				<AdminEditorialStat
					label="Em processamento"
					value={processingCount}
					helper="Pedidos que ainda aguardam confirmação ou avanço."
				/>
			</div>
			<EditorialPanel className="p-0">
				<div className="border-b border-[color:var(--editorial-border)] px-6 py-5 sm:px-8">
					<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
						Pedidos recentes
					</div>
				</div>
				<div className="p-6 sm:p-8">
					<div className="w-full overflow-x-auto">
						<Table className="min-w-[640px]">
							<TableHeader>
								<TableRow>
									<TableHead>E-mail do cliente</TableHead>
									<TableHead>Valor</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Data</TableHead>
									<TableHead>Pedido</TableHead>
									<TableHead></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((it) => (
									<TableRow key={it.id}>
										<TableCell className="break-all">{it.buyer_email || "Não informado"}</TableCell>
										<TableCell>
											{new Intl.NumberFormat(locale, {
												style: "currency",
												currency: it.currency?.toUpperCase?.() || defaultCurrency,
											}).format((it.amount_total || 0) / 100)}
										</TableCell>
										<TableCell className="capitalize">
											<StatusBadge status={it.status} />
										</TableCell>
										<TableCell>{new Date(it.created_at).toLocaleString(locale)}</TableCell>
										<TableCell className="font-mono text-xs break-all">{it.id}</TableCell>
										<TableCell className="text-right">
											<Link
												className="font-semibold text-[color:var(--editorial-accent)] underline underline-offset-4"
												href={`/admin/orders/${it.id}`}
											>
												Ver pedido
											</Link>
										</TableCell>
									</TableRow>
								))}
								{items.length === 0 && (
									<TableRow>
										<TableCell colSpan={6} className="py-6 text-[color:var(--editorial-muted)]">
											Nenhum pedido encontrado.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
							<TableCaption>Mostrando até 50 pedidos.</TableCaption>
						</Table>
					</div>
					{items.length === 0 ? (
						<div className="mt-4 flex flex-col gap-4 border border-[color:var(--editorial-border)] bg-[#fbf7f1] p-5 sm:flex-row sm:items-center sm:justify-between">
							<div className="space-y-1">
								<p className="text-sm font-semibold text-[color:var(--editorial-ink)]">
									Ainda não há pedidos neste recorte.
								</p>
								<p className="text-sm leading-6 text-[color:var(--editorial-muted)]">
									Volte para a loja, confira se os produtos estão visíveis e rode um fluxo de compra para
									validar a operação.
								</p>
							</div>
							<div className="flex flex-wrap gap-2">
								<Link
									href="/"
									className="inline-flex h-10 items-center justify-center rounded-none border border-[color:var(--editorial-border)] bg-white px-4 text-sm font-medium text-[color:var(--editorial-ink)] transition-colors hover:bg-[#f4eee5]"
								>
									Ver loja
								</Link>
								<Link
									href="/admin/products"
									className="inline-flex h-10 items-center justify-center rounded-none bg-[color:var(--editorial-ink)] px-4 text-sm font-medium text-[color:var(--editorial-paper)] transition-colors hover:bg-[color:var(--editorial-accent)]"
								>
									Ver produtos
								</Link>
							</div>
						</div>
					) : null}
				</div>
			</EditorialPanel>
		</AdminEditorialPage>
	);
}
