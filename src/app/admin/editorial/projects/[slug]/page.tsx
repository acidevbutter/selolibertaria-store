import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditorialMetaCard } from "@/app/admin/editorial/_components/editorial-meta-card";
import { EditorialProjectForm } from "@/app/admin/editorial/_components/editorial-project-form";
import {
	deleteEditorialProjectAction,
	getEditorialProjectBySlug,
	toggleEditorialProjectPublishedAction,
	updateEditorialProjectAction,
} from "@/app/admin/editorial/actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { Button } from "@/ui/shadcn/button";
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
		<main className="mx-auto max-w-full space-y-6 px-4 py-8 sm:px-6 lg:px-8">
			<div className="space-y-3">
				<Link
					href="/admin/editorial/projects"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4" />
					Editorial
				</Link>
				<div>
					<h1 className="text-2xl font-semibold">{project.title}</h1>
					<p className="text-sm text-muted-foreground">{project.slug}</p>
				</div>
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
							<form action={toggleEditorialProjectPublishedAction}>
								<input type="hidden" name="slug" value={project.slug} />
								<input type="hidden" name="published" value={project.published ? "false" : "true"} />
								<Button type="submit" variant="outline" className="w-full">
									{project.published ? "Mover para rascunho" : "Publicar"}
								</Button>
							</form>
							<form action={deleteEditorialProjectAction}>
								<input type="hidden" name="slug" value={project.slug} />
								<Button type="submit" variant="destructive" className="w-full">
									Excluir projeto
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
		</main>
	);
}
