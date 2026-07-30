import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditorialAboutForm } from "@/app/admin/editorial/_components/editorial-about-form";
import { EditorialMetaCard } from "@/app/admin/editorial/_components/editorial-meta-card";
import { EditorialPagePreview } from "@/app/admin/editorial/_components/editorial-page-preview.client";
import { getEditorialAboutRecord, updateEditorialAboutAction } from "@/app/admin/editorial/actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
} from "@/ui/editorial/editorial-primitives";

export const dynamic = "force-dynamic";

export default async function AdminEditorialAboutPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "editorial.write")) redirect("/forbidden");

	const page = await getEditorialAboutRecord();
	if (!page) redirect("/admin/editorial");

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Editorial"
				title="Sobre"
				description="Edite a narrativa principal do selo e os blocos da página de apresentação."
				actions={
					<div className="flex flex-wrap gap-3">
						<EditorialPagePreview href="/about" published={page.published} />
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
					helper="Estado atual no site."
				/>
				<AdminEditorialStat label="Ordem" value={page.order ?? 1} helper="Prioridade desta página." />
				<AdminEditorialStat
					label="Blocos"
					value="Contexto"
					helper="Abertura, seção principal, cards e fechamento."
				/>
			</div>
			<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
				<EditorialAboutForm
					action={updateEditorialAboutAction}
					page={page}
					submitLabel="Salvar página sobre"
				/>
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
