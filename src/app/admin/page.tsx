import { AlertTriangle, ArrowRight, CreditCard, Package2, ShieldAlert, Wallet } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminDashboardData } from "@/lib/admin-dashboard";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { RevenueSparkline } from "@/ui/charts/revenue-sparkline.client";
import { RevenueZoomBrush } from "@/ui/charts/revenue-zoom-brush.client";
import { Reveal } from "@/ui/motion/reveal";
import { Card, CardContent, CardHeader } from "@/ui/shadcn/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/shadcn/table";
import { StatusBadge } from "@/ui/status-badge";
import { AdminFilters } from "./admin-filters.client";

export const dynamic = "force-dynamic";

type SearchParams = { status?: string | string[]; period?: string | string[]; sort?: string | string[] };

function asStr(value: unknown): string | undefined {
	return typeof value === "string"
		? value
		: Array.isArray(value)
			? typeof value[0] === "string"
				? (value[0] as string)
				: undefined
			: undefined;
}

function formatMoney(amount: number, currency: string) {
	try {
		return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(amount / 100);
	} catch {
		return `${(amount / 100).toFixed(2)} ${currency}`;
	}
}

function formatMoneyList(lines: Array<{ currency: string; amountCents: number }>, emptyLabel = "—") {
	if (lines.length === 0) return <div className="text-4xl font-semibold tracking-tight">{emptyLabel}</div>;

	return (
		<div className="space-y-2">
			{lines.map((line, index) => (
				<div
					key={line.currency}
					className={index === 0 ? "text-4xl font-semibold tracking-tight" : "text-lg text-muted-foreground"}
				>
					{formatMoney(line.amountCents, line.currency)}
				</div>
			))}
		</div>
	);
}

function SectionHeader({
	eyebrow,
	title,
	description,
	actionHref,
	actionLabel,
}: {
	eyebrow?: string;
	title: string;
	description?: string;
	actionHref?: string;
	actionLabel?: string;
}) {
	return (
		<div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
			<div className="space-y-2">
				{eyebrow ? (
					<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
						{eyebrow}
					</div>
				) : null}
				<h2 className="display-font text-3xl font-black tracking-[-0.04em] text-[color:var(--editorial-ink)] sm:text-4xl">
					{title}
				</h2>
				{description ? (
					<p className="max-w-3xl text-sm leading-6 text-[color:var(--editorial-muted)]">{description}</p>
				) : null}
			</div>
			{actionHref && actionLabel ? (
				<Link
					href={actionHref}
					className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-ink)] underline underline-offset-4"
				>
					{actionLabel}
					<ArrowRight className="h-4 w-4" />
				</Link>
			) : null}
		</div>
	);
}

function StatCard({
	icon,
	label,
	value,
	helper,
	tone = "default",
}: {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
	helper?: React.ReactNode;
	tone?: "default" | "danger" | "warning";
}) {
	const toneClass =
		tone === "danger"
			? "border-red-200/80 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/20"
			: tone === "warning"
				? "border-amber-200/80 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20"
				: "border-border bg-card";

	return (
		<Card className={toneClass}>
			<CardContent className="p-6">
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-3">
						<div className="text-sm font-medium text-muted-foreground">{label}</div>
						<div>{value}</div>
						{helper ? <div className="text-sm leading-6 text-muted-foreground">{helper}</div> : null}
					</div>
					<div className="rounded-xl border bg-background/80 p-3 text-foreground">{icon}</div>
				</div>
			</CardContent>
		</Card>
	);
}

function QueueMetric({
	label,
	value,
	help,
	emphasis = "normal",
}: {
	label: string;
	value: number;
	help?: string;
	emphasis?: "normal" | "danger" | "warning";
}) {
	const emphasisClass =
		emphasis === "danger"
			? "border-red-200/80 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20"
			: emphasis === "warning"
				? "border-amber-200/80 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20"
				: "border-border bg-background";

	return (
		<div className={`rounded-2xl border p-5 ${emphasisClass}`}>
			<div className="text-sm font-medium text-muted-foreground">{label}</div>
			<div className="mt-3 text-4xl font-semibold tracking-tight">{value}</div>
			{help ? <div className="mt-3 text-sm leading-6 text-muted-foreground">{help}</div> : null}
		</div>
	);
}

function HealthRow({
	label,
	value,
	supplement,
	href,
	linkLabel,
	tone = "default",
}: {
	label: string;
	value: number;
	supplement?: string;
	href?: string;
	linkLabel?: string;
	tone?: "default" | "danger" | "warning";
}) {
	const toneClass =
		tone === "danger"
			? "border-red-200/80 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/20"
			: tone === "warning"
				? "border-amber-200/80 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20"
				: "border-border bg-background";

	return (
		<div className={`rounded-2xl border p-5 ${toneClass}`}>
			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="space-y-2">
					<div className="text-sm font-medium text-muted-foreground">{label}</div>
					<div className="text-3xl font-semibold tracking-tight">{value}</div>
					{supplement ? <div className="text-sm leading-6 text-muted-foreground">{supplement}</div> : null}
				</div>
				{href && linkLabel ? (
					<Link href={href} className="text-sm font-medium underline underline-offset-4">
						{linkLabel}
					</Link>
				) : null}
			</div>
		</div>
	);
}

function DashboardMetricCard({
	label,
	value,
	helper,
	accentClass,
}: {
	label: string;
	value: React.ReactNode;
	helper: string;
	accentClass: string;
}) {
	return (
		<div className="relative overflow-hidden rounded-[18px] border border-[#ded5ca] bg-[#fffdf8] p-5 pl-6">
			<div className={`absolute inset-y-0 left-0 w-[5px] ${accentClass}`} />
			<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#746b63]">{label}</div>
			<div className="mt-3 text-[2rem] font-bold leading-none tracking-[-0.05em] text-[#171414]">{value}</div>
			<div className="mt-3 text-sm leading-6 text-[#746b63]">{helper}</div>
		</div>
	);
}

function PriorityPill({
	label,
	tone,
}: {
	label: string;
	tone: "default" | "warning" | "danger" | "success";
}) {
	const toneClass =
		tone === "danger"
			? "border-[#ead2ce] bg-[#f5dfdc] text-[#a02a2a]"
			: tone === "warning"
				? "border-[#e7d7bf] bg-[#f7ebd7] text-[#a76a1d]"
				: tone === "success"
					? "border-[#bed9ca] bg-[#dfeee6] text-[#23634a]"
					: "border-[#ded5ca] bg-[#fffdf8] text-[#7a1e22]";

	return (
		<span
			className={`inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.12em] ${toneClass}`}
		>
			{label}
		</span>
	);
}

export default async function AdminPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "admin.access")) redirect("/forbidden");

	const sp = (await searchParams) || {};
	const status = (asStr(sp?.status) ?? "all").toLowerCase();
	const period = (asStr(sp?.period) ?? "30d").toLowerCase();
	const sort = (asStr(sp?.sort) ?? "date-desc").toLowerCase();

	const dashboard = await getAdminDashboardData({ status, period, sort });
	const couponRate = `${Math.round(dashboard.couponOrdersRate * 100)}%`;
	const urgentOrders =
		dashboard.paymentFunnel.awaitingAction +
		dashboard.paymentFunnel.processing +
		dashboard.paymentFunnel.disputed +
		dashboard.fulfillmentQueue.paidWithoutFulfillment;
	const webhookAttention = dashboard.opsHealth.webhooksFailed + dashboard.opsHealth.webhooksPending;
	const emailAttention = dashboard.opsHealth.emailFailed + dashboard.opsHealth.emailPending;
	const priorityRows: Array<{
		section: string;
		description: string;
		pill: string;
		tone: "default" | "warning" | "danger" | "success";
		accentClass: string;
	}> = [
		{
			section: "Pedidos",
			description:
				dashboard.paymentFunnel.awaitingAction > 0
					? `${dashboard.paymentFunnel.awaitingAction} pagamento(s) aguardam confirmação ou troca de método.`
					: "Nenhum pagamento está parado aguardando ação manual.",
			pill: dashboard.paymentFunnel.awaitingAction > 0 ? "Revisar" : "OK",
			tone: dashboard.paymentFunnel.awaitingAction > 0 ? "warning" : "success",
			accentClass: dashboard.paymentFunnel.awaitingAction > 0 ? "bg-[#a76a1d]" : "bg-[#23634a]",
		},
		{
			section: "Expedição",
			description:
				dashboard.fulfillmentQueue.paidWithoutFulfillment > 0
					? `${dashboard.fulfillmentQueue.paidWithoutFulfillment} pedido(s) pagos ainda não entraram no fluxo de fulfillment.`
					: "Todos os pedidos pagos já avançaram para a operação.",
			pill: dashboard.fulfillmentQueue.paidWithoutFulfillment > 0 ? "Atenção" : "OK",
			tone: dashboard.fulfillmentQueue.paidWithoutFulfillment > 0 ? "danger" : "success",
			accentClass: dashboard.fulfillmentQueue.paidWithoutFulfillment > 0 ? "bg-[#a02a2a]" : "bg-[#23634a]",
		},
		{
			section: "Webhooks",
			description:
				webhookAttention > 0
					? `${dashboard.opsHealth.webhooksFailed} falha(s) e ${dashboard.opsHealth.webhooksPending} pendência(s) no ingest de eventos.`
					: "Eventos recebidos sem fila pendente ou falha operacional.",
			pill: dashboard.opsHealth.webhooksFailed > 0 ? "Falha" : webhookAttention > 0 ? "Checar" : "OK",
			tone: dashboard.opsHealth.webhooksFailed > 0 ? "danger" : webhookAttention > 0 ? "warning" : "success",
			accentClass:
				dashboard.opsHealth.webhooksFailed > 0
					? "bg-[#a02a2a]"
					: webhookAttention > 0
						? "bg-[#a76a1d]"
						: "bg-[#23634a]",
		},
		{
			section: "Emails",
			description:
				emailAttention > 0
					? `${dashboard.opsHealth.emailFailed} envio(s) falharam e ${dashboard.opsHealth.emailPending} seguem pendentes.`
					: "Comunicação transacional sem filas travadas no recorte atual.",
			pill: dashboard.opsHealth.emailFailed > 0 ? "Falha" : emailAttention > 0 ? "Checar" : "OK",
			tone: dashboard.opsHealth.emailFailed > 0 ? "danger" : emailAttention > 0 ? "warning" : "success",
			accentClass:
				dashboard.opsHealth.emailFailed > 0
					? "bg-[#a02a2a]"
					: emailAttention > 0
						? "bg-[#a76a1d]"
						: "bg-[#23634a]",
		},
		{
			section: "Disputas",
			description:
				dashboard.recentDisputesCount > 0
					? `${dashboard.recentDisputesCount} disputa(s) no período filtrado exigem leitura próxima.`
					: "Nenhuma disputa recente registrada neste recorte.",
			pill: dashboard.recentDisputesCount > 0 ? "Pendente" : "OK",
			tone: dashboard.recentDisputesCount > 0 ? "default" : "success",
			accentClass: dashboard.recentDisputesCount > 0 ? "bg-[#7a1e22]" : "bg-[#23634a]",
		},
	];

	return (
		<main className="w-full space-y-10">
			<Reveal>
				<section className="overflow-hidden border border-[color:var(--editorial-border)] bg-[color:var(--editorial-paper)]">
					<div className="border-b border-[color:var(--editorial-border)] px-5 py-5 sm:px-6 xl:px-10">
						<div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
							<div className="space-y-2">
								<h1 className="text-[1.95rem] font-bold leading-none tracking-[-0.05em] text-[#171414] sm:text-[2.35rem]">
									Painel de operação
								</h1>
								<p className="max-w-3xl text-sm leading-6 text-[#746b63]">
									Acompanhe prioridades, catálogo e operação.
								</p>
							</div>
							<div className="flex flex-wrap gap-3">
								<Link
									href="/"
									className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#ded5ca] bg-[#fffdf8] px-5 text-sm font-semibold text-[#171414] transition-colors hover:bg-[#f4eee5]"
								>
									Pré-visualizar
								</Link>
								<Link
									href="/admin/editorial"
									className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#7a1e22] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#612226]"
								>
									Abrir editorial
								</Link>
							</div>
						</div>
					</div>
					<div className="space-y-6 px-5 py-6 sm:px-6 xl:px-10 xl:py-8">
						<div className="border border-[color:var(--editorial-border)] bg-[#fbf7f1] p-4">
							<AdminFilters defaultStatus={status} defaultPeriod={period} defaultSort={sort} />
						</div>

						{dashboard.hasMultipleCurrencies ? (
							<div className="border border-[rgba(11,11,11,0.14)] bg-[color:var(--editorial-beige)]/35 p-4 text-sm leading-6 text-[color:var(--editorial-ink)]">
								Os totais permanecem separados por moeda para evitar misturar valores nominais incompatíveis.
							</div>
						) : null}

						<div className="grid gap-4 xl:grid-cols-4">
							<DashboardMetricCard
								label="Pendências"
								value={urgentOrders}
								helper="Pagamentos em revisão, disputas e pedidos pagos que ainda não entraram na operação."
								accentClass="bg-[#7a1e22]"
							/>
							<DashboardMetricCard
								label="Pedidos"
								value={dashboard.filteredPurchases}
								helper="Pedidos considerados no recorte atual do painel."
								accentClass="bg-[#a76a1d]"
							/>
							<DashboardMetricCard
								label="Webhooks"
								value={webhookAttention}
								helper="Falhas e pendências de ingestão que podem travar reconciliação automática."
								accentClass="bg-[#a02a2a]"
							/>
							<DashboardMetricCard
								label="Emails"
								value={emailAttention}
								helper="Envios pendentes ou com falha que afetam a comunicação transacional."
								accentClass="bg-[#23634a]"
							/>
						</div>

						<div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_318px]">
							<div className="rounded-[22px] border border-[#ded5ca] bg-[#fffdf8] p-6">
								<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
									<div className="space-y-2">
										<div className="text-[1.1rem] font-bold tracking-[-0.03em] text-[#171414]">
											Fila editorial
										</div>
										<p className="max-w-2xl text-sm leading-6 text-[#746b63]">
											Tudo que exige decisão rápida antes de seguir para o site, para o pós-compra ou para a
											operação interna.
										</p>
									</div>
									<PriorityPill label="Modo revisão" tone="default" />
								</div>
								<div className="mt-6 space-y-3">
									{priorityRows.map((row) => (
										<div
											key={row.section}
											className="relative overflow-hidden rounded-2xl border border-[#ded5ca] bg-[#fbf7f0] px-5 py-4"
										>
											<div className={`absolute inset-y-0 left-0 w-1 ${row.accentClass}`} />
											<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
												<div className="space-y-1 pl-1">
													<div className="text-sm font-bold text-[#171414]">{row.section}</div>
													<div className="max-w-2xl text-sm leading-6 text-[#746b63]">{row.description}</div>
												</div>
												<PriorityPill label={row.pill} tone={row.tone} />
											</div>
										</div>
									))}
								</div>
								<div className="mt-6 flex flex-wrap gap-3">
									<Link
										href="/admin/orders"
										className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#7a1e22] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#612226]"
									>
										Abrir pedidos
									</Link>
									<Link
										href="/admin/editorial"
										className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#ded5ca] bg-[#fffdf8] px-5 text-sm font-semibold text-[#171414] transition-colors hover:bg-[#f4eee5]"
									>
										Abrir editorial
									</Link>
								</div>
							</div>

							<div className="space-y-6">
								<div className="rounded-[22px] bg-[#0b0b0b] p-6 text-white">
									<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8d0c4]">
										Preview da loja
									</div>
									<div className="mt-4 rounded-2xl bg-[#f7f1e8] p-5 text-[#0b0b0b]">
										<div className="flex items-start gap-4">
											<div className="h-[126px] w-[82px] shrink-0 rounded-[5px] bg-[#0b0b0b]" />
											<div className="space-y-3">
												<div className="text-lg font-bold uppercase leading-[1.05] tracking-[-0.04em]">
													Ninfas
													<br />
													do Tietê
												</div>
												<p className="text-xs leading-5 text-[#746b63]">
													Leitura rápida do storefront para checar vitrine, narrativa e CTA principal.
												</p>
												<span className="inline-flex h-7 items-center rounded-[7px] bg-[#7a1e22] px-4 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
													Comprar
												</span>
											</div>
										</div>
									</div>
									<div className="mt-5 space-y-2">
										<div className="text-base font-bold text-white">Publicação segura</div>
										<p className="text-sm leading-6 text-[#beb3a8]">
											Use o preview para validar storefront, conteúdo e ritmo antes de mexer em publicação.
										</p>
									</div>
								</div>

								<div className="rounded-[22px] border border-[#ded5ca] bg-[#fffdf8] p-6">
									<div className="space-y-2">
										<div className="text-[1.1rem] font-bold tracking-[-0.03em] text-[#171414]">
											Atividade recente
										</div>
										<p className="text-sm leading-6 text-[#746b63]">
											Últimos pedidos do recorte atual para checagem rápida de ritmo e status.
										</p>
									</div>
									<div className="mt-6 space-y-5">
										{dashboard.recentPurchases.slice(0, 3).map((purchase, index) => (
											<div key={purchase.id} className="flex gap-3">
												<div
													className={`mt-2 h-[7px] w-[7px] shrink-0 rounded-full ${
														index === 0 ? "bg-[#7a1e22]" : index === 1 ? "bg-[#23634a]" : "bg-[#a76a1d]"
													}`}
												/>
												<div className="min-w-0 space-y-1">
													<div className="text-sm font-semibold text-[#171414]">
														{formatMoney(purchase.amountTotal, purchase.currency)} ·{" "}
														{purchase.userEmail || "Cliente sem email"}
													</div>
													<div className="truncate text-xs leading-5 text-[#746b63]">
														{purchase.id} · {new Date(purchase.createdAt).toLocaleString("pt-BR")}
													</div>
												</div>
											</div>
										))}
										{dashboard.recentPurchases.length === 0 ? (
											<div className="text-sm leading-6 text-[#746b63]">
												Nenhuma compra encontrada para os filtros selecionados.
											</div>
										) : null}
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>
			</Reveal>

			<Reveal delay={0.04}>
				<section className="space-y-5">
					<SectionHeader
						eyebrow="Resumo financeiro"
						title="Sinais centrais da operação"
						description="Leitura ampla de receita, volume, desconto e alcance para entender o dia sem atravessar várias telas."
					/>

					<div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
						<StatCard
							icon={<Wallet className="h-5 w-5" />}
							label="Faturamento pago"
							value={formatMoneyList(dashboard.revenueByCurrency)}
							helper="Receita confirmada no período selecionado."
						/>
						<StatCard
							icon={<CreditCard className="h-5 w-5" />}
							label="Ticket médio"
							value={formatMoneyList(dashboard.averageOrderValueByCurrency)}
							helper="Valor médio por pedido pago, separado por moeda quando necessário."
						/>
						<StatCard
							icon={<Package2 className="h-5 w-5" />}
							label="Volume de pedidos"
							value={
								<div className="text-5xl font-semibold tracking-tight">{dashboard.filteredPurchases}</div>
							}
							helper={
								<span>
									{dashboard.buyersCount} compradores, {dashboard.couponOrdersCount} pedidos com cupom e{" "}
									{couponRate} de adoção.
								</span>
							}
						/>
						<StatCard
							icon={<ShieldAlert className="h-5 w-5" />}
							label="Receita líquida"
							value={formatMoneyList(dashboard.netRevenueByCurrency)}
							helper="Faturamento pago já descontado do volume reembolsado."
						/>
					</div>

					<div className="grid gap-5 lg:grid-cols-3">
						<StatCard
							icon={<ArrowRight className="h-5 w-5" />}
							label="Desconto aplicado"
							value={formatMoneyList(dashboard.discountByCurrency)}
							helper="Pressão total de desconto aplicada ao recorte filtrado."
							tone="warning"
						/>
						<StatCard
							icon={<AlertTriangle className="h-5 w-5" />}
							label="Valor reembolsado"
							value={formatMoneyList(dashboard.refundedByCurrency)}
							helper={`${dashboard.recentRefundsCount} pedido(s) reembolsado(s) no período selecionado.`}
							tone="danger"
						/>
						<StatCard
							icon={<Package2 className="h-5 w-5" />}
							label="Base da loja"
							value={<div className="text-5xl font-semibold tracking-tight">{dashboard.usersCount}</div>}
							helper={`${dashboard.buyersCount} clientes compraram dentro do recorte atual.`}
						/>
					</div>
				</section>
			</Reveal>

			<Reveal delay={0.08}>
				<section className="grid gap-6 2xl:grid-cols-2">
					<Card>
						<CardHeader className="pb-4">
							<SectionHeader
								eyebrow="Pedidos"
								title="Funil de pagamento"
								description="Veja o que converteu, o que está travado e onde o fluxo financeiro perde ritmo."
								actionHref="/admin/orders"
								actionLabel="Abrir pedidos"
							/>
						</CardHeader>
						<CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
							<QueueMetric
								label="Aguardando ação"
								value={dashboard.paymentFunnel.awaitingAction}
								help="Exige confirmação manual ou troca de método."
								emphasis={dashboard.paymentFunnel.awaitingAction > 0 ? "warning" : "normal"}
							/>
							<QueueMetric
								label="Em processamento"
								value={dashboard.paymentFunnel.processing}
								help="Pagamentos sob análise ou confirmação assíncrona."
								emphasis={dashboard.paymentFunnel.processing > 0 ? "warning" : "normal"}
							/>
							<QueueMetric label="Pago" value={dashboard.paymentFunnel.paid} help="Receita já confirmada." />
							<QueueMetric
								label="Falhou / cancelado"
								value={dashboard.paymentFunnel.failedCanceled}
								help="Pedidos que não viraram faturamento."
								emphasis={dashboard.paymentFunnel.failedCanceled > 0 ? "danger" : "normal"}
							/>
							<QueueMetric
								label="Reembolsado"
								value={dashboard.paymentFunnel.refunded}
								help="Pedidos com status ligado a reembolso."
								emphasis={dashboard.paymentFunnel.refunded > 0 ? "danger" : "normal"}
							/>
							<QueueMetric
								label="Disputado"
								value={dashboard.paymentFunnel.disputed}
								help="Chargebacks e estados de disputa que pedem leitura próxima."
								emphasis={dashboard.paymentFunnel.disputed > 0 ? "danger" : "normal"}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-4">
							<SectionHeader
								eyebrow="Operação"
								title="Fila de fulfillment"
								description="Leia onde o pós-pagamento está fluindo e onde a operação ainda está emperrada."
								actionHref="/admin/orders"
								actionLabel="Revisar operação"
							/>
						</CardHeader>
						<CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
							<QueueMetric label="Recebido" value={dashboard.fulfillmentQueue.received} />
							<QueueMetric label="Produção" value={dashboard.fulfillmentQueue.producing} />
							<QueueMetric label="Enviado" value={dashboard.fulfillmentQueue.shipped} />
							<QueueMetric
								label="Pago sem avanço"
								value={dashboard.fulfillmentQueue.paidWithoutFulfillment}
								help="Pedidos pagos que ainda não entraram no fluxo operacional."
								emphasis={dashboard.fulfillmentQueue.paidWithoutFulfillment > 0 ? "danger" : "normal"}
							/>
							<QueueMetric
								label="Enviado sem rastreio"
								value={dashboard.fulfillmentQueue.shippedWithoutTracking}
								help="Pedidos marcados como enviados mas ainda sem tracking."
								emphasis={dashboard.fulfillmentQueue.shippedWithoutTracking > 0 ? "warning" : "normal"}
							/>
						</CardContent>
					</Card>
				</section>
			</Reveal>

			<Reveal delay={0.12}>
				<section className="space-y-5">
					<SectionHeader
						eyebrow="Tendência"
						title="Receita paga ao longo do tempo"
						description="Área ampla para leitura da curva de faturamento sem comprimir o histórico."
					/>

					<Card>
						<CardContent className="p-4 sm:p-6">
							<div className="mb-6 rounded-2xl border bg-muted/15 p-5">
								<div className="text-sm text-muted-foreground">Prévia do recorte</div>
								<div className="mt-3">
									<RevenueSparkline
										seriesCents={dashboard.revenueSeriesCents}
										labels={dashboard.revenueSeriesDays}
										currency={dashboard.primaryCurrency}
										height={96}
									/>
								</div>
							</div>

							<RevenueZoomBrush
								points={dashboard.revenueZoomBrushPoints}
								currency={dashboard.primaryCurrency}
							/>
						</CardContent>
					</Card>
				</section>
			</Reveal>

			<Reveal delay={0.16}>
				<section className="space-y-5">
					<SectionHeader
						eyebrow="Confiabilidade"
						title="Saúde operacional"
						description="Problemas técnicos que podem corroer conversão, comunicação ou cadência de fulfillment sem chamar atenção."
					/>

					<div className="grid gap-5 lg:grid-cols-3">
						<HealthRow
							label="Falhas de webhook"
							value={dashboard.opsHealth.webhooksFailed}
							supplement={`${dashboard.opsHealth.webhooksPending} evento(s) ainda pendente(s) no período filtrado.`}
							href="/admin/webhooks"
							linkLabel="Inspecionar webhooks"
							tone={
								dashboard.opsHealth.webhooksFailed > 0
									? "danger"
									: dashboard.opsHealth.webhooksPending > 0
										? "warning"
										: "default"
							}
						/>
						<HealthRow
							label="Falhas de email"
							value={dashboard.opsHealth.emailFailed}
							supplement={`${dashboard.opsHealth.emailPending} envio(s) transacional(is) ainda pendente(s).`}
							href="/admin/emails"
							linkLabel="Inspecionar emails"
							tone={
								dashboard.opsHealth.emailFailed > 0
									? "danger"
									: dashboard.opsHealth.emailPending > 0
										? "warning"
										: "default"
							}
						/>
						<HealthRow
							label="Ações manuais em pedidos"
							value={dashboard.opsHealth.manualTouches}
							supplement="Edições de fulfillment registradas no período."
							tone="default"
						/>
					</div>
				</section>
			</Reveal>

			<Reveal delay={0.2}>
				<section className="grid gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)]">
					<Card>
						<CardHeader className="pb-4">
							<SectionHeader
								eyebrow="Atividade"
								title="Compras recentes"
								description="Pedidos mais recentes do recorte atual, com respiro suficiente para leitura rápida."
							/>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<Table className="min-w-[860px]">
									<TableHeader>
										<TableRow>
											<TableHead className="w-[24%]">Cliente</TableHead>
											<TableHead className="w-[14%]">Valor</TableHead>
											<TableHead className="w-[14%]">Status</TableHead>
											<TableHead className="w-[18%]">Data</TableHead>
											<TableHead className="w-[22%]">Pedido</TableHead>
											<TableHead className="w-[8%] text-right">Ação</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{dashboard.recentPurchases.map((purchase) => (
											<TableRow key={purchase.id}>
												<TableCell className="py-4 align-top">
													<div className="max-w-[240px] break-all text-sm leading-6">
														{purchase.userEmail}
													</div>
												</TableCell>
												<TableCell className="py-4 align-top text-sm font-medium">
													{formatMoney(purchase.amountTotal, purchase.currency)}
												</TableCell>
												<TableCell className="py-4 align-top">
													<StatusBadge status={purchase.status} />
												</TableCell>
												<TableCell className="py-4 align-top text-sm text-muted-foreground">
													{new Date(purchase.createdAt).toLocaleString("pt-BR")}
												</TableCell>
												<TableCell className="py-4 align-top font-mono text-xs leading-6 break-all text-muted-foreground">
													{purchase.id}
												</TableCell>
												<TableCell className="py-4 text-right align-top">
													<Link
														className="text-sm font-medium underline underline-offset-4"
														href={`/admin/orders/${purchase.id}`}
													>
														Abrir
													</Link>
												</TableCell>
											</TableRow>
										))}
										{dashboard.recentPurchases.length === 0 ? (
											<TableRow>
												<TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
													Nenhuma compra encontrada para os filtros selecionados.
												</TableCell>
											</TableRow>
										) : null}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-4">
							<SectionHeader
								eyebrow="Clientes"
								title="Clientes recorrentes"
								description="Quem mais comprou dentro do período filtrado."
							/>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{dashboard.topCustomers.map((customer) => (
									<div key={customer.email} className="rounded-2xl border p-5">
										<div className="break-all text-base font-medium leading-7">{customer.email}</div>
										<div className="mt-4 grid gap-4 sm:grid-cols-3">
											<div>
												<div className="text-sm text-muted-foreground">Pedidos</div>
												<div className="mt-1 text-2xl font-semibold">{customer.count}</div>
											</div>
											<div>
												<div className="text-sm text-muted-foreground">Pagos</div>
												<div className="mt-1 text-2xl font-semibold">{customer.paidCount}</div>
											</div>
											<div>
												<div className="text-sm text-muted-foreground">Total gasto</div>
												<div className="mt-1 text-lg font-semibold leading-7">
													{dashboard.hasMultipleCurrencies
														? "Multimoeda"
														: formatMoney(customer.totalSpentCents, dashboard.primaryCurrency)}
												</div>
											</div>
										</div>
									</div>
								))}

								{dashboard.topCustomers.length === 0 ? (
									<div className="rounded-2xl border border-dashed py-10 text-center text-muted-foreground">
										Nenhum cliente encontrado para os filtros selecionados.
									</div>
								) : null}
							</div>
						</CardContent>
					</Card>
				</section>
			</Reveal>
		</main>
	);
}
