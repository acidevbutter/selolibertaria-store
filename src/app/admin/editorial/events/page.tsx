import { ArrowDown, ArrowUp, CalendarRange, FolderKanban, ImagePlus, PenSquare, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
	listEditorialEventRecords,
	moveEditorialEventAction,
	toggleEditorialEventPublishedAction,
} from "@/app/admin/editorial/actions";
import { env } from "@/env.mjs";
import { resolveLocale } from "@/i18n/config";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { getDefaultLocaleSetting } from "@/lib/settings-store";
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

export default async function AdminEditorialEventsPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "editorial.write")) redirect("/forbidden");
	const locale = (await getDefaultLocaleSetting()) ?? resolveLocale(env.NEXT_PUBLIC_LANGUAGE);

	const events = await listEditorialEventRecords();
	const publishedCount = events.filter((event) => event.published).length;

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Editorial"
				title="Eventos"
				description="Gerencie agenda, publicação e ordem dos eventos do selo."
				actions={
					<div className="flex flex-wrap gap-3">
						<Button asChild className="rounded-none">
							<Link href="/admin/editorial/events/new">
								<Plus className="h-4 w-4" />
								Novo evento
							</Link>
						</Button>
						<Button asChild variant="outline" className="rounded-none">
							<Link href="/admin/editorial">
								<PenSquare className="h-4 w-4" />
								Ver painel editorial
							</Link>
						</Button>
					</div>
				}
			/>

			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat label="Eventos" value={events.length} helper="Itens neste recorte." />
				<AdminEditorialStat label="Publicados" value={publishedCount} helper="Entradas visíveis no site." />
				<AdminEditorialStat
					label="Rascunhos"
					value={events.length - publishedCount}
					helper="Edições ainda em revisão."
				/>
			</div>

			<EditorialPanel className="space-y-6">
				<CardHeader>
					<CardTitle>Ações rápidas</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap gap-2">
						<Button asChild variant="outline" size="sm" className="rounded-none">
							<Link href="/admin/editorial/projects">
								<FolderKanban className="h-4 w-4" />
								Ver projetos
							</Link>
						</Button>
						<Button asChild variant="outline" size="sm" className="rounded-none">
							<Link href="/admin/editorial/sarau-safado">
								<CalendarRange className="h-4 w-4" />
								Ver Sarau Safado
							</Link>
						</Button>
					</div>
					<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
						<span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
							<PenSquare className="h-3.5 w-3.5" />
							Ordem e publicação aparecem no site
						</span>
						<span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
							<ImagePlus className="h-3.5 w-3.5" />
							Imagens seguem a mesma revisão visual do catálogo
						</span>
					</div>
				</CardContent>
			</EditorialPanel>

			<EditorialPanel className="overflow-hidden p-0">
				<CardHeader>
					<CardTitle>Eventos</CardTitle>
				</CardHeader>
				<CardContent>
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
									<TableCell>{event.status || "Não informado"}</TableCell>
									<TableCell>{event.period || "Não informado"}</TableCell>
									<TableCell>{event.location || "Não informado"}</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Badge variant={event.published ? "secondary" : "outline"}>
												{event.published ? "Publicado" : "Rascunho"}
											</Badge>
										</div>
									</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										{event.updatedAt
											? new Intl.DateTimeFormat(locale, {
													dateStyle: "short",
													timeStyle: "short",
												}).format(new Date(event.updatedAt))
											: "Não informado"}
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
												<Link href={`/admin/editorial/events/${encodeURIComponent(event.slug)}`}>
													Editar evento
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
