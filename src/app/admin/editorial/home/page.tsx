import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditorialHomeForm } from "@/app/admin/editorial/_components/editorial-home-form";
import { EditorialMetaCard } from "@/app/admin/editorial/_components/editorial-meta-card";
import { getEditorialHomeRecord, updateEditorialHomeAction } from "@/app/admin/editorial/actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
} from "@/ui/editorial/editorial-primitives";

export const dynamic = "force-dynamic";

export default async function AdminEditorialHomePage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "editorial.write")) redirect("/forbidden");

	const page = await getEditorialHomeRecord();
	if (!page) redirect("/admin/editorial");

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Editorial"
				title="Página inicial"
				description="Edite os blocos institucionais principais da página inicial sem misturar esse fluxo com catálogo, eventos ou projetos."
				actions={
					<div className="flex flex-wrap gap-3">
						<Link
							href="/admin/editorial"
							className="inline-flex items-center gap-2 border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3 text-sm text-[color:var(--editorial-muted)] transition-colors hover:text-[color:var(--editorial-ink)]"
						>
							<ArrowLeft className="h-4 w-4" />
							Voltar para editorial
						</Link>
					</div>
				}
			/>

			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat
					label="Publicação"
					value={page.published ? "Publicado" : "Rascunho"}
					helper="Estado atual da página inicial institucional."
				/>
				<AdminEditorialStat
					label="Ordem"
					value={page.order ?? 1}
					helper="Prioridade editorial desta superfície."
				/>
				<AdminEditorialStat
					label="Blocos"
					value="Página inicial"
					helper="Hero, manifesto, autora, comunidade e CTA final."
				/>
			</div>
			<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
				<EditorialHomeForm action={updateEditorialHomeAction} page={page} submitLabel="Salvar página" />
				<EditorialMetaCard
					published={page.published}
					order={page.order}
					updatedAt={page.updatedAt}
					updatedBy={page.updatedBy}
				/>
			</div>
		</AdminEditorialPage>
	);
}
