import { Activity } from "lucide-react";
import type { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/ui/shadcn/table";
import { StatusBadge } from "@/ui/status-badge";

export const dynamic = "force-dynamic";

interface WebhookLogDoc {
	_id: ObjectId;
	eventId?: string | null;
	type?: string | null;
	status?: string | null;
	verified?: boolean | null;
	receivedAt?: Date | string | null;
	processedAt?: Date | string | null;
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

function toDateString(value?: Date | string | null) {
	if (!value) return "-";
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
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

	const resolved = (await searchParams) || {};
	const limit = Math.min(Math.max(Number(asString(resolved.limit) || "50"), 1), 200);
	const skip = Math.max(Number(asString(resolved.skip) || "0"), 0);
	const status = (asString(resolved.status) || "all").toLowerCase();

	const db = await getDb();
	const query = status === "all" ? {} : { status };
	const items = await db
		.collection<WebhookLogDoc>("webhooks")
		.find(query)
		.sort({ receivedAt: -1 })
		.skip(skip)
		.limit(limit)
		.toArray();

	return (
		<main className="mx-auto max-w-full px-4 py-8 sm:px-6 lg:px-8 space-y-6">
			<div className="space-y-2">
				<div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
					<Activity className="h-3.5 w-3.5" />
					Stripe webhook log
				</div>
				<h1 className="text-2xl font-semibold">Webhooks</h1>
				<p className="text-sm text-muted-foreground">
					Every received webhook is logged here, including signature failures and processing errors.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Recently received</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="mb-4 flex flex-wrap gap-2 text-sm">
						<a
							href="/admin/webhooks?status=all"
							className={status === "all" ? "font-medium underline" : "text-muted-foreground underline"}
						>
							All
						</a>
						<a
							href="/admin/webhooks?status=processed"
							className={status === "processed" ? "font-medium underline" : "text-muted-foreground underline"}
						>
							Processed
						</a>
						<a
							href="/admin/webhooks?status=pending"
							className={status === "pending" ? "font-medium underline" : "text-muted-foreground underline"}
						>
							Pending
						</a>
						<a
							href="/admin/webhooks?status=failed"
							className={status === "failed" ? "font-medium underline" : "text-muted-foreground underline"}
						>
							Failed
						</a>
					</div>
					<div className="w-full overflow-x-auto">
						<Table className="min-w-[980px]">
							<TableHeader>
								<TableRow>
									<TableHead>Received at</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Verified</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Event ID</TableHead>
									<TableHead>Error</TableHead>
									<TableHead>Details</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((item) => (
									<TableRow key={String(item._id)}>
										<TableCell>{toDateString(item.receivedAt)}</TableCell>
										<TableCell>
											<StatusBadge status={item.status || "unknown"} />
										</TableCell>
										<TableCell>{item.verified ? "Yes" : "No"}</TableCell>
										<TableCell className="font-mono text-xs">{item.type || "-"}</TableCell>
										<TableCell className="font-mono text-xs break-all">{item.eventId || "-"}</TableCell>
										<TableCell className="max-w-[320px] text-xs text-destructive">
											{item.error ? <span className="break-words">{item.error}</span> : "-"}
										</TableCell>
										<TableCell>
											<details className="max-w-[420px]">
												<summary className="cursor-pointer text-sm underline">Open payload</summary>
												<div className="mt-3 space-y-3">
													<div>
														<p className="mb-1 text-xs font-medium text-muted-foreground">Headers</p>
														<pre className="max-h-56 overflow-auto rounded-md border bg-muted p-3 text-xs">
															{formatJson(item.headers || {})}
														</pre>
													</div>
													<div>
														<p className="mb-1 text-xs font-medium text-muted-foreground">Payload</p>
														<pre className="max-h-80 overflow-auto rounded-md border bg-muted p-3 text-xs">
															{formatJson(item.raw ?? null)}
														</pre>
													</div>
												</div>
											</details>
										</TableCell>
									</TableRow>
								))}
								{items.length === 0 && (
									<TableRow>
										<TableCell colSpan={7} className="py-8 text-muted-foreground">
											No webhooks were found for this filter.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
							<TableCaption>Showing up to {limit} webhooks, ordered from newest to oldest.</TableCaption>
						</Table>
					</div>
				</CardContent>
			</Card>
		</main>
	);
}
