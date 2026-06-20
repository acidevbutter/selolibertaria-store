import { ArrowDown, ArrowUp, BookOpen, CalendarRange, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
	listEditorialProjectRecords,
	moveEditorialProjectAction,
	toggleEditorialProjectPublishedAction,
} from "@/app/admin/editorial/actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";
import { Badge } from "@/ui/shadcn/badge";
import { Button } from "@/ui/shadcn/button";
import { CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/shadcn/table";

export const dynamic = "force-dynamic";

export default async function AdminEditorialProjectsPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "editorial.write")) redirect("/forbidden");
	const projects = await listEditorialProjectRecords();
	const publishedCount = projects.filter((project) => project.published).length;
	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Editorial"
				title="Projetos"
				description="Organize programas, laboratórios e frentes culturais com a mesma leitura operacional do restante do admin."
				actions={
					<div className="flex flex-wrap gap-3">
						<Button asChild className="rounded-none">
							<Link href="/admin/editorial/projects/new">
								<Plus className="h-4 w-4" />
								Novo projeto
							</Link>
						</Button>
						<Button asChild variant="outline" className="rounded-none">
							<Link href="/admin/editorial">
								<BookOpen className="h-4 w-4" />
								Hub editorial
							</Link>
						</Button>
					</div>
				}
			/>
			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat label="Projetos" value={projects.length} helper="Itens operando nesta coleção." />
				<AdminEditorialStat
					label="Publicados"
					value={publishedCount}
					helper="Entradas visíveis na área pública."
				/>
				<AdminEditorialStat
					label="Rascunhos"
					value={projects.length - publishedCount}
					helper="Edições ainda em preparação."
				/>
			</div>
			<EditorialPanel className="space-y-6">
				<CardHeader>
					<CardTitle>Ações rápidas</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap gap-2">
						<Button asChild variant="outline" size="sm" className="rounded-none">
							<Link href="/admin/editorial/events">
								<CalendarRange className="h-4 w-4" />
								Eventos
							</Link>
						</Button>
						<Button asChild variant="outline" size="sm" className="rounded-none">
							<Link href="/admin/editorial/sarau-safado">
								<BookOpen className="h-4 w-4" />
								Sarau Safado
							</Link>
						</Button>
					</div>
				</CardContent>
			</EditorialPanel>
			<EditorialPanel className="overflow-hidden p-0">
				<CardHeader>
					<CardTitle>Projetos</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Ordem</TableHead>
								<TableHead>Título</TableHead>
								<TableHead>Período</TableHead>
								<TableHead>Local</TableHead>
								<TableHead>Publicação</TableHead>
								<TableHead>Atualizado</TableHead>
								<TableHead></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{projects.map((project) => (
								<TableRow key={`${project.type}-${project.slug}`}>
									<TableCell>{project.order}</TableCell>
									<TableCell>
										<div className="space-y-1">
											<p className="font-medium">{project.title}</p>
											<p className="text-xs text-muted-foreground">{project.slug}</p>
										</div>
									</TableCell>
									<TableCell>{project.period || "—"}</TableCell>
									<TableCell>{project.location || "—"}</TableCell>
									<TableCell>
										<Badge variant={project.published ? "secondary" : "outline"}>
											{project.published ? "Publicado" : "Rascunho"}
										</Badge>
									</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										{project.updatedAt
											? new Intl.DateTimeFormat("pt-BR", {
													dateStyle: "short",
													timeStyle: "short",
												}).format(new Date(project.updatedAt))
											: "—"}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-2">
											<form action={moveEditorialProjectAction}>
												<input type="hidden" name="slug" value={project.slug} />
												<input type="hidden" name="direction" value="up" />
												<Button type="submit" size="icon" variant="outline" aria-label="Mover para cima">
													<ArrowUp className="h-4 w-4" />
												</Button>
											</form>
											<form action={moveEditorialProjectAction}>
												<input type="hidden" name="slug" value={project.slug} />
												<input type="hidden" name="direction" value="down" />
												<Button type="submit" size="icon" variant="outline" aria-label="Mover para baixo">
													<ArrowDown className="h-4 w-4" />
												</Button>
											</form>
											<form action={toggleEditorialProjectPublishedAction}>
												<input type="hidden" name="slug" value={project.slug} />
												<input type="hidden" name="published" value={project.published ? "false" : "true"} />
												<Button type="submit" size="sm" variant="outline">
													{project.published ? "Rascunho" : "Publicar"}
												</Button>
											</form>
											<Button asChild size="sm" variant="outline">
												<Link href={`/admin/editorial/projects/${encodeURIComponent(project.slug)}`}>
													Editar
												</Link>
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</EditorialPanel>
		</AdminEditorialPage>
	);
}
