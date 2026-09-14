import Link from "next/link";
import { redirect } from "next/navigation";
import { DataTable } from "@/app/admin/_components/ui/DataTable";
import { MetricCard } from "@/app/admin/_components/ui/MetricCard";
import { StatusBadge } from "@/app/admin/_components/ui/StatusBadge";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { getAdminDashboardData } from "@/lib/admin-dashboard";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { getDefaultLocaleSetting } from "@/lib/settings-store";
import { RevenueSparkline } from "@/ui/charts/revenue-sparkline.client";
import { RevenueZoomBrush } from "@/ui/charts/revenue-zoom-brush.client";
import { Reveal } from "@/ui/motion/reveal";
import { StatusBadge as PurchaseStatusBadge } from "@/ui/status-badge";
import { AdminFilters } from "./admin-filters.client";

export const dynamic = "force-dynamic";

type SearchParams = { status?: string | string[]; period?: string | string[]; sort?: string | string[] };
type Tone = "neutral" | "active" | "alert";

function asStr(value: unknown): string | undefined {
	return typeof value === "string"
		? value
		: Array.isArray(value)
			? typeof value[0] === "string"
				? (value[0] as string)
				: undefined
			: undefined;
}

function formatMoney(amount: number, currency: string, locale: string) {
	try {
		return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount / 100);
	} catch {
		return `${(amount / 100).toFixed(2)} ${currency}`;
	}
}

function formatMoneyList(
	lines: Array<{ currency: string; amountCents: number }>,
	locale: string,
	emptyLabel = "—",
) {
	if (lines.length === 0) return <div className="text-4xl font-semibold tracking-tight">{emptyLabel}</div>;

	return (
		<div className="space-y-2">
			{lines.map((line, index) => (
				<div
					key={line.currency}
					className={
						index === 0 ? "text-4xl font-semibold tracking-tight" : "text-lg text-[var(--sl-text-soft)]"
					}
				>
					{formatMoney(line.amountCents, line.currency, locale)}
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
				{eyebrow ? <div className="sl-eyebrow text-[var(--sl-accent)]">{eyebrow}</div> : null}
				<h2 className="text-3xl font-black tracking-[-0.04em] text-[var(--sl-text)] sm:text-4xl">{title}</h2>
				{description ? (
					<p className="max-w-3xl text-sm leading-6 text-[var(--sl-text-muted)]">{description}</p>
				) : null}
			</div>
			{actionHref && actionLabel ? (
				<Link
					href={actionHref}
					className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-text)] underline underline-offset-4"
				>
					{actionLabel}
				</Link>
			) : null}
		</div>
	);
}

/** A plain, zero-radius card surface — the shared shape every section below sits in. */
function Surface({ className, children }: { className?: string; children: React.ReactNode }) {
	return (
		<div className={`border border-[var(--sl-line)] bg-[var(--sl-surface-card)] ${className ?? ""}`}>
			{children}
		</div>
	);
}

export default async function AdminPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "admin.access")) redirect("/forbidden");
	const locale = (await getDefaultLocaleSetting()) ?? DEFAULT_LOCALE;

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
		tone: Tone;
	}> = [
		{
			section: "Pedidos",
			description:
				dashboard.paymentFunnel.awaitingAction > 0
					? `${dashboard.paymentFunnel.awaitingAction} pagamento(s) aguardam confirmação ou troca de método.`
					: "Nenhum pagamento está parado aguardando ação manual.",
			pill: dashboard.paymentFunnel.awaitingAction > 0 ? "Revisar" : "Em dia",
			tone: dashboard.paymentFunnel.awaitingAction > 0 ? "alert" : "neutral",
		},
		{
			section: "Expedição",
			description:
				dashboard.fulfillmentQueue.paidWithoutFulfillment > 0
					? `${dashboard.fulfillmentQueue.paidWithoutFulfillment} pedido(s) pagos ainda não entraram no fluxo de expedição.`
					: "Todos os pedidos pagos já avançaram para a operação.",
			pill: dashboard.fulfillmentQueue.paidWithoutFulfillment > 0 ? "Atenção" : "Em dia",
			tone: dashboard.fulfillmentQueue.paidWithoutFulfillment > 0 ? "alert" : "neutral",
		},
		{
			section: "Recebimento",
			description:
				webhookAttention > 0
					? `${dashboard.opsHealth.webhooksFailed} falha(s) e ${dashboard.opsHealth.webhooksPending} pendência(s) no recebimento de eventos.`
					: "Sem pendências ou falhas recentes no recebimento de eventos.",
			pill: dashboard.opsHealth.webhooksFailed > 0 ? "Falha" : webhookAttention > 0 ? "Checar" : "Em dia",
			tone: webhookAttention > 0 ? "alert" : "neutral",
		},
		{
			section: "E-mails",
			description:
				emailAttention > 0
					? `${dashboard.opsHealth.emailFailed} envio(s) falharam e ${dashboard.opsHealth.emailPending} seguem pendentes.`
					: "Sem filas travadas nos envios recentes.",
			pill: dashboard.opsHealth.emailFailed > 0 ? "Falha" : emailAttention > 0 ? "Checar" : "Em dia",
			tone: emailAttention > 0 ? "alert" : "neutral",
		},
		{
			section: "Disputas",
			description:
				dashboard.recentDisputesCount > 0
					? `${dashboard.recentDisputesCount} disputa(s) no período pedem atenção.`
					: "Nenhuma disputa recente neste período.",
			pill: dashboard.recentDisputesCount > 0 ? "Pendente" : "Em dia",
			tone: dashboard.recentDisputesCount > 0 ? "active" : "neutral",
		},
	];

	return (
		<main className="w-full space-y-10">
			<Reveal>
				<section className="overflow-hidden border border-[var(--sl-line-hairline)] bg-[var(--sl-paper)]">
					<div className="border-b border-[var(--sl-line-hairline)] px-5 py-5 sm:px-6 xl:px-10">
						<div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
							<div className="space-y-2">
								<h1 className="text-[1.95rem] font-bold leading-none tracking-[-0.05em] text-[var(--sl-text)] sm:text-[2.35rem]">
									Painel de operação
								</h1>
								<p className="max-w-3xl text-sm leading-6 text-[var(--sl-text-muted)]">
									Acompanhe prioridades, catálogo e andamento da operação.
								</p>
							</div>
							<div className="flex flex-wrap gap-3">
								<Link href="/" className="sl-btn sl-btn-secondary">
									Ver loja
								</Link>
								<Link href="/admin/editorial" className="sl-btn sl-btn-accent">
									Ir para editorial
								</Link>
							</div>
						</div>
					</div>
					<div className="space-y-6 px-5 py-6 sm:px-6 xl:px-10 xl:py-8">
						<div className="border border-[var(--sl-line-hairline)] bg-[var(--sl-surface-band)] p-4">
							<AdminFilters defaultStatus={status} defaultPeriod={period} defaultSort={sort} />
						</div>

						{dashboard.hasMultipleCurrencies ? (
							<div className="border border-[var(--sl-line-hairline)] bg-[var(--sl-sand)]/35 p-4 text-sm leading-6 text-[var(--sl-text)]">
								Há totais com origens diferentes no período, então os valores aparecem em linhas separadas.
							</div>
						) : null}

						<div className="grid gap-4 xl:grid-cols-4">
							<MetricCard
								label="Pendências"
								value={urgentOrders}
								note="Pagamentos em revisão, disputas e pedidos pagos que ainda não seguiram para expedição."
								tone={urgentOrders > 0 ? "danger" : "default"}
							/>
							<MetricCard
								label="Pedidos"
								value={dashboard.filteredPurchases}
								note="Pedidos dentro do filtro atual."
							/>
							<MetricCard
								label="Recebimento"
								value={webhookAttention}
								note="Falhas e pendências no recebimento de eventos."
								tone={webhookAttention > 0 ? "danger" : "default"}
							/>
							<MetricCard
								label="E-mails"
								value={emailAttention}
								note="Envios pendentes ou com falha."
								tone={emailAttention > 0 ? "danger" : "default"}
							/>
						</div>

						<div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_318px]">
							<Surface className="p-6">
								<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
									<div className="space-y-2">
										<div className="text-[1.1rem] font-bold tracking-[-0.03em] text-[var(--sl-text)]">
											Fila editorial
										</div>
										<p className="max-w-2xl text-sm leading-6 text-[var(--sl-text-muted)]">
											Tudo que exige decisão rápida antes de seguir para o site, para o pós-compra ou para a
											equipe.
										</p>
									</div>
									<StatusBadge tone="neutral">Em revisão</StatusBadge>
								</div>
								<div className="mt-6 space-y-3">
									{priorityRows.map((row) => (
										<div
											key={row.section}
											className="border border-[var(--sl-line-hairline)] bg-[var(--sl-surface-band)] px-5 py-4"
										>
											<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
												<div className="space-y-1">
													<div className="text-sm font-bold text-[var(--sl-text)]">{row.section}</div>
													<div className="max-w-2xl text-sm leading-6 text-[var(--sl-text-muted)]">
														{row.description}
													</div>
												</div>
												<StatusBadge tone={row.tone}>{row.pill}</StatusBadge>
											</div>
										</div>
									))}
								</div>
								<div className="mt-6 flex flex-wrap gap-3">
									<Link href="/admin/orders" className="sl-btn sl-btn-accent">
										Ver pedidos
									</Link>
									<Link href="/admin/editorial" className="sl-btn sl-btn-secondary">
										Ver editorial
									</Link>
								</div>
							</Surface>

							<div className="space-y-6">
								<div className="bg-[var(--sl-ink)] p-6 text-[var(--sl-text-on-ink)]">
									<div className="sl-eyebrow text-[var(--sl-sand)]">Prévia da loja</div>
									<div className="mt-4 bg-[var(--sl-paper)] p-5 text-[var(--sl-ink)]">
										<div className="flex items-start gap-4">
											<div className="h-[126px] w-[82px] shrink-0 bg-[var(--sl-ink)]" />
											<div className="space-y-3">
												<div className="text-lg font-bold uppercase leading-[1.05] tracking-[-0.04em]">
													Ninfas
													<br />
													do Tietê
												</div>
												<p className="text-xs leading-5 text-[var(--sl-text-muted)]">
													Leitura rápida da loja para checar vitrine e CTA principal.
												</p>
												<span className="inline-flex h-[var(--sl-h-badge)] items-center bg-[var(--sl-buy)] px-[9px] text-[10px] font-black tracking-[0.2em] text-[var(--sl-text-on-ink)] uppercase">
													Comprar
												</span>
											</div>
										</div>
									</div>
									<div className="mt-5 space-y-2">
										<div className="text-base font-bold text-[var(--sl-text-on-ink)]">Publicação segura</div>
										<p className="text-sm leading-6 text-[var(--sl-text-on-ink-soft)]">
											Use a prévia para validar loja, conteúdo e ritmo antes de mexer em publicação.
										</p>
									</div>
								</div>

								<Surface className="p-6">
									<div className="space-y-2">
										<div className="text-[1.1rem] font-bold tracking-[-0.03em] text-[var(--sl-text)]">
											Atividade recente
										</div>
										<p className="text-sm leading-6 text-[var(--sl-text-muted)]">
											Últimos pedidos do filtro atual para checagem rápida de ritmo e status.
										</p>
									</div>
									<div className="mt-6 space-y-5">
										{dashboard.recentPurchases.slice(0, 3).map((purchase) => (
											<div key={purchase.id} className="flex gap-3">
												<div className="mt-2 h-[7px] w-[7px] shrink-0 bg-[var(--sl-wine)]" />
												<div className="min-w-0 space-y-1">
													<div className="text-sm font-semibold text-[var(--sl-text)]">
														{formatMoney(purchase.amountTotal, purchase.currency, locale)} ·{" "}
														{purchase.userEmail || "Cliente sem e-mail"}
													</div>
													<div className="truncate text-xs leading-5 text-[var(--sl-text-muted)]">
														{purchase.id} · {new Date(purchase.createdAt).toLocaleString(locale)}
													</div>
												</div>
											</div>
										))}
										{dashboard.recentPurchases.length === 0 ? (
											<div className="text-sm leading-6 text-[var(--sl-text-muted)]">
												Nenhuma compra encontrada para os filtros selecionados.
											</div>
										) : null}
									</div>
								</Surface>
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
						description="Veja receita, volume, desconto e alcance sem atravessar várias telas."
					/>

					<div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
						<MetricCard
							label="Faturamento pago"
							value={formatMoneyList(dashboard.revenueByCurrency, locale)}
							note="Receita confirmada no período selecionado."
						/>
						<MetricCard
							label="Ticket médio"
							value={formatMoneyList(dashboard.averageOrderValueByCurrency, locale)}
							note="Valor médio por pedido pago no período selecionado."
						/>
						<MetricCard
							label="Volume de pedidos"
							value={dashboard.filteredPurchases}
							note={`${dashboard.buyersCount} compradores, ${dashboard.couponOrdersCount} pedidos com cupom e ${couponRate} de adoção.`}
						/>
						<MetricCard
							label="Receita líquida"
							value={formatMoneyList(dashboard.netRevenueByCurrency, locale)}
							note="Faturamento pago já descontado do volume reembolsado."
						/>
					</div>

					<div className="grid gap-5 lg:grid-cols-3">
						<MetricCard
							label="Desconto aplicado"
							value={formatMoneyList(dashboard.discountByCurrency, locale)}
							note="Total de desconto aplicado no período."
						/>
						<MetricCard
							label="Valor reembolsado"
							value={formatMoneyList(dashboard.refundedByCurrency, locale)}
							note={`${dashboard.recentRefundsCount} pedido(s) reembolsado(s) no período selecionado.`}
							tone="danger"
						/>
						<MetricCard
							label="Base da loja"
							value={dashboard.usersCount}
							note={`${dashboard.buyersCount} clientes compraram no período.`}
						/>
					</div>
				</section>
			</Reveal>

			<Reveal delay={0.08}>
				<section className="grid gap-6 2xl:grid-cols-2">
					<Surface className="p-6">
						<SectionHeader
							eyebrow="Pedidos"
							title="Funil de pagamento"
							description="Veja o que converteu, o que travou e onde o fluxo financeiro perde ritmo."
							actionHref="/admin/orders"
							actionLabel="Ver pedidos"
						/>
						<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
							<MetricCard
								label="Aguardando ação"
								value={dashboard.paymentFunnel.awaitingAction}
								note="Exige confirmação manual ou troca de método."
								tone={dashboard.paymentFunnel.awaitingAction > 0 ? "danger" : "default"}
							/>
							<MetricCard
								label="Em processamento"
								value={dashboard.paymentFunnel.processing}
								note="Pagamentos sob análise ou confirmação assíncrona."
								tone={dashboard.paymentFunnel.processing > 0 ? "danger" : "default"}
							/>
							<MetricCard label="Pago" value={dashboard.paymentFunnel.paid} note="Receita já confirmada." />
							<MetricCard
								label="Falhou / cancelado"
								value={dashboard.paymentFunnel.failedCanceled}
								note="Pedidos que não viraram faturamento."
								tone={dashboard.paymentFunnel.failedCanceled > 0 ? "danger" : "default"}
							/>
							<MetricCard
								label="Reembolsado"
								value={dashboard.paymentFunnel.refunded}
								note="Pedidos com status ligado a reembolso."
								tone={dashboard.paymentFunnel.refunded > 0 ? "danger" : "default"}
							/>
							<MetricCard
								label="Disputado"
								value={dashboard.paymentFunnel.disputed}
								note="Chargebacks e disputas que pedem atenção."
								tone={dashboard.paymentFunnel.disputed > 0 ? "danger" : "default"}
							/>
						</div>
					</Surface>

					<Surface className="p-6">
						<SectionHeader
							eyebrow="Operação"
							title="Fila de expedição"
							description="Leia onde o pós-pagamento está fluindo e onde a operação ainda está emperrada."
							actionHref="/admin/orders"
							actionLabel="Revisar operação"
						/>
						<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
							<MetricCard label="Recebido" value={dashboard.fulfillmentQueue.received} />
							<MetricCard label="Produção" value={dashboard.fulfillmentQueue.producing} />
							<MetricCard label="Enviado" value={dashboard.fulfillmentQueue.shipped} />
							<MetricCard
								label="Pago sem avanço"
								value={dashboard.fulfillmentQueue.paidWithoutFulfillment}
								note="Pedidos pagos que ainda não seguiram para expedição."
								tone={dashboard.fulfillmentQueue.paidWithoutFulfillment > 0 ? "danger" : "default"}
							/>
							<MetricCard
								label="Enviado sem rastreio"
								value={dashboard.fulfillmentQueue.shippedWithoutTracking}
								note="Pedidos marcados como enviados, mas ainda sem código de rastreio."
								tone={dashboard.fulfillmentQueue.shippedWithoutTracking > 0 ? "danger" : "default"}
							/>
						</div>
					</Surface>
				</section>
			</Reveal>

			<Reveal delay={0.12}>
				<section className="space-y-5">
					<SectionHeader
						eyebrow="Tendência"
						title="Receita paga ao longo do tempo"
						description="Veja a curva de faturamento com mais espaço para leitura."
					/>

					<Surface className="p-4 sm:p-6">
						<div className="mb-6 border border-[var(--sl-line-hairline)] bg-[var(--sl-surface-band)] p-5">
							<div className="text-sm text-[var(--sl-text-muted)]">Prévia do período</div>
							<div className="mt-3">
								<RevenueSparkline
									seriesCents={dashboard.revenueSeriesCents}
									labels={dashboard.revenueSeriesDays}
									currency={dashboard.primaryCurrency}
									locale={locale}
									height={96}
								/>
							</div>
						</div>

						<RevenueZoomBrush
							points={dashboard.revenueZoomBrushPoints}
							currency={dashboard.primaryCurrency}
							locale={locale}
						/>
					</Surface>
				</section>
			</Reveal>

			<Reveal delay={0.16}>
				<section className="space-y-5">
					<SectionHeader
						eyebrow="Confiabilidade"
						title="Saúde da operação"
						description="Problemas técnicos que podem corroer conversão, comunicação ou cadência de expedição sem chamar atenção."
					/>

					<div className="grid gap-5 lg:grid-cols-3">
						<MetricCard
							label="Falhas no recebimento"
							value={dashboard.opsHealth.webhooksFailed}
							note={`${dashboard.opsHealth.webhooksPending} evento(s) ainda pendente(s) no período filtrado.`}
							href="/admin/webhooks"
							action="Ver recebimento"
							tone={
								dashboard.opsHealth.webhooksFailed > 0 || dashboard.opsHealth.webhooksPending > 0
									? "danger"
									: "default"
							}
						/>
						<MetricCard
							label="Falhas de e-mail"
							value={dashboard.opsHealth.emailFailed}
							note={`${dashboard.opsHealth.emailPending} envio(s) ainda pendente(s).`}
							href="/admin/emails"
							action="Inspecionar e-mails"
							tone={
								dashboard.opsHealth.emailFailed > 0 || dashboard.opsHealth.emailPending > 0
									? "danger"
									: "default"
							}
						/>
						<MetricCard
							label="Ações manuais em pedidos"
							value={dashboard.opsHealth.manualTouches}
							note="Mudanças de expedição registradas no período."
						/>
					</div>
				</section>
			</Reveal>

			<Reveal delay={0.2}>
				<section className="grid gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)]">
					<Surface className="p-6">
						<SectionHeader
							eyebrow="Atividade"
							title="Compras recentes"
							description="Pedidos mais recentes do filtro atual."
						/>
						<div className="mt-6 overflow-x-auto">
							<DataTable
								columns={[
									{
										key: "userEmail",
										label: "Cliente",
										render: (p) => <span className="max-w-[240px] break-all">{p.userEmail}</span>,
									},
									{
										key: "amountTotal",
										label: "Valor",
										numeric: true,
										render: (p) => formatMoney(p.amountTotal, p.currency, locale),
									},
									{
										key: "status",
										label: "Status",
										render: (p) => <PurchaseStatusBadge status={p.status} />,
									},
									{
										key: "createdAt",
										label: "Data",
										render: (p) => new Date(p.createdAt).toLocaleString(locale),
									},
									{
										key: "id",
										label: "Pedido",
										render: (p) => <span className="break-all font-mono text-xs">{p.id}</span>,
									},
									{
										key: "action",
										label: "Ação",
										render: (p) => (
											<Link
												className="text-sm font-medium underline underline-offset-4"
												href={`/admin/orders/${p.id}`}
											>
												Ver pedido
											</Link>
										),
									},
								]}
								rows={dashboard.recentPurchases}
								empty="Nenhuma compra encontrada para os filtros selecionados."
							/>
						</div>
					</Surface>

					<Surface className="p-6">
						<SectionHeader
							eyebrow="Clientes"
							title="Clientes recorrentes"
							description="Quem mais comprou dentro do período filtrado."
						/>
						<div className="mt-6 space-y-4">
							{dashboard.topCustomers.map((customer) => (
								<div key={customer.email} className="border border-[var(--sl-line-hairline)] p-5">
									<div className="break-all text-base font-medium leading-7 text-[var(--sl-text)]">
										{customer.email}
									</div>
									<div className="mt-4 grid gap-4 sm:grid-cols-3">
										<div>
											<div className="text-sm text-[var(--sl-text-muted)]">Pedidos</div>
											<div className="mt-1 font-[family-name:var(--sl-font-display)] text-2xl">
												{customer.count}
											</div>
										</div>
										<div>
											<div className="text-sm text-[var(--sl-text-muted)]">Pagos</div>
											<div className="mt-1 font-[family-name:var(--sl-font-display)] text-2xl">
												{customer.paidCount}
											</div>
										</div>
										<div>
											<div className="text-sm text-[var(--sl-text-muted)]">Total gasto</div>
											<div className="mt-1 font-[family-name:var(--sl-font-display)] text-lg">
												{dashboard.hasMultipleCurrencies
													? "Mais de um total"
													: formatMoney(customer.totalSpentCents, dashboard.primaryCurrency, locale)}
											</div>
										</div>
									</div>
								</div>
							))}

							{dashboard.topCustomers.length === 0 ? (
								<div className="border border-dashed border-[var(--sl-line)] py-10 text-center text-[var(--sl-text-muted)]">
									Nenhum cliente encontrado para os filtros selecionados.
								</div>
							) : null}
						</div>
					</Surface>
				</section>
			</Reveal>
		</main>
	);
}
