import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import {
	getEditorialProjectsPageCopyRecord,
	updateEditorialProjectsPageCopyAction,
} from "@/app/admin/editorial/page-content-actions";
import { EditorialPageCopyForm } from "@/app/admin/editorial/_components/editorial-page-copy-form";
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
				<AdminEditorialStat label="Status da página" value={page.published ? "Publicado" : "Rascunho"} helper="Rota: /projects" />
				<AdminEditorialStat label="Projetos" value={projects.length} helper="Itens do portfólio." />
				<AdminEditorialStat label="Textos" value="4 blocos" helper="Hero, nota, listagem e CTA final." />
			</div>

			<div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
				<EditorialPageCopyForm
					action={updateEditorialProjectsPageCopyAction}
					submitLabel="Salvar textos de /projects"
					base={{ title: page.title, summary: page.summary, order: page.order, published: page.published }}
					sections={[
						{
							title: "Hero",
							description: "Introdução principal da página de projetos.",
							route: "/projects",
							fields: [
								{ name: "heroEyebrow", label: "Linha curta", defaultValue: page.hero?.eyebrow },
								{ name: "heroTitle", label: "Título", defaultValue: page.hero?.title },
								{ name: "heroBody", label: "Texto", type: "textarea", rows: 4, defaultValue: page.hero?.body },
								{ name: "heroImageLabel", label: "Legenda da imagem", defaultValue: page.hero?.imageLabel },
							],
						},
						{
							title: "Nota curatorial",
							description: "Explica o papel dos projetos no ecossistema do selo.",
							route: "/projects",
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
							title: "Listagem de projetos",
							description: "Copy estrutural acima dos cards e fallback da página.",
							route: "/projects",
							fields: [
								{ name: "listingLabel", label: "Linha curta", defaultValue: page.listing?.label },
								{ name: "listingTitle", label: "Título interno do bloco", defaultValue: page.listing?.title },
								{ name: "listingBody", label: "Texto de apoio", type: "textarea", rows: 3, defaultValue: page.listing?.body },
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
								{ name: "finalTitle", label: "Título", defaultValue: page.finalCta?.title },
								{ name: "finalBody", label: "Texto", type: "textarea", rows: 3, defaultValue: page.finalCta?.body },
								{ name: "finalPrimaryCtaLabel", label: "Botão principal", defaultValue: page.finalCta?.primaryCtaLabel },
								{ name: "finalPrimaryCtaHref", label: "Link do botão principal", defaultValue: page.finalCta?.primaryCtaHref },
								{ name: "finalSecondaryCtaLabel", label: "Botão secundário", defaultValue: page.finalCta?.secondaryCtaLabel },
								{ name: "finalSecondaryCtaHref", label: "Link do botão secundário", defaultValue: page.finalCta?.secondaryCtaHref },
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
								<h3 className="mt-2 text-lg font-semibold text-[color:var(--editorial-ink)]">{project.title}</h3>
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
