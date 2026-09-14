import Link from "next/link";
import { EditorialBlocksEditor } from "@/app/admin/editorial/_components/editorial-blocks-editor.client";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import type { EditorialContentDoc } from "@/lib/editorial-blocks";

export const dynamic = "force-dynamic";

/**
 * Editor de blocos (fatia 05.3–05.4, canvas 4c). The column is 780px — the same
 * measure as the published page, so "ver como fica" is faithful.
 *
 * Draft/publish persistence is the contract in §9 (PUT …/draft, POST …/publish,
 * POST …/revert) and is not wired yet: the document is serialized into the form
 * field below, ready for the endpoint.
 */
const SEED_DOC: EditorialContentDoc = [
	{ id: "b1", type: "heading", level: 2, text: "Sarau Safado #14" },
	{
		id: "b2",
		type: "paragraph",
		text: "Uma noite de leitura aberta no Centro, com microfone livre depois da meia-noite.",
	},
];

export default async function AdminEditorialBlocksPage() {
	const session = await auth();
	if (!session || !hasCapability(session.user.role, "editorial.write")) return null;

	return (
		<>
			<nav className="ad-crumb">
				<Link href="/admin/editorial">Páginas</Link>
				<span className="ad-crumb-sep">›</span>
				<b>Editor de blocos</b>
			</nav>

			<div className="ad-head">
				<h1>Editor de blocos</h1>
				<span className="ad-badge ad-b-dra">Rascunho</span>
				<span className="ad-meta">onze tipos · desfazer em 10 passos</span>
			</div>

			<EditorialBlocksEditor name="draftDoc" initialDoc={SEED_DOC} />
		</>
	);
}
