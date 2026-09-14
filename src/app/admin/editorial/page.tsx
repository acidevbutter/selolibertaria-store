import Link from "next/link";
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

export const dynamic = "force-dynamic";

type PageRecord = { published?: boolean; updatedAt?: string | null } | null;

type PageRow = {
	title: string;
	href: string;
	record: PageRecord;
};

/** Data in mono, tabular: "12 set 14:32". Never a library date format. */
function editedAt(record: PageRecord) {
	if (!record?.updatedAt) return "—";
	const date = new Date(record.updatedAt);
	if (Number.isNaN(date.getTime())) return "—";
	return new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	})
		.format(date)
		.replace(".", "");
}

export default async function AdminEditorialIndexPage() {
	const session = await auth();
	if (!session || !hasCapability(session.user.role, "editorial.write")) return null;

	const [home, eventsPage, projectsPage, productsPage, productPage, globalPage, about, contact, sarau] =
		await Promise.all([
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

	const rows: PageRow[] = [
		{ title: "Home", href: "/admin/editorial/home", record: home },
		{ title: "Loja", href: "/admin/editorial/products", record: productsPage },
		{ title: "Página do produto", href: "/admin/editorial/pagina-do-produto", record: productPage },
		{ title: "Eventos", href: "/admin/editorial/events", record: eventsPage },
		{ title: "Projetos", href: "/admin/editorial/projects", record: projectsPage },
		{ title: "Sobre", href: "/admin/editorial/about", record: about },
		{ title: "Contato", href: "/admin/editorial/contact", record: contact },
		{ title: "Sarau Safado", href: "/admin/editorial/sarau-safado", record: sarau },
		{ title: "Newsletter e rodapé", href: "/admin/editorial/global", record: globalPage },
	];

	const drafts = rows.filter((row) => !row.record?.published).length;

	return (
		<>
			<div className="ad-head">
				<h1>Páginas</h1>
				<span className="ad-meta">
					{rows.length} páginas · {drafts} rascunhos
				</span>
				<div className="ad-acts">
					<Link className="ad-btn ad-sec" href="/">
						Ver o site
					</Link>
					<Link className="ad-btn ad-pri" href="/admin/editorial/blocos">
						Editor de blocos
					</Link>
				</div>
			</div>

			<div className="ad-panel">
				<div className="ad-filters">
					<span className="ad-chip on">Todas</span>
					<span
						className="ad-mono"
						style={{ marginLeft: "auto", fontSize: 12, color: "var(--ad-text-soft)" }}
					>
						ordenado por última edição
					</span>
				</div>
				{rows.map((row) => (
					<Link key={row.href} className="ad-row" href={row.href}>
						<span className="ad-t">{row.title}</span>
						<span className={`ad-badge ${row.record?.published ? "ad-b-pub" : "ad-b-dra"}`}>
							{row.record?.published ? "Publicado" : "Rascunho"}
						</span>
						<span className="ad-d">{editedAt(row.record)}</span>
					</Link>
				))}
			</div>
		</>
	);
}
