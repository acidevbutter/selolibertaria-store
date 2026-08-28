import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { EditorialPageCopyForm } from "@/app/admin/editorial/_components/editorial-page-copy-form";
import {
	getEditorialProjectsPageCopyRecord,
	updateEditorialProjectsPageCopyAction,
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

export default async function AdminEditorialProjectsPage() {
	const session = await auth();
	if (!session || !hasCapability(session.user.role, "editorial.write")) return null;

	const [page, projects] = await Promise.all([
		getEditorialProjectsPageCopyRecord(),
		listEditorialRecordsForAdmin("project"),
	]);

	if (!page) return null;

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Editorial"
				title="Projetos"
				description="Edite a copy estrutural da rota pública de projetos e gerencie o portfólio cultural."
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
							href="/admin/editorial/projects/new"
							className="inline-flex items-center gap-2 bg-[color:var(--editorial-ink)] px-4 py-3 text-sm text-[color:var(--editorial-paper)]"
						>
							<Plus className="h-4 w-4" />
							Novo projeto
						</Link>
					</div>
				}
			/>

			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat
					label="Status"
					value={page.published ? "Publicado" : "Rascunho"}
					helper="Rota: /projects"
				/>
				<AdminEditorialStat
					label="Itens"
					value={projects.length}
					helper="Projetos cadastrados no portfólio."
				/>
				<AdminEditorialStat
					label="Fonte"
					value="Admin editorial"
					helper="Copy pública editável sem deploy."
				/>
			</div>

			<div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.95fr)]">
				<EditorialPageCopyForm
					action={updateEditorialProjectsPageCopyAction}
					submitLabel="Salvar textos de /projects"
					base={{ published: page.published }}
					pageTitle="Projetos"
					sections={[
						{
							title: "Abertura",
							description: "Introdução principal da página de projetos.",
							route: "/projects",
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
									name: "heroImageLabel",
									label: "Legenda da imagem de abertura",
									defaultValue: page.hero?.imageLabel,
								},
								{
									name: "heroBackground",
									label: "Imagem de fundo da abertura",
									type: "background",
									background: page.hero?.background,
								},
							],
						},
						{
							title: "Nota curatorial",
							description: "Explica o papel dos projetos no ecossistema do selo.",
							route: "/projects",
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
							title: "Listagem de projetos",
							description: "Copy estrutural acima dos cards e fallback da página.",
							route: "/projects",
							fields: [
								{ name: "listingLabel", label: "Linha curta da listagem", defaultValue: page.listing?.label },
								{
									name: "listingTitle",
									label: "Título da seção de listagem",
									defaultValue: page.listing?.title,
								},
								{
									name: "listingBody",
									label: "Texto de apoio da listagem",
									type: "textarea",
									rows: 3,
									defaultValue: page.listing?.body,
								},
								{
									name: "listingEmptyText",
									label: "Texto quando não houver projetos",
									type: "textarea",
									rows: 4,
									defaultValue: page.listing?.emptyText,
								},
							],
						},
						{
							title: "Faixa final",
							description: "Continuidade para contato e Sarau Safado.",
							route: "/projects",
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
									help: "Use um texto curto para a saída principal desta seção.",
								},
								{
									name: "finalPrimaryCtaHref",
									label: "Destino do botão principal da faixa final",
									defaultValue: page.finalCta?.primaryCtaHref,
									help: "Prefira rotas internas, como /contact ou /sarau-safado.",
								},
								{
									name: "finalSecondaryCtaLabel",
									label: "Texto do botão secundário da faixa final",
									defaultValue: page.finalCta?.secondaryCtaLabel,
									help: "Use um botão complementar para a segunda saída editorial.",
								},
								{
									name: "finalSecondaryCtaHref",
									label: "Destino do botão secundário da faixa final",
									defaultValue: page.finalCta?.secondaryCtaHref,
									help: "Prefira rotas internas estáveis do site.",
								},
							],
						},
					]}
				/>

				<EditorialPanel className="p-0">
					<div className="border-b border-[color:var(--editorial-border)] p-6">
						<h2 className="text-xl font-semibold text-[color:var(--editorial-ink)]">Portfólio cadastrado</h2>
						<p className="mt-2 text-sm leading-6 text-[color:var(--editorial-muted)]">
							Clique em um projeto para editar título, status, contexto e imagem.
						</p>
					</div>
					<div className="divide-y divide-[color:var(--editorial-border)]">
						{projects.map((project) => (
							<Link
								key={project.slug}
								href={`/admin/editorial/projects/${encodeURIComponent(project.slug)}`}
								className="block p-6 transition-colors hover:bg-[#fbf7f1]"
							>
								<p className="text-xs uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
									{project.published ? "Publicado" : "Rascunho"}
								</p>
								<h3 className="mt-2 text-lg font-semibold text-[color:var(--editorial-ink)]">
									{project.title}
								</h3>
								<p className="mt-2 text-sm leading-6 text-[color:var(--editorial-muted)]">
									{project.period || "Sem período"}
									{project.location ? ` · ${project.location}` : ""}
								</p>
							</Link>
						))}
					</div>
				</EditorialPanel>
			</div>
		</AdminEditorialPage>
	);
}
