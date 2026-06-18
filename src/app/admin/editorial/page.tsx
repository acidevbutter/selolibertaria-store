import { BookOpen, CalendarRange, FolderKanban, House, Info, Mail } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/shadcn/card";
import {
	getEditorialAboutRecord,
	getEditorialContactRecord,
	getEditorialHomeRecord,
	getEditorialSarauRecord,
	listEditorialEventRecords,
	listEditorialProjectRecords,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminEditorialOverviewPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "editorial.write")) redirect("/forbidden");

	const [events, projects, sarau, about, contact, home] = await Promise.all([
		listEditorialEventRecords(),
		listEditorialProjectRecords(),
		getEditorialSarauRecord(),
		getEditorialAboutRecord(),
		getEditorialContactRecord(),
		getEditorialHomeRecord(),
	]);

	const sections = [
		{
			title: "Eventos",
			description: "Agenda, encontros, oficinas e ativações do selo.",
			countLabel: `${events.length} item(ns)`,
			statusLabel: `${events.filter((item) => item.published).length} publicado(s)`,
			href: "/admin/editorial/events",
			icon: CalendarRange,
		},
		{
			title: "Projetos",
			description: "Programas culturais, festivais, laboratórios e ações recorrentes.",
			countLabel: `${projects.length} item(ns)`,
			statusLabel: `${projects.filter((item) => item.published).length} publicado(s)`,
			href: "/admin/editorial/projects",
			icon: FolderKanban,
		},
		{
			title: "Sarau Safado",
			description: "Página institucional do programa principal do selo.",
			countLabel: "Página institucional",
			statusLabel: sarau?.published ? "Publicado" : "Rascunho",
			href: "/admin/editorial/sarau-safado",
			icon: BookOpen,
		},
		{
			title: "Sobre",
			description: "Narrativa institucional e posicionamento editorial do selo.",
			countLabel: "Página institucional",
			statusLabel: about?.published ? "Publicado" : "Rascunho",
			href: "/admin/editorial/about",
			icon: Info,
		},
		{
			title: "Contato",
			description: "Hero, canais diretos e caminhos públicos da página de contato.",
			countLabel: "Página institucional",
			statusLabel: contact?.published ? "Publicado" : "Rascunho",
			href: "/admin/editorial/contact",
			icon: Mail,
		},
		{
			title: "Home",
			description: "Hero, manifesto, autora e CTA final da página inicial.",
			countLabel: "Blocos institucionais",
			statusLabel: home?.published ? "Publicado" : "Rascunho",
			href: "/admin/editorial/home",
			icon: House,
		},
	];

	const publishedCount = sections.filter((section) => /Publicado/.test(section.statusLabel)).length;

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Editorial"
				title="Editorial"
				description="Gerencie páginas, agenda e conteúdo institucional."
			/>
			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat
					label="Superfícies"
					value={sections.length}
					helper="Home, páginas institucionais e coleções editoriais."
				/>
				<AdminEditorialStat
					label="Publicadas"
					value={publishedCount}
					helper="Entradas com publicação ativa no storefront."
				/>
				<AdminEditorialStat
					label="Coleções dinâmicas"
					value={events.length + projects.length}
					helper="Itens distribuídos entre eventos e projetos."
				/>
			</div>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{sections.map((section) => {
					const Icon = section.icon;
					return (
						<EditorialPanel key={section.href} className="flex h-full flex-col p-0">
							<Card className="flex h-full flex-col border-none bg-transparent shadow-none">
								<CardHeader className="space-y-3">
									<div className="inline-flex h-10 w-10 items-center justify-center border border-[color:var(--editorial-border)] bg-[#fbf7f1]">
										<Icon className="h-5 w-5" />
									</div>
									<div className="space-y-1">
										<CardTitle className="editorial-serif text-2xl font-semibold">{section.title}</CardTitle>
										<CardDescription className="text-sm leading-6 text-[color:var(--editorial-muted)]">
											{section.description}
										</CardDescription>
									</div>
								</CardHeader>
								<CardContent className="mt-auto space-y-4">
									<div className="space-y-1 text-sm text-[color:var(--editorial-muted)]">
										<p>{section.countLabel}</p>
										<p>{section.statusLabel}</p>
									</div>
									<Button
										asChild
										className="w-full rounded-none bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)] hover:bg-[color:var(--editorial-accent)]"
									>
										<Link href={section.href}>Abrir seção</Link>
									</Button>
								</CardContent>
							</Card>
						</EditorialPanel>
					);
				})}
			</div>
		</AdminEditorialPage>
	);
}
