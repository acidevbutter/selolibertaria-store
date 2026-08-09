import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditorialItemActions } from "@/app/admin/editorial/_components/editorial-item-actions.client";
import { EditorialMetaCard } from "@/app/admin/editorial/_components/editorial-meta-card";
import { EditorialPagePreview } from "@/app/admin/editorial/_components/editorial-page-preview.client";
import { EditorialProjectForm } from "@/app/admin/editorial/_components/editorial-project-form";
import {
	deleteEditorialProjectAction,
	getEditorialProjectBySlug,
	toggleEditorialProjectPublishedAction,
	updateEditorialProjectAction,
} from "@/app/admin/editorial/actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
} from "@/ui/editorial/editorial-primitives";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";

export default async function AdminEditorialProjectDetailsPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "editorial.write")) redirect("/forbidden");
	const { slug: rawSlug } = await params;
	const slug = decodeURIComponent(rawSlug);
	const project = await getEditorialProjectBySlug(slug);
	if (!project) redirect("/admin/editorial/projects");
	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Editorial"
				title={project.title}
				description="Edite narrativa, período, local e publicação do projeto."
				actions={
					<div className="flex flex-wrap gap-3">
						<EditorialPagePreview href="/projects" published={project.published} formId="editorial-project-form" pageTitle={project.title} />
						<Link
							href="/admin/editorial/projects"
							className="inline-flex items-center gap-2 border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3 text-sm text-[color:var(--editorial-muted)] transition-colors hover:text-[color:var(--editorial-ink)]"
						>
							<ArrowLeft className="h-4 w-4" />
							Voltar para projetos
						</Link>
						<div className="border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3">
							<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
								Slug
							</div>
							<div className="mt-2 font-mono text-xs text-[color:var(--editorial-muted)]">{project.slug}</div>
						</div>
					</div>
				}
			/>
			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat
					label="Período"
					value={project.period || "Não informado"}
					helper="Resumo do calendário."
				/>
				<AdminEditorialStat
					label="Local"
					value={project.location || "Não informado"}
					helper="Contexto territorial do projeto."
				/>
				<AdminEditorialStat
					label="Publicação"
					value={project.published ? "Publicado" : "Rascunho"}
					helper="Estado atual no site."
				/>
			</div>
			<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
				<EditorialProjectForm
					action={updateEditorialProjectAction}
					project={project}
					submitLabel="Salvar projeto"
				/>
				<div className="space-y-6">
					<EditorialMetaCard
						published={project.published}
						order={project.order}
						updatedAt={project.updatedAt}
						updatedBy={project.updatedBy}
					/>
					<Card>
						<CardHeader>
							<CardTitle>Ações</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<EditorialItemActions
								slug={project.slug}
								published={project.published}
								itemLabel="projeto"
								toggleAction={toggleEditorialProjectPublishedAction}
								deleteAction={deleteEditorialProjectAction}
							/>
						</CardContent>
					</Card>
				</div>
			</div>
		</AdminEditorialPage>
	);
}
