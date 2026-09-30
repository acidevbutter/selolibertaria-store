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
import { probeEditorialBackend } from "@/lib/editorial-admin-api";

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

	const [
		probe,
		home,
		eventsPage,
		projectsPage,
		productsPage,
		productPage,
		globalPage,
		about,
		contact,
		sarau,
	] = await Promise.all([
		probeEditorialBackend(),
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
		{ title: "Home", href: "/admin/editorial/blocos/home", record: home },
		{ title: "Loja", href: "/admin/editorial/blocos/products", record: productsPage },
		{ title: "Página do produto", href: "/admin/editorial/blocos/product", record: productPage },
		{ title: "Eventos", href: "/admin/editorial/blocos/events", record: eventsPage },
		{ title: "Projetos", href: "/admin/editorial/blocos/projects", record: projectsPage },
		{ title: "Sobre", href: "/admin/editorial/blocos/about", record: about },
		{ title: "Contato", href: "/admin/editorial/blocos/contact", record: contact },
		{ title: "Sarau Safado", href: "/admin/editorial/blocos/sarau-safado", record: sarau },
		{ title: "Newsletter e rodapé", href: "/admin/editorial/blocos/public-global", record: globalPage },
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
				</div>
			</div>

			{probe.ok ? null : (
				<div
					role="alert"
					className="ad-panel"
					style={{
						padding: 16,
						marginBottom: 16,
						borderColor: "var(--ad-wine-line)",
						color: "var(--ad-wine)",
					}}
				>
					<b>O servidor do conteúdo não respondeu como esperado.</b>
					<p style={{ margin: "6px 0 0", lineHeight: 1.6 }}>
						{probe.message} Enquanto isso, o status abaixo pode estar incorreto.
					</p>
				</div>
			)}

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
