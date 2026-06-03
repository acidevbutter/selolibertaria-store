import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { getDb } from "@/lib/mongodb";
import { listOrderAuditEntries, type OrderAuditEntry } from "@/lib/order-audit";
import { matchesOrderIdentifier } from "@/lib/order-identity";
import { Badge } from "@/ui/shadcn/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { StatusBadge } from "@/ui/status-badge";
import UpdateFulfillment from "../_components/update-fulfillment.client";

function formatAuditValue(value: string | null | undefined) {
	if (!value) return "Not set";
	return value;
}

function getAuditSummary(entry: OrderAuditEntry) {
	switch (entry.action) {
		case "order_fulfillment_updated":
			return "Fulfillment updated";
		case "order_payment_status_webhook_updated":
			return "Payment status updated by webhook";
	}
}

function getAuditChanges(entry: OrderAuditEntry) {
	const details = (entry.details ?? {}) as {
		previousStatus?: string | null;
		nextStatus?: string | null;
		previousTrackingNumber?: string | null;
		nextTrackingNumber?: string | null;
		webhookType?: string | null;
		webhookEventId?: string | null;
	};
	const changes: Array<{ label: string; previous: string; next: string }> = [];

	if (entry.action === "order_fulfillment_updated" && details.previousStatus !== details.nextStatus) {
		changes.push({
			label: "Fulfillment status",
			previous: formatAuditValue(details.previousStatus),
			next: formatAuditValue(details.nextStatus),
		});
	}

	if (entry.action === "order_payment_status_webhook_updated" && details.previousStatus !== details.nextStatus) {
		changes.push({
			label: "Payment status",
			previous: formatAuditValue(details.previousStatus),
			next: formatAuditValue(details.nextStatus),
		});
	}

	if (entry.action === "order_fulfillment_updated" && details.previousTrackingNumber !== details.nextTrackingNumber) {
		changes.push({
			label: "Tracking number",
			previous: formatAuditValue(details.previousTrackingNumber),
			next: formatAuditValue(details.nextTrackingNumber),
		});
	}

	return changes;
}

export default async function AdminOrderDetails({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "orders.read")) redirect("/forbidden");

	const purchaseId = id;
	if (!purchaseId) redirect("/admin/orders");

	const db = await getDb();
	const pipeline = [
		{ $match: { purchases: { $exists: true, $ne: [] } } },
		{ $project: { email: 1, purchases: 1 } },
		{ $unwind: "$purchases" },
		{
			$match: {
				$or: [
					{ "purchases.id": purchaseId },
					{ "purchases.relatedIds.paymentIntentId": purchaseId },
					{ "purchases.relatedIds.sessionId": purchaseId },
				],
			},
		},
		{ $limit: 1 },
	];
	const docs = await db.collection("users").aggregate(pipeline).toArray();
	const doc = docs[0];
	if (!doc) redirect("/admin/orders");

	const p = doc.purchases as {
		id: string;
		amountTotal: number;
		currency: string;
		status: string;
		createdAt: string | Date;
		items?: Array<{ name?: string | null; quantity: number; unitAmount?: number | null }>;
		fulfillment?: { status?: "received" | "producing" | "shipped"; trackingNumber?: string | null };
		relatedIds?: { paymentIntentId?: string; sessionId?: string };
	};
	if (!matchesOrderIdentifier(p, purchaseId)) redirect("/admin/orders");
	const history = await listOrderAuditEntries(p.id, 15);

	return (
		<main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">Order details</h1>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Summary</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<div>
						<span className="text-muted-foreground">ID:</span>{" "}
						<span className="font-mono text-sm break-all">{p.id}</span>
					</div>
					<div>
						<span className="text-muted-foreground">User:</span>{" "}
						<span className="break-all">{doc.email}</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground">Status:</span>
						<StatusBadge status={p.status} />
					</div>
					<div>
						<span className="text-muted-foreground">Amount:</span>{" "}
						{new Intl.NumberFormat("en-US", {
							style: "currency",
							currency: p.currency?.toUpperCase?.() || "USD",
						}).format((p.amountTotal || 0) / 100)}
					</div>
					<div>
						<span className="text-muted-foreground">Date:</span> {new Date(p.createdAt).toLocaleString()}
					</div>
					<div className="pt-2">
						<UpdateFulfillment
							id={p.id}
							current={p.fulfillment}
							statuses={["received", "producing", "shipped"]}
						/>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Items</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="divide-y">
						{(p.items || []).map((it, idx) => (
							<li key={idx} className="py-2 flex items-center justify-between gap-3">
								<div className="min-w-0">
									<div className="font-medium break-words">{it.name || "—"}</div>
									<div className="text-sm text-muted-foreground">Qty: {it.quantity}</div>
								</div>
								<div className="text-sm">
									{typeof it.unitAmount === "number"
										? new Intl.NumberFormat("en-US", {
												style: "currency",
												currency: p.currency?.toUpperCase?.() || "USD",
											}).format(it.unitAmount / 100)
										: "—"}
								</div>
							</li>
						))}
						{(p.items || []).length === 0 && <li className="py-6 text-muted-foreground">No items.</li>}
					</ul>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<div className="space-y-1">
						<CardTitle>Edit history</CardTitle>
						<p className="text-sm text-muted-foreground">
							Every manual fulfillment update is recorded here with who changed it and what changed.
						</p>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<ul className="space-y-3">
						{history.map((entry) => (
							<li key={String(entry._id)} className="rounded-lg border p-4">
								<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
									<div className="space-y-2">
										<div className="flex flex-wrap items-center gap-2">
											<div className="font-medium">{getAuditSummary(entry)}</div>
											<Badge variant="outline">{entry.actorRole}</Badge>
										</div>
										<div className="text-sm text-muted-foreground">
											{entry.actorRole === "system" ? "Webhook automation" : entry.actorEmail || entry.actorId}
										</div>
										{entry.action === "order_payment_status_webhook_updated" ? (
											<div className="text-xs text-muted-foreground">
												{((entry.details ?? {}) as { webhookType?: string | null }).webhookType || "Webhook"}
											</div>
										) : null}
									</div>
									<div className="text-xs text-muted-foreground">
										{new Date(entry.createdAt).toLocaleString()}
									</div>
								</div>
								<div className="mt-4 grid gap-3">
									{getAuditChanges(entry).map((change) => (
										<div key={change.label} className="rounded-md bg-muted/30 p-3">
											<div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
												{change.label}
											</div>
											<div className="mt-2 grid gap-2 sm:grid-cols-2">
												<div className="rounded-md border bg-background px-3 py-2">
													<div className="text-xs text-muted-foreground">Before</div>
													<div className="text-sm">{change.previous}</div>
												</div>
												<div className="rounded-md border bg-background px-3 py-2">
													<div className="text-xs text-muted-foreground">After</div>
													<div className="text-sm">{change.next}</div>
												</div>
											</div>
										</div>
									))}
								</div>
							</li>
						))}
						{history.length === 0 ? (
							<li className="rounded-lg border border-dashed py-8 text-center text-muted-foreground">
								No status changes recorded yet.
							</li>
						) : null}
					</ul>
				</CardContent>
			</Card>
		</main>
	);
}
