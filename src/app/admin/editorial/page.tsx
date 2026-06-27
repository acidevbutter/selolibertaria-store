import Link from "next/link";
import { BookOpen, CalendarDays, Globe2, House, Info, Mail, NotebookText } from "lucide-react";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { listEditorialRecordsForAdmin } from "@/lib/editorial-content-store";
import {
	getEditorialEventsPageCopyRecord,
	getEditorialHomeCopyRecord,
	getEditorialProductPageCopyRecord,
	getEditorialProductsPageCopyRecord,
	getEditorialProjectsPageCopyRecord,
	getEditorialSiteGlobalCopyRecord,
} from "@/app/admin/editorial/page-content-actions";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";

const sections = [
	{ title: "Página inicial", href: "/admin/editorial/home", description: "Hero, manifesto, livro, catálogo e programação.", icon: House },
	{ title: "Eventos", href: "/admin/editorial/events", description: "Textos da rota /events e agenda publicada.", icon: CalendarDays },
	{ title: "Projetos", href: "/admin/editorial/projects", description: "Textos da rota /projects e portfólio cultural.", icon: NotebookText },
	{ title: "Livros", href: "/admin/editorial/products", description: "Hero, nota curatorial e continuidade da vitrine.", icon: BookOpen },
	{ title: "Página do livro", href: "/admin/editorial/pagina-do-livro", description: "Textos estruturais globais da PDP.", icon: Info },
	{ title: "Newsletter e rodapé", href: "/admin/editorial/global", description: "Conteúdo global público editável.", icon: Globe2 },
	{ title: "Sobre", href: "/admin/editorial/about", description: "Manifesto, autoria e pilares editoriais.", icon: Info },
	{ title: "Contato", href: "/admin/editorial/contact", description: "Hero, formulário, canais e caminhos comuns.", icon: Mail },
	{ title: "Sarau Safado", href: "/admin/editorial/sarau-safado", description: "Agenda, memória e continuidade do programa.", icon: CalendarDays },
];

export default async function AdminEditorialIndexPage() {
	const session = await auth();
	if (!session || !hasCapability(session.user.role, "editorial.write")) return null;

	const [events, projects, home, eventsPage, projectsPage, productsPage, productPage, globalPage] = await Promise.all([
		listEditorialRecordsForAdmin("event"),
		listEditorialRecordsForAdmin("project"),
		getEditorialHomeCopyRecord(),
		getEditorialEventsPageCopyRecord(),
		getEditorialProjectsPageCopyRecord(),
		getEditorialProductsPageCopyRecord(),
		getEditorialProductPageCopyRecord(),
		getEditorialSiteGlobalCopyRecord(),
	]);

	const publishedStaticPages = [
		home,
		eventsPage,
		projectsPage,
		productsPage,
		productPage,
		globalPage,
	].filter((item) => item?.published).length;

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Editorial"
				title="Centro editorial público"
				description="O admin editorial passa a ser a fonte principal da copy pública em pt-BR."
			/>

			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat label="Eventos" value={events.length} helper="Itens da agenda pública." />
				<AdminEditorialStat label="Projetos" value={projects.length} helper="Itens do portfólio cultural." />
				<AdminEditorialStat label="Páginas editáveis" value={publishedStaticPages} helper="Páginas públicas estruturais publicadas." />
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{sections.map(({ icon: Icon, ...section }) => (
					<EditorialPanel key={section.href} className="flex h-full flex-col p-6">
						<div className="inline-flex h-10 w-10 items-center justify-center border border-[color:var(--editorial-border)] bg-[#fbf7f1]">
							<Icon className="h-5 w-5" />
						</div>
						<h2 className="mt-4 text-xl font-semibold text-[color:var(--editorial-ink)]">{section.title}</h2>
						<p className="mt-2 text-sm leading-6 text-[color:var(--editorial-muted)]">{section.description}</p>
						<Link
							href={section.href}
							className="mt-6 inline-flex min-h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-paper)]"
						>
							Abrir
						</Link>
					</EditorialPanel>
				))}
			</div>
		</AdminEditorialPage>
	);
}
