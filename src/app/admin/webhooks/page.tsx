import { Activity } from "lucide-react";
import type { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/shadcn/table";
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
	return Number.isNaN(date.getTime())
		? "-"
		: new Intl.DateTimeFormat("pt-BR", {
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

	const processedCount = items.filter((item) => item.status === "processed").length;
	const failedCount = items.filter((item) => item.status === "failed").length;
	const unverifiedCount = items.filter((item) => item.verified === false).length;

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Webhooks"
				title="Webhooks"
				description="Acompanhe eventos, falhas e verificações."
				actions={
					<div className="flex flex-wrap gap-2">
						{[
							{ href: "/admin/webhooks?status=all", label: "Todos", active: status === "all" },
							{
								href: "/admin/webhooks?status=processed",
								label: "Processados",
								active: status === "processed",
							},
							{ href: "/admin/webhooks?status=pending", label: "Pendentes", active: status === "pending" },
							{ href: "/admin/webhooks?status=failed", label: "Falhos", active: status === "failed" },
						].map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={
									item.active
										? "inline-flex h-10 items-center rounded-none bg-[color:var(--editorial-ink)] px-4 text-sm font-medium text-[color:var(--editorial-paper)]"
										: "inline-flex h-10 items-center rounded-none border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 text-sm font-medium text-[color:var(--editorial-ink)] transition-colors hover:bg-white"
								}
							>
								{item.label}
							</Link>
						))}
					</div>
				}
			/>
			<div className="grid gap-5 lg:grid-cols-4">
				<AdminEditorialStat label="Registros" value={items.length} helper={`Até ${limit} itens.`} />
				<AdminEditorialStat label="Processados" value={processedCount} helper="Sem erro." />
				<AdminEditorialStat label="Falhos" value={failedCount} helper="Com erro." />
				<AdminEditorialStat label="Não verificados" value={unverifiedCount} helper="Exigem revisão." />
			</div>
			<EditorialPanel className="p-0">
				<div className="border-b border-[color:var(--editorial-border)] px-6 py-5 sm:px-8">
					<div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
						<Activity className="h-4 w-4" />
						Eventos recebidos
					</div>
				</div>
				<div className="p-6 sm:p-8">
					<div className="w-full overflow-x-auto">
						<Table className="min-w-[980px]">
							<TableHeader>
								<TableRow>
									<TableHead>Recebido em</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Verificação</TableHead>
									<TableHead>Tipo</TableHead>
									<TableHead>Event ID</TableHead>
									<TableHead>Erro</TableHead>
									<TableHead>Detalhes</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((item) => (
									<TableRow key={String(item._id)}>
										<TableCell>{toDateString(item.receivedAt)}</TableCell>
										<TableCell>
											<StatusBadge status={item.status || "unknown"} />
										</TableCell>
										<TableCell>{item.verified ? "Verificado" : "Não verificado"}</TableCell>
										<TableCell className="font-mono text-xs">{item.type || "-"}</TableCell>
										<TableCell className="font-mono text-xs break-all">{item.eventId || "-"}</TableCell>
										<TableCell className="max-w-[320px] text-xs text-destructive">
											{item.error ? <span className="break-words">{item.error}</span> : "-"}
										</TableCell>
										<TableCell>
											<details className="max-w-[420px]">
												<summary className="cursor-pointer text-sm underline underline-offset-4">
													Abrir payload
												</summary>
												<div className="mt-3 space-y-3">
													<div>
														<p className="mb-1 text-xs font-medium text-muted-foreground">Headers</p>
														<pre className="max-h-56 overflow-auto rounded-none border bg-muted p-3 text-xs">
															{formatJson(item.headers || {})}
														</pre>
													</div>
													<div>
														<p className="mb-1 text-xs font-medium text-muted-foreground">Payload</p>
														<pre className="max-h-80 overflow-auto rounded-none border bg-muted p-3 text-xs">
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
										<TableCell colSpan={7} className="py-8 text-[color:var(--editorial-muted)]">
											Nenhum webhook encontrado para este filtro.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</div>
			</EditorialPanel>
		</AdminEditorialPage>
	);
}
