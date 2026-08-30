import { Mail } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmailLogTable } from "@/app/admin/emails/_components/email-log-table.client";
import { env } from "@/env.mjs";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { auth } from "@/lib/auth";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";

export const dynamic = "force-dynamic";

type SearchParams = {
	kind?: string | string[];
	limit?: string | string[];
	q?: string | string[];
	skip?: string | string[];
	status?: string | string[];
};

type CommunicationPageResponse = {
	items: Array<{
		id: string;
		recipient: string;
		subject: string | null;
		text_body: string | null;
		html_body: string | null;
		template_key: string;
		kind: string;
		source: string | null;
		user_id: string | null;
		order_id: string | null;
		status: string;
		provider: string;
		provider_message_id: string | null;
		error: string | null;
		attempts: Array<unknown> | null;
		created_at: string;
		sent_at: string | null;
	}>;
	total: number;
	sent_count: number;
	failed_count: number;
	pending_count: number;
};

function asString(value: string | string[] | undefined) {
	return typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
}

function toDateString(value: Date | string | null | undefined, locale: string) {
	if (!value) return "-";
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return new Intl.DateTimeFormat(locale, {
		dateStyle: "short",
		timeStyle: "medium",
	}).format(date);
}

function formatKindLabel(kind?: string | null) {
	switch ((kind || "").toLowerCase()) {
		case "email_confirmation":
			return "Confirmação de e-mail";
		case "order_status":
			return "Status de pedido";
		case "password_reset":
			return "Redefinição de senha";
		case "test":
			return "Teste";
		case "transactional":
			return "Transacional";
		default:
			return "Sem tipo informado";
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
	const locale = DEFAULT_LOCALE;

	const resolved = (await searchParams) || {};
	const status = (asString(resolved.status) || "all").toLowerCase();
	const kind = (asString(resolved.kind) || "all").toLowerCase();
	const q = (asString(resolved.q) || "").trim();
	const limit = Math.min(Math.max(Number(asString(resolved.limit) || "50"), 1), 200);
	const skip = Math.max(Number(asString(resolved.skip) || "0"), 0);

	const page = Math.floor(skip / limit) + 1;
	const queryParams = new URLSearchParams({ page: String(page), page_size: String(limit) });
	if (status !== "all") queryParams.set("status", status);
	if (kind !== "all" && kind !== "unknown") queryParams.set("kind", kind);
	if (q) queryParams.set("q", q);
	const response = await fetch(`${env.FASTAPI_API_URL}/communications?${queryParams}`, {
		headers: { "x-internal-api-key": env.FASTAPI_INTERNAL_API_KEY },
		cache: "no-store",
	});
	if (!response.ok) throw new Error("Não foi possível carregar os registros de e-mail.");
	const communicationPage = (await response.json()) as CommunicationPageResponse;
	const items = communicationPage.items;
	const totalMatching = communicationPage.total;
	const sentCount = communicationPage.sent_count;
	const failedCount = communicationPage.failed_count;
	const pendingCount = communicationPage.pending_count;

	const previousHref =
		skip > 0 ? buildPageHref({ status, kind, q, limit, skip: Math.max(skip - limit, 0) }) : null;
	const nextHref =
		skip + items.length < totalMatching
			? buildPageHref({ status, kind, q, limit, skip: skip + limit })
			: null;
	const tableItems = items.map((item) => ({
		id: item.id,
		sentAtLabel: toDateString(item.sent_at || item.created_at, locale),
		status: item.status || "unknown",
		kindLabel: formatKindLabel(item.kind),
		email: item.recipient || "-",
		subject: item.subject || "Assunto não informado",
		previewBody: summarizeBody(item.html_body || item.text_body),
		purchaseId: item.order_id || null,
		userId: item.user_id || null,
		orderStatus: null,
		source: item.source || null,
		error: item.error || null,
		template: item.template_key || null,
		messageId: item.provider_message_id || null,
		provider: item.provider || null,
		attempts: item.attempts || null,
		recipients: { to: [item.recipient] },
		emailBody: item.html_body || null,
		textBody: item.text_body || null,
	}));

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="E-mails"
				title="E-mails transacionais"
				description="Acompanhe envios, falhas e novas tentativas."
				actions={
					<div className="w-full max-w-5xl border border-[color:var(--editorial-border)] bg-[#fbf7f1] p-4">
						<form
							method="get"
							className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_180px_220px_auto] xl:items-end"
						>
							<div className="min-w-[220px]">
								<label
									htmlFor="email-search"
									className="mb-2 block text-sm text-[color:var(--editorial-muted)]"
								>
									Buscar por e-mail, pedido, mensagem ou origem
								</label>
								<Input
									id="email-search"
									name="q"
									defaultValue={q}
									placeholder="cliente@email.com, pedido, tipo da mensagem..."
									className="rounded-none border-[color:var(--editorial-border)] bg-white"
								/>
							</div>
							<div>
								<label htmlFor="status" className="mb-2 block text-sm text-[color:var(--editorial-muted)]">
									Status
								</label>
								<select
									id="status"
									name="status"
									defaultValue={status}
									className="flex h-10 w-full rounded-none border border-[color:var(--editorial-border)] bg-white px-3 py-2 text-sm"
								>
									<option value="all">Todos</option>
									<option value="sent">Enviados</option>
									<option value="failed">Com falha</option>
									<option value="pending">Pendentes</option>
								</select>
							</div>
							<div>
								<label htmlFor="kind" className="mb-2 block text-sm text-[color:var(--editorial-muted)]">
									Tipo
								</label>
								<select
									id="kind"
									name="kind"
									defaultValue={kind}
									className="flex h-10 w-full rounded-none border border-[color:var(--editorial-border)] bg-white px-3 py-2 text-sm"
								>
									<option value="all">Todos</option>
									<option value="order_status">Status de pedido</option>
									<option value="email_confirmation">Confirmação de e-mail</option>
									<option value="password_reset">Redefinição de senha</option>
									<option value="transactional">Transacional</option>
									<option value="test">Teste</option>
									<option value="unknown">Sem tipo informado</option>
								</select>
							</div>
							<input type="hidden" name="limit" value={String(limit)} />
							<div className="flex flex-wrap gap-2">
								<Button
									type="submit"
									className="rounded-none bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)] hover:bg-[color:var(--editorial-accent)]"
								>
									Aplicar
								</Button>
								<Button asChild variant="outline" className="rounded-none">
									<Link href="/admin/emails">Limpar</Link>
								</Button>
							</div>
						</form>
					</div>
				}
			/>
			<div className="grid gap-5 lg:grid-cols-4">
				<AdminEditorialStat label="Registros" value={totalMatching} helper="Resultados do filtro atual." />
				<AdminEditorialStat label="Enviados" value={sentCount} helper="Mensagens concluídas com sucesso." />
				<AdminEditorialStat
					label="Com falha"
					value={failedCount}
					helper="Envios que pedem revisão ou nova tentativa."
				/>
				<AdminEditorialStat
					label="Pendentes"
					value={pendingCount}
					helper="Mensagens ainda sem desfecho final."
				/>
			</div>
			<EditorialPanel className="p-0">
				<div className="border-b border-[color:var(--editorial-border)] px-6 py-5 sm:px-8">
					<div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
						<Mail className="h-4 w-4" />
						Envios recentes
					</div>
				</div>
				<div className="space-y-4 p-6 sm:p-8">
					<EmailLogTable items={tableItems} limit={limit} />
					{tableItems.length === 0 ? (
						<div className="flex flex-col gap-4 border border-[color:var(--editorial-border)] bg-[#fbf7f1] p-5 sm:flex-row sm:items-center sm:justify-between">
							<div className="space-y-1">
								<p className="text-sm font-semibold text-[color:var(--editorial-ink)]">
									Ainda não há envios neste recorte.
								</p>
								<p className="text-sm leading-6 text-[color:var(--editorial-muted)]">
									Revise os modelos, confirme o e-mail de suporte e dispare um teste para verificar a trilha
									completa.
								</p>
							</div>
							<div className="flex flex-wrap gap-2">
								<Button asChild variant="outline" className="rounded-none bg-white">
									<Link href="/admin/settings">Ver configurações</Link>
								</Button>
								<Button
									asChild
									className="rounded-none bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)] hover:bg-[color:var(--editorial-accent)]"
								>
									<Link href="/admin/email-templates">Ver modelos de e-mail</Link>
								</Button>
							</div>
						</div>
					) : null}

					<div className="flex flex-col gap-3 border-t border-[color:var(--editorial-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-sm text-[color:var(--editorial-muted)]">
							Mostrando {items.length > 0 ? skip + 1 : 0} - {skip + items.length} de {totalMatching}{" "}
							registro(s).
						</p>
						<div className="flex items-center gap-2">
							{previousHref ? (
								<Button asChild variant="outline" className="rounded-none">
									<Link href={previousHref}>Anterior</Link>
								</Button>
							) : null}
							{nextHref ? (
								<Button asChild variant="outline" className="rounded-none">
									<Link href={nextHref}>Próximo</Link>
								</Button>
							) : null}
						</div>
					</div>
				</div>
			</EditorialPanel>
		</AdminEditorialPage>
	);
}
