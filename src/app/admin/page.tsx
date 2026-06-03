import { AlertTriangle, ArrowRight, CreditCard, Package2, ShieldAlert, Wallet } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminDashboardData } from "@/lib/admin-dashboard";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { RevenueSparkline } from "@/ui/charts/revenue-sparkline.client";
import { RevenueZoomBrush } from "@/ui/charts/revenue-zoom-brush.client";
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
		return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100);
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
					<div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
						{eyebrow}
					</div>
				) : null}
				<h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
				{description ? (
					<p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
				) : null}
			</div>
			{actionHref && actionLabel ? (
				<Link
					href={actionHref}
					className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-4"
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

	return (
		<main className="mx-auto w-full max-w-[1440px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
			<section className="rounded-[28px] border bg-card p-6 shadow-sm sm:p-8">
				<div className="grid gap-8 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)]">
					<div className="space-y-5">
						<div className="space-y-3">
							<div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
								Admin dashboard
							</div>
							<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
								Store performance, order pressure, and operational risk in one view.
							</h1>
							<p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
								Use this overview to understand what the store earned, what is blocked in payment, what still
								needs fulfillment, and which technical failures may be affecting orders.
							</p>
						</div>

						<div className="rounded-2xl border bg-background/70 p-4">
							<AdminFilters defaultStatus={status} defaultPeriod={period} defaultSort={sort} />
						</div>

						{dashboard.hasMultipleCurrencies ? (
							<div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
								Totals are shown per currency so the dashboard does not mix nominal amounts.
							</div>
						) : null}
					</div>

					<Card className="overflow-hidden border-none bg-foreground text-background">
						<CardContent className="p-6 sm:p-7">
							<div className="space-y-6">
								<div className="space-y-2">
									<div className="text-xs font-medium uppercase tracking-[0.18em] text-background/60">
										Immediate attention
									</div>
									<div className="text-5xl font-semibold tracking-tight">{urgentOrders}</div>
									<p className="text-sm leading-6 text-background/70">
										Orders currently needing payment follow-up, review, dispute handling, or fulfillment
										kickoff.
									</p>
								</div>

								<div className="grid gap-3">
									<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
										<div className="text-sm text-background/70">Needs payment action</div>
										<div className="mt-2 text-2xl font-semibold">
											{dashboard.paymentFunnel.awaitingAction}
										</div>
									</div>
									<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
										<div className="text-sm text-background/70">Paid, not in fulfillment</div>
										<div className="mt-2 text-2xl font-semibold">
											{dashboard.fulfillmentQueue.paidWithoutFulfillment}
										</div>
									</div>
									<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
										<div className="text-sm text-background/70">Dispute-related orders</div>
										<div className="mt-2 text-2xl font-semibold">{dashboard.recentDisputesCount}</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>

			<section className="space-y-5">
				<SectionHeader
					eyebrow="Executive summary"
					title="Core business signals"
					description="Large, high-contrast cards for the numbers that matter most day to day."
				/>

				<div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
					<StatCard
						icon={<Wallet className="h-5 w-5" />}
						label="Paid revenue"
						value={formatMoneyList(dashboard.revenueByCurrency)}
						helper="Confirmed paid revenue in the selected period."
					/>
					<StatCard
						icon={<CreditCard className="h-5 w-5" />}
						label="Average order value"
						value={formatMoneyList(dashboard.averageOrderValueByCurrency)}
						helper="Average paid order value, segmented by currency when necessary."
					/>
					<StatCard
						icon={<Package2 className="h-5 w-5" />}
						label="Order volume"
						value={<div className="text-5xl font-semibold tracking-tight">{dashboard.filteredPurchases}</div>}
						helper={
							<span>
								{dashboard.buyersCount} buyers, {dashboard.couponOrdersCount} coupon orders, {couponRate}{" "}
								coupon adoption.
							</span>
						}
					/>
					<StatCard
						icon={<ShieldAlert className="h-5 w-5" />}
						label="Net revenue"
						value={formatMoneyList(dashboard.netRevenueByCurrency)}
						helper="Paid revenue minus refunded volume already captured in orders."
					/>
				</div>

				<div className="grid gap-5 lg:grid-cols-3">
					<StatCard
						icon={<ArrowRight className="h-5 w-5" />}
						label="Discount given"
						value={formatMoneyList(dashboard.discountByCurrency)}
						helper="Total discount pressure applied to filtered orders."
						tone="warning"
					/>
					<StatCard
						icon={<AlertTriangle className="h-5 w-5" />}
						label="Refunded amount"
						value={formatMoneyList(dashboard.refundedByCurrency)}
						helper={`${dashboard.recentRefundsCount} refunded orders in the selected period.`}
						tone="danger"
					/>
					<StatCard
						icon={<Package2 className="h-5 w-5" />}
						label="Store reach"
						value={<div className="text-5xl font-semibold tracking-tight">{dashboard.usersCount}</div>}
						helper={`${dashboard.buyersCount} customers converted in the current filtered dataset.`}
					/>
				</div>
			</section>

			<section className="grid gap-6 2xl:grid-cols-2">
				<Card>
					<CardHeader className="pb-4">
						<SectionHeader
							eyebrow="Orders"
							title="Payment funnel"
							description="What is paid, what is blocked, and where the payment flow is leaking."
							actionHref="/admin/orders"
							actionLabel="Open orders"
						/>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						<QueueMetric
							label="Awaiting action"
							value={dashboard.paymentFunnel.awaitingAction}
							help="Requires confirmation or a different payment method."
							emphasis={dashboard.paymentFunnel.awaitingAction > 0 ? "warning" : "normal"}
						/>
						<QueueMetric
							label="Processing"
							value={dashboard.paymentFunnel.processing}
							help="Payments still under review or asynchronous confirmation."
							emphasis={dashboard.paymentFunnel.processing > 0 ? "warning" : "normal"}
						/>
						<QueueMetric label="Paid" value={dashboard.paymentFunnel.paid} help="Confirmed revenue." />
						<QueueMetric
							label="Failed / canceled"
							value={dashboard.paymentFunnel.failedCanceled}
							help="Orders that did not convert into paid revenue."
							emphasis={dashboard.paymentFunnel.failedCanceled > 0 ? "danger" : "normal"}
						/>
						<QueueMetric
							label="Refunded"
							value={dashboard.paymentFunnel.refunded}
							help="Orders currently carrying refund-related payment status."
							emphasis={dashboard.paymentFunnel.refunded > 0 ? "danger" : "normal"}
						/>
						<QueueMetric
							label="Disputed"
							value={dashboard.paymentFunnel.disputed}
							help="Chargeback or dispute-related states that need close attention."
							emphasis={dashboard.paymentFunnel.disputed > 0 ? "danger" : "normal"}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-4">
						<SectionHeader
							eyebrow="Operations"
							title="Fulfillment queue"
							description="See where the operational flow is healthy and where orders are stalling after payment."
							actionHref="/admin/orders"
							actionLabel="Review fulfillment"
						/>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						<QueueMetric label="Received" value={dashboard.fulfillmentQueue.received} />
						<QueueMetric label="Producing" value={dashboard.fulfillmentQueue.producing} />
						<QueueMetric label="Shipped" value={dashboard.fulfillmentQueue.shipped} />
						<QueueMetric
							label="Paid, no fulfillment"
							value={dashboard.fulfillmentQueue.paidWithoutFulfillment}
							help="Paid orders not yet moved into the fulfillment workflow."
							emphasis={dashboard.fulfillmentQueue.paidWithoutFulfillment > 0 ? "danger" : "normal"}
						/>
						<QueueMetric
							label="Shipped, no tracking"
							value={dashboard.fulfillmentQueue.shippedWithoutTracking}
							help="Orders marked shipped but still missing tracking data."
							emphasis={dashboard.fulfillmentQueue.shippedWithoutTracking > 0 ? "warning" : "normal"}
						/>
					</CardContent>
				</Card>
			</section>

			<section className="space-y-5">
				<SectionHeader
					eyebrow="Trend"
					title="Paid revenue over time"
					description="Expanded chart area so the revenue curve is readable instead of compressed."
				/>

				<Card>
					<CardContent className="p-4 sm:p-6">
						<div className="mb-6 rounded-2xl border bg-muted/15 p-5">
							<div className="text-sm text-muted-foreground">Revenue preview</div>
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

			<section className="space-y-5">
				<SectionHeader
					eyebrow="Reliability"
					title="Operational health"
					description="Technical issues that can silently damage conversion, post-purchase communication, or fulfillment cadence."
				/>

				<div className="grid gap-5 lg:grid-cols-3">
					<HealthRow
						label="Webhook failures"
						value={dashboard.opsHealth.webhooksFailed}
						supplement={`${dashboard.opsHealth.webhooksPending} webhook events still pending in the selected period.`}
						href="/admin/webhooks"
						linkLabel="Inspect webhooks"
						tone={
							dashboard.opsHealth.webhooksFailed > 0
								? "danger"
								: dashboard.opsHealth.webhooksPending > 0
									? "warning"
									: "default"
						}
					/>
					<HealthRow
						label="Email failures"
						value={dashboard.opsHealth.emailFailed}
						supplement={`${dashboard.opsHealth.emailPending} transactional sends still pending.`}
						href="/admin/emails"
						linkLabel="Inspect emails"
						tone={
							dashboard.opsHealth.emailFailed > 0
								? "danger"
								: dashboard.opsHealth.emailPending > 0
									? "warning"
									: "default"
						}
					/>
					<HealthRow
						label="Manual order touches"
						value={dashboard.opsHealth.manualTouches}
						supplement="Fulfillment edits logged in the selected period."
						tone="default"
					/>
				</div>
			</section>

			<section className="grid gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)]">
				<Card>
					<CardHeader className="pb-4">
						<SectionHeader
							eyebrow="Activity"
							title="Recent purchases"
							description="The latest orders in the filtered dataset, with enough spacing to scan quickly."
						/>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<Table className="min-w-[860px]">
								<TableHeader>
									<TableRow>
										<TableHead className="w-[24%]">Customer</TableHead>
										<TableHead className="w-[14%]">Amount</TableHead>
										<TableHead className="w-[14%]">Status</TableHead>
										<TableHead className="w-[18%]">Date</TableHead>
										<TableHead className="w-[22%]">Order ID</TableHead>
										<TableHead className="w-[8%] text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{dashboard.recentPurchases.map((purchase) => (
										<TableRow key={purchase.id}>
											<TableCell className="py-4 align-top">
												<div className="max-w-[240px] break-all text-sm leading-6">{purchase.userEmail}</div>
											</TableCell>
											<TableCell className="py-4 align-top text-sm font-medium">
												{formatMoney(purchase.amountTotal, purchase.currency)}
											</TableCell>
											<TableCell className="py-4 align-top">
												<StatusBadge status={purchase.status} />
											</TableCell>
											<TableCell className="py-4 align-top text-sm text-muted-foreground">
												{new Date(purchase.createdAt).toLocaleString()}
											</TableCell>
											<TableCell className="py-4 align-top font-mono text-xs leading-6 break-all text-muted-foreground">
												{purchase.id}
											</TableCell>
											<TableCell className="py-4 text-right align-top">
												<Link
													className="text-sm font-medium underline underline-offset-4"
													href={`/admin/orders/${purchase.id}`}
												>
													Open
												</Link>
											</TableCell>
										</TableRow>
									))}
									{dashboard.recentPurchases.length === 0 ? (
										<TableRow>
											<TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
												No purchases found for the selected filters.
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
							eyebrow="Customers"
							title="Top customers"
							description="Largest buyers in the current filtered period."
						/>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{dashboard.topCustomers.map((customer) => (
								<div key={customer.email} className="rounded-2xl border p-5">
									<div className="break-all text-base font-medium leading-7">{customer.email}</div>
									<div className="mt-4 grid gap-4 sm:grid-cols-3">
										<div>
											<div className="text-sm text-muted-foreground">Orders</div>
											<div className="mt-1 text-2xl font-semibold">{customer.count}</div>
										</div>
										<div>
											<div className="text-sm text-muted-foreground">Paid</div>
											<div className="mt-1 text-2xl font-semibold">{customer.paidCount}</div>
										</div>
										<div>
											<div className="text-sm text-muted-foreground">Spent</div>
											<div className="mt-1 text-lg font-semibold leading-7">
												{dashboard.hasMultipleCurrencies
													? "Multi-currency"
													: formatMoney(customer.totalSpentCents, dashboard.primaryCurrency)}
											</div>
										</div>
									</div>
								</div>
							))}

							{dashboard.topCustomers.length === 0 ? (
								<div className="rounded-2xl border border-dashed py-10 text-center text-muted-foreground">
									No customers found for the selected filters.
								</div>
							) : null}
						</div>
					</CardContent>
				</Card>
			</section>
		</main>
	);
}
