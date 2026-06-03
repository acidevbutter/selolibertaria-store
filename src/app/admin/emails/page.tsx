import { Mail } from "lucide-react";
import type { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmailLogTable } from "@/app/admin/emails/_components/email-log-table.client";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Input } from "@/ui/shadcn/input";

export const dynamic = "force-dynamic";

interface CommunicationLogDoc {
	_id: ObjectId;
	email?: string | null;
	subject?: string | null;
	status?: string | null;
	kind?: string | null;
	source?: string | null;
	userId?: string | null;
	purchaseId?: string | null;
	orderStatus?: string | null;
	template?: string | null;
	messageId?: string | null;
	provider?: string | null;
	attempts?: Array<unknown> | null;
	error?: string | null;
	emailBody?: string | null;
	textBody?: string | null;
	sentAt?: Date | string | null;
	updatedAt?: Date | string | null;
	recipients?: {
		to?: string[];
		cc?: string[];
		bcc?: string[];
	} | null;
}

type SearchParams = {
	kind?: string | string[];
	limit?: string | string[];
	q?: string | string[];
	skip?: string | string[];
	status?: string | string[];
};

function asString(value: string | string[] | undefined) {
	return typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
}

function toDateString(value?: Date | string | null) {
	if (!value) return "-";
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return new Intl.DateTimeFormat("en-US", {
		dateStyle: "short",
		timeStyle: "medium",
	}).format(date);
}

function escapeRegex(value: string) {
	return value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildQuery({ status, kind, q }: { status?: string; kind?: string; q?: string }) {
	const filters: Array<Record<string, unknown>> = [];

	if (status && status !== "all") filters.push({ status });

	if (kind && kind !== "all") {
		if (kind === "unknown") {
			filters.push({
				$or: [{ kind: { $exists: false } }, { kind: null }, { kind: "" }],
			});
		} else {
			filters.push({ kind });
		}
	}

	if (q) {
		const regex = new RegExp(escapeRegex(q), "i");
		filters.push({
			$or: [
				{ email: regex },
				{ subject: regex },
				{ messageId: regex },
				{ purchaseId: regex },
				{ userId: regex },
				{ orderStatus: regex },
				{ source: regex },
				{ template: regex },
			],
		});
	}

	if (filters.length === 0) return {};
	if (filters.length === 1) return filters[0] ?? {};
	return { $and: filters };
}

function formatKindLabel(kind?: string | null) {
	switch ((kind || "").toLowerCase()) {
		case "email_confirmation":
			return "Email confirmation";
		case "order_status":
			return "Order status";
		case "password_reset":
			return "Password reset";
		case "test":
			return "Test";
		case "transactional":
			return "Transactional";
		default:
			return "Legacy/undefined";
	}
}

function summarizeBody(value?: string | null) {
	if (!value) return "-";
	const preview = value
		.replaceAll(/<style[\s\S]*?<\/style>/gi, " ")
		.replaceAll(/<script[\s\S]*?<\/script>/gi, " ")
		.replaceAll(/<[^>]+>/g, " ")
		.replaceAll(/&nbsp;/gi, " ")
		.replaceAll(/\s+/g, " ")
		.trim();
	if (!preview) return "-";
	return preview.length > 180 ? `${preview.slice(0, 177)}...` : preview;
}

function buildPageHref({
	status,
	kind,
	q,
	limit,
	skip,
}: {
	status: string;
	kind: string;
	q: string;
	limit: number;
	skip: number;
}) {
	const params = new URLSearchParams();
	if (status !== "all") params.set("status", status);
	if (kind !== "all") params.set("kind", kind);
	if (q) params.set("q", q);
	if (limit !== 50) params.set("limit", String(limit));
	if (skip > 0) params.set("skip", String(skip));
	const query = params.toString();
	return query ? `/admin/emails?${query}` : "/admin/emails";
}

export default async function AdminEmailsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
	const session = await auth();
	if (!session) redirect("/login");
	if (session.user.role !== "admin") redirect("/forbidden");

	const resolved = (await searchParams) || {};
	const status = (asString(resolved.status) || "all").toLowerCase();
	const kind = (asString(resolved.kind) || "all").toLowerCase();
	const q = (asString(resolved.q) || "").trim();
	const limit = Math.min(Math.max(Number(asString(resolved.limit) || "50"), 1), 200);
	const skip = Math.max(Number(asString(resolved.skip) || "0"), 0);

	const db = await getDb();
	const summaryQuery = buildQuery({ kind, q });
	const listQuery = buildQuery({ status, kind, q });

	const communication = db.collection<CommunicationLogDoc>("communication");
	const [items, totalMatching, sentCount, failedCount, pendingCount] = await Promise.all([
		communication.find(listQuery).sort({ sentAt: -1 }).skip(skip).limit(limit).toArray(),
		communication.countDocuments(summaryQuery),
		communication.countDocuments(buildQuery({ status: "sent", kind, q })),
		communication.countDocuments(buildQuery({ status: "failed", kind, q })),
		communication.countDocuments(buildQuery({ status: "pending", kind, q })),
	]);

	const previousHref =
		skip > 0 ? buildPageHref({ status, kind, q, limit, skip: Math.max(skip - limit, 0) }) : null;
	const nextHref =
		skip + items.length < totalMatching
			? buildPageHref({ status, kind, q, limit, skip: skip + limit })
			: null;
	const tableItems = items.map((item) => ({
		id: String(item._id),
		sentAtLabel: toDateString(item.sentAt),
		status: item.status || "unknown",
		kindLabel: formatKindLabel(item.kind),
		email: item.email || "-",
		subject: item.subject || "No subject",
		previewBody: summarizeBody(item.emailBody),
		purchaseId: item.purchaseId || null,
		userId: item.userId || null,
		orderStatus: item.orderStatus || null,
		source: item.source || null,
		error: item.error || null,
		template: item.template || null,
		messageId: item.messageId || null,
		provider: item.provider || null,
		attempts: item.attempts || null,
		recipients: item.recipients || null,
		emailBody: item.emailBody || null,
		textBody: item.textBody || null,
	}));

	return (
		<main className="mx-auto max-w-full px-4 py-8 sm:px-6 lg:px-8 space-y-6">
			<div className="space-y-2">
				<div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
					<Mail className="h-3.5 w-3.5" />
					Email history
				</div>
				<h1 className="text-2xl font-semibold">Emails</h1>
				<p className="text-sm text-muted-foreground">
					All transactional sends are logged here with status, subject, recipient, and order context when
					available.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-muted-foreground">Records</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-semibold">{totalMatching}</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-muted-foreground">Sent</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-semibold">{sentCount}</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-muted-foreground">Failed</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-semibold">{failedCount}</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-semibold">{pendingCount}</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Filters</CardTitle>
				</CardHeader>
				<CardContent>
					<form method="get" className="flex flex-col gap-3 lg:flex-row lg:items-end">
						<div className="flex-1 min-w-[220px]">
							<label htmlFor="email-search" className="mb-2 block text-sm text-muted-foreground">
								Search by email, order, message, or source
							</label>
							<Input
								id="email-search"
								name="q"
								defaultValue={q}
								placeholder="customer@example.com, pi_..., order, template..."
							/>
						</div>
						<div className="min-w-[180px]">
							<label htmlFor="status" className="mb-2 block text-sm text-muted-foreground">
								Status
							</label>
							<select
								id="status"
								name="status"
								defaultValue={status}
								className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
							>
								<option value="all">All</option>
								<option value="sent">Sent</option>
								<option value="failed">Failed</option>
								<option value="pending">Pending</option>
							</select>
						</div>
						<div className="min-w-[220px]">
							<label htmlFor="kind" className="mb-2 block text-sm text-muted-foreground">
								Type
							</label>
							<select
								id="kind"
								name="kind"
								defaultValue={kind}
								className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
							>
								<option value="all">All</option>
								<option value="order_status">Order status</option>
								<option value="email_confirmation">Email confirmation</option>
								<option value="password_reset">Password reset</option>
								<option value="transactional">Transactional</option>
								<option value="test">Test</option>
								<option value="unknown">Legacy/undefined</option>
							</select>
						</div>
						<input type="hidden" name="limit" value={String(limit)} />
						<Button type="submit">Apply</Button>
						<Button asChild variant="outline">
							<Link href="/admin/emails">Clear</Link>
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Recent sends</CardTitle>
				</CardHeader>
				<CardContent>
					<EmailLogTable items={tableItems} limit={limit} />

					<div className="mt-4 flex items-center justify-between gap-3">
						<p className="text-sm text-muted-foreground">
							Showing {items.length} of {totalMatching} records.
						</p>
						<div className="flex items-center gap-2">
							{previousHref ? (
								<Button asChild variant="outline">
									<Link href={previousHref}>Previous</Link>
								</Button>
							) : null}
							{nextHref ? (
								<Button asChild variant="outline">
									<Link href={nextHref}>Next</Link>
								</Button>
							) : null}
						</div>
					</div>
				</CardContent>
			</Card>
		</main>
	);
}
