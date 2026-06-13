import { BookOpen, CalendarRange, FolderKanban, House, Info, Mail } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
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

	return (
		<main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold">Editorial</h1>
				<p className="text-sm text-muted-foreground">
					Hub operacional do conteúdo institucional do Selo Libertária.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{sections.map((section) => {
					const Icon = section.icon;
					return (
						<Card key={section.href} className="flex flex-col">
							<CardHeader className="space-y-3">
								<div className="inline-flex h-10 w-10 items-center justify-center rounded-full border">
									<Icon className="h-5 w-5" />
								</div>
								<div className="space-y-1">
									<CardTitle>{section.title}</CardTitle>
									<CardDescription>{section.description}</CardDescription>
								</div>
							</CardHeader>
							<CardContent className="mt-auto space-y-4">
								<div className="space-y-1 text-sm text-muted-foreground">
									<p>{section.countLabel}</p>
									<p>{section.statusLabel}</p>
								</div>
								<Button asChild className="w-full">
									<Link href={section.href}>Abrir seção</Link>
								</Button>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</main>
	);
}
