import { ArrowDown, ArrowUp, CalendarRange, FolderKanban, ImagePlus, PenSquare, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
	listEditorialEventRecords,
	moveEditorialEventAction,
	toggleEditorialEventPublishedAction,
} from "@/app/admin/editorial/actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { Badge } from "@/ui/shadcn/badge";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/shadcn/table";

export const dynamic = "force-dynamic";

export default async function AdminEditorialEventsPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "editorial.write")) redirect("/forbidden");

	const events = await listEditorialEventRecords();

	return (
		<main className="mx-auto max-w-full space-y-6 px-4 py-8 sm:px-6 lg:px-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold">Editorial · Eventos</h1>
					<p className="text-sm text-muted-foreground">
						Gerencie a agenda pública do selo com publicação, ordem e edição rápida.
					</p>
				</div>
				<Button asChild>
					<Link href="/admin/editorial/events/new">
						<Plus className="h-4 w-4" />
						Novo evento
					</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Eventos</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap gap-2">
						<Button asChild variant="outline" size="sm">
							<Link href="/admin/editorial">
								<PenSquare className="h-4 w-4" />
								Hub editorial
							</Link>
						</Button>
						<Button asChild variant="outline" size="sm">
							<Link href="/admin/editorial/projects">
								<FolderKanban className="h-4 w-4" />
								Projetos
							</Link>
						</Button>
						<Button asChild variant="outline" size="sm">
							<Link href="/admin/editorial/sarau-safado">
								<CalendarRange className="h-4 w-4" />
								Sarau Safado
							</Link>
						</Button>
					</div>
					<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
						<span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
							<PenSquare className="h-3.5 w-3.5" />
							Ordem e publicação já respondem no selolibertaria
						</span>
						<span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
							<ImagePlus className="h-3.5 w-3.5" />
							Upload editorial reutiliza o fluxo de produtos
						</span>
					</div>

					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Ordem</TableHead>
								<TableHead>Título</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Período</TableHead>
								<TableHead>Local</TableHead>
								<TableHead>Publicação</TableHead>
								<TableHead>Atualizado</TableHead>
								<TableHead></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{events.map((event) => (
								<TableRow key={`${event.type}-${event.slug}`}>
									<TableCell>{event.order}</TableCell>
									<TableCell>
										<div className="space-y-1">
											<p className="font-medium">{event.title}</p>
											<p className="text-xs text-muted-foreground">{event.slug}</p>
										</div>
									</TableCell>
									<TableCell>{event.status || "—"}</TableCell>
									<TableCell>{event.period || "—"}</TableCell>
									<TableCell>{event.location || "—"}</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Badge variant={event.published ? "secondary" : "outline"}>
												{event.published ? "Publicado" : "Rascunho"}
											</Badge>
										</div>
									</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										{event.updatedAt
											? new Intl.DateTimeFormat("pt-BR", {
													dateStyle: "short",
													timeStyle: "short",
												}).format(new Date(event.updatedAt))
											: "—"}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-2">
											<form action={moveEditorialEventAction} className="flex gap-2">
												<input type="hidden" name="slug" value={event.slug} />
												<input type="hidden" name="direction" value="up" />
												<Button type="submit" size="icon" variant="outline" aria-label="Mover para cima">
													<ArrowUp className="h-4 w-4" />
												</Button>
											</form>
											<form action={moveEditorialEventAction} className="flex gap-2">
												<input type="hidden" name="slug" value={event.slug} />
												<input type="hidden" name="direction" value="down" />
												<Button type="submit" size="icon" variant="outline" aria-label="Mover para baixo">
													<ArrowDown className="h-4 w-4" />
												</Button>
											</form>
											<form action={toggleEditorialEventPublishedAction}>
												<input type="hidden" name="slug" value={event.slug} />
												<input type="hidden" name="published" value={event.published ? "false" : "true"} />
												<Button type="submit" size="sm" variant="outline">
													{event.published ? "Rascunho" : "Publicar"}
												</Button>
											</form>
											<Button asChild size="sm" variant="outline">
												<Link href={`/admin/editorial/events/${encodeURIComponent(event.slug)}`}>Editar</Link>
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</main>
	);
}
