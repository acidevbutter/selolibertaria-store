import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditorialContactForm } from "@/app/admin/editorial/_components/editorial-contact-form";
import { EditorialMetaCard } from "@/app/admin/editorial/_components/editorial-meta-card";
import { EditorialPagePreview } from "@/app/admin/editorial/_components/editorial-page-preview.client";
import { getEditorialContactRecord, updateEditorialContactAction } from "@/app/admin/editorial/actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
} from "@/ui/editorial/editorial-primitives";

export const dynamic = "force-dynamic";

export default async function AdminEditorialContactPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "editorial.write")) redirect("/forbidden");

	const page = await getEditorialContactRecord();
	if (!page) redirect("/admin/editorial");

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Editorial"
				title="Contato"
				description="Edite abertura, canais diretos e caminhos públicos da página de contato."
				actions={
					<div className="flex flex-wrap gap-3">
						<EditorialPagePreview
							href="/contact"
							published={page.published}
							formId="editorial-contact-form"
							pageTitle="Contato"
						/>
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
					value="Canais"
					helper="Abertura, formulário, caminhos diretos e links públicos."
				/>
			</div>
			<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
				<EditorialContactForm
					action={updateEditorialContactAction}
					page={page}
					submitLabel="Salvar página de contato"
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
