import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { EditorialPageCopyForm } from "@/app/admin/editorial/_components/editorial-page-copy-form";
import {
	getEditorialEventsPageCopyRecord,
	updateEditorialEventsPageCopyAction,
} from "@/app/admin/editorial/page-content-actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { listEditorialRecordsForAdmin } from "@/lib/editorial-content-store";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";

export default async function AdminEditorialEventsPage() {
	const session = await auth();
	if (!session || !hasCapability(session.user.role, "editorial.write")) return null;

	const [page, events] = await Promise.all([
		getEditorialEventsPageCopyRecord(),
		listEditorialRecordsForAdmin("event"),
	]);
	if (!page) return null;

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Editorial"
				title="Eventos"
				description="Edite a copy estrutural da rota pública de eventos e gerencie a agenda publicada."
				actions={
					<div className="flex flex-wrap gap-3">
						<Link
							href="/admin/editorial"
							className="inline-flex items-center gap-2 border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3 text-sm text-[color:var(--editorial-muted)] transition-colors hover:text-[color:var(--editorial-ink)]"
						>
							<ArrowLeft className="h-4 w-4" />
							Voltar para editorial
						</Link>
						<Link
							href="/admin/editorial/events/new"
							className="inline-flex items-center gap-2 bg-[color:var(--editorial-ink)] px-4 py-3 text-sm text-[color:var(--editorial-paper)]"
						>
							<Plus className="h-4 w-4" />
							Novo evento
						</Link>
					</div>
				}
			/>

			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat
					label="Status da página"
					value={page.published ? "Publicado" : "Rascunho"}
					helper="Rota: /events"
				/>
				<AdminEditorialStat label="Eventos" value={events.length} helper="Itens cadastrados na agenda." />
				<AdminEditorialStat
					label="Textos"
					value="5 blocos"
					helper="Hero, nota, agenda, arquivo e CTA final."
				/>
			</div>

			<div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
				<EditorialPageCopyForm
					action={updateEditorialEventsPageCopyAction}
					submitLabel="Salvar textos de /events"
					base={{ title: page.title, summary: page.summary, order: page.order, published: page.published }}
					sections={[
						{
							title: "Hero",
							description: "Faixa inicial da agenda pública.",
							route: "/events",
							fields: [
								{ name: "heroEyebrow", label: "Linha curta", defaultValue: page.hero?.eyebrow },
								{ name: "heroTitle", label: "Título", defaultValue: page.hero?.title },
								{
									name: "heroBody",
									label: "Texto",
									type: "textarea",
									rows: 4,
									defaultValue: page.hero?.body,
								},
								{
									name: "heroPrimaryCtaLabel",
									label: "Botão principal",
									defaultValue: page.hero?.primaryCtaLabel,
								},
								{
									name: "heroPrimaryCtaHref",
									label: "Link do botão principal",
									defaultValue: page.hero?.primaryCtaHref,
								},
								{
									name: "heroSecondaryCtaLabel",
									label: "Botão secundário",
									defaultValue: page.hero?.secondaryCtaLabel,
								},
								{
									name: "heroSecondaryCtaHref",
									label: "Link do botão secundário",
									defaultValue: page.hero?.secondaryCtaHref,
								},
							],
						},
						{
							title: "Nota curatorial",
							description: "Explica por que a rota existe sem virar item principal do menu.",
							route: "/events",
							fields: [
								{ name: "curatorialTitle", label: "Título", defaultValue: page.curatorialNote?.title },
								{
									name: "curatorialBody",
									label: "Texto",
									type: "textarea",
									rows: 4,
									defaultValue: page.curatorialNote?.body,
								},
							],
						},
						{
							title: "Agenda",
							description: "Cabeçalho e fallback da lista de eventos.",
							route: "/events",
							fields: [
								{ name: "agendaLabel", label: "Linha curta", defaultValue: page.agenda?.label },
								{ name: "agendaTitle", label: "Título interno do bloco", defaultValue: page.agenda?.title },
								{
									name: "agendaBody",
									label: "Texto de apoio",
									type: "textarea",
									rows: 3,
									defaultValue: page.agenda?.body,
								},
								{
									name: "agendaEmptyText",
									label: "Texto quando não houver agenda",
									type: "textarea",
									rows: 4,
									defaultValue: page.agenda?.emptyText,
								},
							],
						},
						{
							title: "Arquivo e memória",
							description: "Bloco escuro com registros e contexto.",
							route: "/events",
							fields: [
								{ name: "archiveLabel", label: "Linha curta", defaultValue: page.archive?.label },
								{ name: "archiveTitle", label: "Título", defaultValue: page.archive?.title },
								{
									name: "archiveBody",
									label: "Texto",
									type: "textarea",
									rows: 3,
									defaultValue: page.archive?.body,
								},
							],
						},
						{
							title: "Faixa final",
							description: "Continuidade para Sarau Safado e Projetos.",
							route: "/events",
							fields: [
								{ name: "finalTitle", label: "Título", defaultValue: page.finalCta?.title },
								{
									name: "finalBody",
									label: "Texto",
									type: "textarea",
									rows: 3,
									defaultValue: page.finalCta?.body,
								},
								{
									name: "finalPrimaryCtaLabel",
									label: "Botão principal",
									defaultValue: page.finalCta?.primaryCtaLabel,
								},
								{
									name: "finalPrimaryCtaHref",
									label: "Link do botão principal",
									defaultValue: page.finalCta?.primaryCtaHref,
								},
								{
									name: "finalSecondaryCtaLabel",
									label: "Botão secundário",
									defaultValue: page.finalCta?.secondaryCtaLabel,
								},
								{
									name: "finalSecondaryCtaHref",
									label: "Link do botão secundário",
									defaultValue: page.finalCta?.secondaryCtaHref,
								},
							],
						},
					]}
				/>

				<EditorialPanel className="p-0">
					<div className="border-b border-[color:var(--editorial-border)] p-6">
						<h2 className="text-xl font-semibold text-[color:var(--editorial-ink)]">Agenda cadastrada</h2>
						<p className="mt-2 text-sm leading-6 text-[color:var(--editorial-muted)]">
							Clique em um item para editar data, local, status e imagem.
						</p>
					</div>
					<div className="divide-y divide-[color:var(--editorial-border)]">
						{events.map((event) => (
							<Link
								key={event.slug}
								href={`/admin/editorial/events/${encodeURIComponent(event.slug)}`}
								className="block p-6 transition-colors hover:bg-[#fbf7f1]"
							>
								<p className="text-xs uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
									{event.published ? "Publicado" : "Rascunho"}
								</p>
								<h3 className="mt-2 text-lg font-semibold text-[color:var(--editorial-ink)]">
									{event.title}
								</h3>
								<p className="mt-2 text-sm leading-6 text-[color:var(--editorial-muted)]">
									{event.period || event.status || "Sem data definida"}
									{event.location ? ` · ${event.location}` : ""}
								</p>
							</Link>
						))}
					</div>
				</EditorialPanel>
			</div>
		</AdminEditorialPage>
	);
}
