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
					label="Status"
					value={page.published ? "Publicado" : "Rascunho"}
					helper="Rota: /events"
				/>
				<AdminEditorialStat label="Itens" value={events.length} helper="Eventos cadastrados na agenda." />
				<AdminEditorialStat
					label="Fonte"
					value="Admin editorial"
					helper="Copy pública editável sem deploy."
				/>
			</div>

			<div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.95fr)]">
				<EditorialPageCopyForm
					action={updateEditorialEventsPageCopyAction}
					submitLabel="Salvar textos de /events"
					base={{ published: page.published }}
					sections={[
						{
							title: "Abertura",
							description: "Faixa inicial da agenda pública.",
							route: "/events",
							defaultOpen: true,
							fields: [
								{ name: "heroEyebrow", label: "Linha curta da abertura", defaultValue: page.hero?.eyebrow },
								{ name: "heroTitle", label: "Título da abertura", defaultValue: page.hero?.title },
								{
									name: "heroBody",
									label: "Texto da abertura",
									type: "textarea",
									rows: 4,
									defaultValue: page.hero?.body,
								},
								{
									name: "heroPrimaryCtaLabel",
									label: "Texto do botão principal da abertura",
									defaultValue: page.hero?.primaryCtaLabel,
									help: "Use um texto curto para a principal saída da agenda.",
								},
								{
									name: "heroPrimaryCtaHref",
									label: "Destino do botão principal da abertura",
									defaultValue: page.hero?.primaryCtaHref,
									help: "Prefira rotas internas, como /sarau-safado ou /contact.",
								},
								{
									name: "heroSecondaryCtaLabel",
									label: "Texto do botão secundário da abertura",
									defaultValue: page.hero?.secondaryCtaLabel,
									help: "Use um texto de apoio para a segunda saída editorial.",
								},
								{
									name: "heroSecondaryCtaHref",
									label: "Destino do botão secundário da abertura",
									defaultValue: page.hero?.secondaryCtaHref,
									help: "Prefira uma rota interna estável do site.",
								},
								{
									name: "heroBackground",
									label: "Fundo da abertura",
									type: "background",
									background: page.hero?.background,
								},
							],
						},
						{
							title: "Nota curatorial",
							description: "Explica por que a rota existe sem virar item principal do menu.",
							route: "/events",
							fields: [
								{
									name: "curatorialTitle",
									label: "Título da nota curatorial",
									defaultValue: page.curatorialNote?.title,
								},
								{
									name: "curatorialBody",
									label: "Texto da nota curatorial",
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
								{ name: "agendaLabel", label: "Linha curta da agenda", defaultValue: page.agenda?.label },
								{
									name: "agendaTitle",
									label: "Título da seção de agenda",
									defaultValue: page.agenda?.title,
								},
								{
									name: "agendaBody",
									label: "Texto de apoio da agenda",
									type: "textarea",
									rows: 3,
									defaultValue: page.agenda?.body,
								},
								{
									name: "agendaEmptyText",
									label: "Texto de fallback sem agenda",
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
								{ name: "archiveLabel", label: "Linha curta do arquivo", defaultValue: page.archive?.label },
								{
									name: "archiveTitle",
									label: "Título do arquivo e memória",
									defaultValue: page.archive?.title,
								},
								{
									name: "archiveBody",
									label: "Texto do arquivo e memória",
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
								{ name: "finalTitle", label: "Título da faixa final", defaultValue: page.finalCta?.title },
								{
									name: "finalBody",
									label: "Texto da faixa final",
									type: "textarea",
									rows: 3,
									defaultValue: page.finalCta?.body,
								},
								{
									name: "finalPrimaryCtaLabel",
									label: "Texto do botão principal da faixa final",
									defaultValue: page.finalCta?.primaryCtaLabel,
									help: "Use um texto curto para a principal saída desta seção.",
								},
								{
									name: "finalPrimaryCtaHref",
									label: "Destino do botão principal da faixa final",
									defaultValue: page.finalCta?.primaryCtaHref,
									help: "Prefira rotas internas, como /sarau-safado ou /projects.",
								},
								{
									name: "finalSecondaryCtaLabel",
									label: "Texto do botão secundário da faixa final",
									defaultValue: page.finalCta?.secondaryCtaLabel,
									help: "Use um botão complementar para a segunda continuidade editorial.",
								},
								{
									name: "finalSecondaryCtaHref",
									label: "Destino do botão secundário da faixa final",
									defaultValue: page.finalCta?.secondaryCtaHref,
									help: "Prefira uma rota interna estável do site.",
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
