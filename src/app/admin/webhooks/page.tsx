import { Activity } from "lucide-react";
import type { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";
import { env } from "@/env.mjs";
import { resolveLocale } from "@/i18n/config";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { getDefaultLocaleSetting } from "@/lib/settings-store";
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
	const locale = (await getDefaultLocaleSetting()) ?? resolveLocale(env.NEXT_PUBLIC_LANGUAGE);

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
				eyebrow="Recebimento"
				title="Recebimento de webhooks"
				description="Acompanhe eventos recebidos, falhas e validação de assinatura."
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
							{ href: "/admin/webhooks?status=failed", label: "Com falha", active: status === "failed" },
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
				<AdminEditorialStat
					label="Registros"
					value={items.length}
					helper={`Últimos ${limit} eventos carregados.`}
				/>
				<AdminEditorialStat label="Processados" value={processedCount} helper="Recebidos sem falha." />
				<AdminEditorialStat label="Com falha" value={failedCount} helper="Precisam de revisão." />
				<AdminEditorialStat
					label="Não verificados"
					value={unverifiedCount}
					helper="Assinatura sem validação."
				/>
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
									<TableHead>ID do evento</TableHead>
									<TableHead>Erro</TableHead>
									<TableHead>Detalhes</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((item) => (
									<TableRow key={String(item._id)}>
										<TableCell>{toDateString(item.receivedAt, locale)}</TableCell>
										<TableCell>
											<StatusBadge status={item.status || "unknown"} />
										</TableCell>
										<TableCell>
											{item.verified ? "Assinatura validada" : "Assinatura sem validação"}
										</TableCell>
										<TableCell className="font-mono text-xs">{item.type || "-"}</TableCell>
										<TableCell className="font-mono text-xs break-all">{item.eventId || "-"}</TableCell>
										<TableCell className="max-w-[320px] text-xs text-destructive">
											{item.error ? <span className="break-words">{item.error}</span> : "-"}
										</TableCell>
										<TableCell>
											<details className="max-w-[420px]">
												<summary className="cursor-pointer text-sm underline underline-offset-4">
													Ver detalhes
												</summary>
												<div className="mt-3 space-y-3">
													<div>
														<p className="mb-1 text-xs font-medium text-muted-foreground">
															Cabeçalhos da requisição
														</p>
														<pre className="max-h-56 overflow-auto rounded-none border bg-muted p-3 text-xs">
															{formatJson(item.headers || {})}
														</pre>
													</div>
													<div>
														<p className="mb-1 text-xs font-medium text-muted-foreground">
															Conteúdo recebido
														</p>
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
											Nenhum registro encontrado para este filtro.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
					{items.length === 0 ? (
						<div className="mt-4 flex flex-col gap-4 border border-[color:var(--editorial-border)] bg-[#fbf7f1] p-5 sm:flex-row sm:items-center sm:justify-between">
							<div className="space-y-1">
								<p className="text-sm font-semibold text-[color:var(--editorial-ink)]">
									Ainda não há registros de recebimento neste filtro.
								</p>
								<p className="text-sm leading-6 text-[color:var(--editorial-muted)]">
									Valide uma compra recente ou revise os pedidos para confirmar se os eventos estão chegando
									como esperado.
								</p>
							</div>
							<div className="flex flex-wrap gap-2">
								<Link
									href="/admin/orders"
									className="inline-flex h-10 items-center justify-center rounded-none border border-[color:var(--editorial-border)] bg-white px-4 text-sm font-medium text-[color:var(--editorial-ink)] transition-colors hover:bg-[#f4eee5]"
								>
									Ver pedidos
								</Link>
								<Link
									href="/admin/emails"
									className="inline-flex h-10 items-center justify-center rounded-none bg-[color:var(--editorial-ink)] px-4 text-sm font-medium text-[color:var(--editorial-paper)] transition-colors hover:bg-[color:var(--editorial-accent)]"
								>
									Ver e-mails
								</Link>
							</div>
						</div>
					) : null}
				</div>
			</EditorialPanel>
		</AdminEditorialPage>
	);
}
