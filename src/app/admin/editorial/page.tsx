import {
	BookOpen,
	CalendarDays,
	Globe2,
	House,
	ImageIcon,
	Info,
	Mail,
	NotebookText,
	Type,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import {
	getEditorialAboutRecord,
	getEditorialContactRecord,
	getEditorialSarauRecord,
} from "@/app/admin/editorial/actions";
import {
	getEditorialEventsPageCopyRecord,
	getEditorialHomeCopyRecord,
	getEditorialProductPageCopyRecord,
	getEditorialProductsPageCopyRecord,
	getEditorialProjectsPageCopyRecord,
	getEditorialSiteGlobalCopyRecord,
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

type EditorialSectionGroup =
	| "Conteúdo institucional"
	| "Programação e projetos"
	| "Conteúdo global"
	| "Operação comercial";

type EditorialSection = {
	title: string;
	href: string;
	description: string;
	group: EditorialSectionGroup;
	tools: string[];
	icon: ComponentType<{ className?: string }>;
};

const sections: EditorialSection[] = [
	{
		title: "Página inicial",
		href: "/admin/editorial/home",
		description: "Hero, manifesto, imagem de apoio, produto, catálogo e programação.",
		group: "Conteúdo institucional",
		tools: ["Texto", "Imagem", "Fundo"],
		icon: House,
	},
	{
		title: "Vitrine de produtos",
		href: "/admin/editorial/products",
		description: "Texto de abertura, nota curatorial e continuidade da página de produtos.",
		group: "Operação comercial",
		tools: ["Texto", "Publicação"],
		icon: BookOpen,
	},
	{
		title: "Página do produto",
		href: "/admin/editorial/pagina-do-produto",
		description: "Textos estruturais globais da página pública de produto.",
		group: "Operação comercial",
		tools: ["Texto", "CTAs"],
		icon: Info,
	},
	{
		title: "Sobre",
		href: "/admin/editorial/about",
		description: "Manifesto, autoria, imagem e pilares editoriais.",
		group: "Conteúdo institucional",
		tools: ["Texto", "Imagem"],
		icon: Info,
	},
	{
		title: "Contato",
		href: "/admin/editorial/contact",
		description: "Hero, formulário, canais e caminhos comuns.",
		group: "Conteúdo institucional",
		tools: ["Texto", "CTAs"],
		icon: Mail,
	},
	{
		title: "Sarau Safado",
		href: "/admin/editorial/sarau-safado",
		description: "Texto, imagem de fundo do hero, agenda e memória do programa.",
		group: "Conteúdo institucional",
		tools: ["Texto", "Imagem", "Fundo"],
		icon: CalendarDays,
	},
	{
		title: "Eventos",
		href: "/admin/editorial/events",
		description: "Textos da rota /events e itens da agenda publicada.",
		group: "Programação e projetos",
		tools: ["Texto", "Imagem"],
		icon: CalendarDays,
	},
	{
		title: "Projetos",
		href: "/admin/editorial/projects",
		description: "Textos da rota /projects e itens do portfólio cultural.",
		group: "Programação e projetos",
		tools: ["Texto", "Imagem"],
		icon: NotebookText,
	},
	{
		title: "Newsletter e rodapé",
		href: "/admin/editorial/global",
		description: "Conteúdo global público editável em todas as páginas.",
		group: "Conteúdo global",
		tools: ["Texto", "Links"],
		icon: Globe2,
	},
];

const sectionGroups: EditorialSectionGroup[] = [
	"Conteúdo institucional",
	"Programação e projetos",
	"Conteúdo global",
	"Operação comercial",
];

function getGroupDescription(group: EditorialSectionGroup) {
	if (group === "Conteúdo institucional") {
		return "Páginas que apresentam o selo, seus canais e seus programas públicos.";
	}

	if (group === "Programação e projetos") {
		return "Agenda, memória e iniciativas culturais com itens publicados no site.";
	}

	if (group === "Conteúdo global") {
		return "Newsletter e rodapé compartilhados pelas páginas públicas.";
	}

	return "Copy que apoia a vitrine e a página de produto; a operação comercial fica no catálogo.";
}

export default async function AdminEditorialIndexPage() {
	const session = await auth();
	if (!session || !hasCapability(session.user.role, "editorial.write")) return null;

	const [
		events,
		projects,
		home,
		eventsPage,
		projectsPage,
		productsPage,
		productPage,
		globalPage,
		aboutPage,
		contactPage,
		sarauPage,
	] = await Promise.all([
		listEditorialRecordsForAdmin("event"),
		listEditorialRecordsForAdmin("project"),
		getEditorialHomeCopyRecord(),
		getEditorialEventsPageCopyRecord(),
		getEditorialProjectsPageCopyRecord(),
		getEditorialProductsPageCopyRecord(),
		getEditorialProductPageCopyRecord(),
		getEditorialSiteGlobalCopyRecord(),
		getEditorialAboutRecord(),
		getEditorialContactRecord(),
		getEditorialSarauRecord(),
	]);

	const publishedStaticPages = [
		home,
		eventsPage,
		projectsPage,
		productsPage,
		productPage,
		globalPage,
		aboutPage,
		contactPage,
		sarauPage,
	].filter((item) => item?.published).length;

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Editorial"
				title="Centro editorial público"
				description="Escolha o domínio que deseja editar: conteúdo institucional, programação cultural, blocos globais ou operação comercial."
			/>
			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat label="Eventos" value={events.length} helper="Itens da agenda pública." />
				<AdminEditorialStat label="Projetos" value={projects.length} helper="Itens do portfólio cultural." />
				<AdminEditorialStat
					label="Páginas editáveis"
					value={publishedStaticPages}
					helper="Páginas institucionais e culturais publicadas."
				/>
			</div>

			<EditorialPanel className="grid gap-4 p-6 lg:grid-cols-3">
				<div className="flex items-start gap-3">
					<Type className="mt-1 h-5 w-5 text-[color:var(--editorial-accent)]" />
					<div>
						<h2 className="text-base font-semibold text-[color:var(--editorial-ink)]">Texto</h2>
						<p className="mt-1 text-sm leading-6 text-[color:var(--editorial-muted)]">
							Títulos, chamadas, textos longos e CTAs ficam dentro da página ou coleção correspondente.
						</p>
					</div>
				</div>
				<div className="flex items-start gap-3">
					<ImageIcon className="mt-1 h-5 w-5 text-[color:var(--editorial-accent)]" />
					<div>
						<h2 className="text-base font-semibold text-[color:var(--editorial-ink)]">Imagem e fundo</h2>
						<p className="mt-1 text-sm leading-6 text-[color:var(--editorial-muted)]">
							Imagens e fundos aparecem no mesmo bloco visual que eles alteram, sempre com revisão antes de
							salvar.
						</p>
					</div>
				</div>
				<div className="flex items-start gap-3">
					<Globe2 className="mt-1 h-5 w-5 text-[color:var(--editorial-accent)]" />
					<div>
						<h2 className="text-base font-semibold text-[color:var(--editorial-ink)]">Publicação</h2>
						<p className="mt-1 text-sm leading-6 text-[color:var(--editorial-muted)]">
							O status Publicado ou Rascunho continua controlando quando a versão salva aparece no site.
						</p>
					</div>
				</div>
			</EditorialPanel>

			<div className="space-y-8">
				{sectionGroups.map((group) => (
					<section key={group} className="space-y-4">
						<div>
							<h2 className="text-xl font-semibold text-[color:var(--editorial-ink)]">{group}</h2>
							<p className="mt-1 text-sm leading-6 text-[color:var(--editorial-muted)]">
								{getGroupDescription(group)}
							</p>
						</div>
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							{sections
								.filter((section) => section.group === group)
								.map(({ icon: Icon, ...section }) => (
									<EditorialPanel key={section.href} className="flex h-full flex-col p-6">
										<div className="inline-flex h-10 w-10 items-center justify-center border border-[color:var(--editorial-border)] bg-[#fbf7f1]">
											<Icon className="h-5 w-5" />
										</div>
										<h3 className="mt-4 text-xl font-semibold text-[color:var(--editorial-ink)]">
											{section.title}
										</h3>
										<p className="mt-2 text-sm leading-6 text-[color:var(--editorial-muted)]">
											{section.description}
										</p>
										<div className="mt-4 flex flex-wrap gap-2">
											{section.tools.map((tool) => (
												<span
													key={tool}
													className="border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--editorial-muted)]"
												>
													{tool}
												</span>
											))}
										</div>
										<Link
											href={section.href}
											className="mt-6 inline-flex min-h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-paper)]"
										>
											Editar
										</Link>
									</EditorialPanel>
								))}
						</div>
					</section>
				))}
			</div>
		</AdminEditorialPage>
	);
}
