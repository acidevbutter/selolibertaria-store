import Link from "next/link";
import { redirect } from "next/navigation";
import { env } from "@/env.mjs";
import { resolveLocale } from "@/i18n/config";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { getDb } from "@/lib/mongodb";
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
	const locale = (await getDefaultLocaleSetting()) ?? resolveLocale(env.NEXT_PUBLIC_LANGUAGE);

	const db = await getDb();
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

	const now = new Date();
	let since: Date | null = null;
	if (period === "7d") since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	else if (period === "30d") since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	else if (period === "90d") since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
	else if (period === "365d") since = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

	const pipeline: Record<string, unknown>[] = [
		{ $match: { purchases: { $exists: true, $ne: [] } } },
		{ $project: { email: 1, purchases: 1 } },
		{ $unwind: "$purchases" },
	];

	const match: Record<string, unknown> = {};
	if (status !== "all") match["purchases.status"] = status;
	if (since) match["purchases.createdAt"] = { $gte: since };
	if (Object.keys(match).length) pipeline.push({ $match: match });

	let sortStage: Record<string, 1 | -1> = { "purchases.createdAt": -1 };
	if (sort === "date-asc") sortStage = { "purchases.createdAt": 1 };
	if (sort === "amount-desc") sortStage = { "purchases.amountTotal": -1 };
	if (sort === "amount-asc") sortStage = { "purchases.amountTotal": 1 };
	pipeline.push({ $sort: sortStage }, { $limit: 50 });

	interface AggOrderItem {
		email: string;
		purchases: {
			id: string;
			amountTotal: number;
			currency: string;
			status: string;
			createdAt: string | Date;
		};
	}
	const items = (await db.collection("users").aggregate(pipeline).toArray()) as unknown as AggOrderItem[];
	const paidCount = items.filter((item) => item.purchases.status === "paid").length;
	const processingCount = items.filter((item) => item.purchases.status === "processing").length;
	const defaultCurrency = String(env.STRIPE_CURRENCY ?? "BRL")
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
								{items.map((it: AggOrderItem) => (
									<TableRow key={it.purchases.id}>
										<TableCell className="break-all">{it.email}</TableCell>
										<TableCell>
											{new Intl.NumberFormat(locale, {
												style: "currency",
												currency: it.purchases.currency?.toUpperCase?.() || defaultCurrency,
											}).format((it.purchases.amountTotal || 0) / 100)}
										</TableCell>
										<TableCell className="capitalize">
											<StatusBadge status={it.purchases.status} />
										</TableCell>
										<TableCell>{new Date(it.purchases.createdAt).toLocaleString(locale)}</TableCell>
										<TableCell className="font-mono text-xs break-all">{it.purchases.id}</TableCell>
										<TableCell className="text-right">
											<Link
												className="font-semibold text-[color:var(--editorial-accent)] underline underline-offset-4"
												href={`/admin/orders/${it.purchases.id}`}
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
									Volte para a loja, confira se os livros estão visíveis e rode um fluxo de compra para validar a operação.
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
									Ver livros
								</Link>
							</div>
						</div>
					) : null}
				</div>
			</EditorialPanel>
		</AdminEditorialPage>
	);
}
