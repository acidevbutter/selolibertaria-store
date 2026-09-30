import Link from "next/link";
import { redirect } from "next/navigation";
import { EditorialBlocksEditor } from "@/app/admin/editorial/_components/editorial-blocks-editor.client";
import { type EditorialPageType, loadEditorialBlocksRecord } from "@/app/admin/editorial/blocks-actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { convertLegacyEditorialContentToBlocks } from "@/lib/editorial-blocks-migrate";

export const dynamic = "force-dynamic";

/**
 * The nine pages the "Páginas" list manages, mapped to the (type, slug) pair
 * their record already lives under — same values the old per-field forms use
 * (`page-content-actions.ts`/`actions.ts`), so the block editor reads/writes
 * the very same row instead of a separate copy.
 */
const PAGE_BY_SLUG: Record<string, { type: EditorialPageType; label: string }> = {
	home: { type: "page_home", label: "Home" },
	products: { type: "page_products", label: "Loja" },
	product: { type: "page_product", label: "Página do produto" },
	events: { type: "page_events", label: "Eventos" },
	projects: { type: "page_projects", label: "Projetos" },
	about: { type: "page_about", label: "Sobre" },
	contact: { type: "page_contact", label: "Contato" },
	"sarau-safado": { type: "page_sarau", label: "Sarau Safado" },
	"public-global": { type: "site_global", label: "Newsletter e rodapé" },
};

export default async function AdminEditorialBlocksPage({ params }: { params: Promise<{ slug: string }> }) {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "editorial.write")) redirect("/forbidden");

	const { slug: rawSlug } = await params;
	const slug = decodeURIComponent(rawSlug);
	const page = PAGE_BY_SLUG[slug];
	if (!page) redirect("/admin/editorial");

	const load = await loadEditorialBlocksRecord(page.type, slug);

	// A refusal/outage is not "nothing saved yet": opening an empty editor here would let the
	// owner save an empty document over content that is only unreachable, not gone.
	if (load.status === "error") {
		return (
			<>
				<nav className="ad-crumb">
					<Link href="/admin/editorial">Páginas</Link>
					<span className="ad-crumb-sep">›</span>
					<b>{page.label}</b>
				</nav>
				<div className="ad-head">
					<h1>{page.label}</h1>
				</div>
				<div
					role="alert"
					className="ad-panel"
					style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}
				>
					<b>Não foi possível carregar esta página.</b>
					<p style={{ margin: 0, lineHeight: 1.6 }}>{load.message}</p>
					<p className="ad-doc-cap" style={{ margin: 0 }}>
						Seu conteúdo salvo continua no servidor{load.httpStatus ? ` (código ${load.httpStatus})` : ""}.
						Nenhuma edição foi aberta para não sobrescrever o que já existe.
					</p>
					<div>
						<Link className="ad-btn ad-ink" href={`/admin/editorial/blocos/${encodeURIComponent(slug)}`}>
							Tentar de novo
						</Link>
					</div>
				</div>
			</>
		);
	}

	const record = load.status === "ok" ? load.record : null;
	const initialDoc =
		record?.draftDoc ?? record?.publishedDoc ?? convertLegacyEditorialContentToBlocks(record?.content);
	const published = Boolean(record?.publishedDoc);

	return (
		<>
			<nav className="ad-crumb">
				<Link href="/admin/editorial">Páginas</Link>
				<span className="ad-crumb-sep">›</span>
				<b>{page.label}</b>
			</nav>

			<div className="ad-head">
				<h1>{page.label}</h1>
				<span className={`ad-badge ${published ? "ad-b-pub" : "ad-b-dra"}`}>
					{published ? "Publicado" : "Rascunho"}
				</span>
				<span className="ad-meta">onze tipos · desfazer em 10 passos</span>
			</div>

			<EditorialBlocksEditor
				name="draftDoc"
				initialDoc={initialDoc}
				contentType={page.type}
				slug={slug}
				initialPublishedAt={record?.publishedAt ?? null}
				initialPublishedDoc={record?.publishedDoc ?? null}
			/>
		</>
	);
}
