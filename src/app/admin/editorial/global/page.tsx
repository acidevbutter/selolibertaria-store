import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EditorialPageCopyForm } from "@/app/admin/editorial/_components/editorial-page-copy-form";
import {
	getEditorialSiteGlobalCopyRecord,
	updateEditorialSiteGlobalCopyAction,
} from "@/app/admin/editorial/page-content-actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
} from "@/ui/editorial/editorial-primitives";

export default async function AdminEditorialGlobalPage() {
	const session = await auth();
	if (!session || !hasCapability(session.user.role, "editorial.write")) return null;
	const page = await getEditorialSiteGlobalCopyRecord();
	if (!page) return null;

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Editorial"
				title="Newsletter e rodapé"
				description="Conteúdo global público editável, sem depender de `messages/pt-BR.json`."
				actions={
					<Link
						href="/admin/editorial"
						className="inline-flex items-center gap-2 border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3 text-sm text-[color:var(--editorial-muted)] transition-colors hover:text-[color:var(--editorial-ink)]"
					>
						<ArrowLeft className="h-4 w-4" />
						Voltar para editorial
					</Link>
				}
			/>
			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat
					label="Status"
					value={page.published ? "Publicado" : "Rascunho"}
					helper="Footer e newsletter públicos."
				/>
				<AdminEditorialStat label="Escopo" value="Global" helper="Aparece em todas as páginas públicas." />
				<AdminEditorialStat label="Blocos" value="2" helper="Newsletter e rodapé." />
			</div>
			<EditorialPageCopyForm
				action={updateEditorialSiteGlobalCopyAction}
				submitLabel="Salvar conteúdo global público"
				base={{ title: page.title, summary: page.summary, order: page.order, published: page.published }}
				sections={[
					{
						title: "Newsletter",
						description: "Chamada curta acima do campo de email.",
						route: "todas as páginas públicas",
						fields: [
							{ name: "newsletterTitle", label: "Título", defaultValue: page.newsletter?.title },
							{
								name: "newsletterDescription",
								label: "Texto",
								type: "textarea",
								rows: 3,
								defaultValue: page.newsletter?.description,
							},
							{
								name: "newsletterPlaceholder",
								label: "Placeholder do campo",
								defaultValue: page.newsletter?.placeholder,
							},
							{ name: "newsletterButtonLabel", label: "Botão", defaultValue: page.newsletter?.buttonLabel },
						],
					},
					{
						title: "Rodapé",
						description: "Texto institucional e links auxiliares.",
						route: "todas as páginas públicas",
						fields: [
							{
								name: "footerBrandEyebrow",
								label: "Linha curta da marca",
								defaultValue: page.footer?.brandEyebrow,
							},
							{
								name: "footerBrandDescription",
								label: "Descrição da marca",
								type: "textarea",
								rows: 3,
								defaultValue: page.footer?.brandDescription,
							},
							{
								name: "footerCatalogueTitle",
								label: "Título da coluna Livros",
								defaultValue: page.footer?.catalogueTitle,
							},
							{
								name: "footerEditorialTitle",
								label: "Título da coluna Editorial",
								defaultValue: page.footer?.editorialTitle,
							},
							{
								name: "footerSupportTitle",
								label: "Título da coluna Suporte",
								defaultValue: page.footer?.supportTitle,
							},
							{
								name: "footerAuxLink1Label",
								label: "Link 1",
								defaultValue: page.footer?.auxiliaryLinks?.[0]?.label,
							},
							{
								name: "footerAuxLink1Href",
								label: "Destino do link 1",
								defaultValue: page.footer?.auxiliaryLinks?.[0]?.href,
							},
							{
								name: "footerAuxLink2Label",
								label: "Link 2",
								defaultValue: page.footer?.auxiliaryLinks?.[1]?.label,
							},
							{
								name: "footerAuxLink2Href",
								label: "Destino do link 2",
								defaultValue: page.footer?.auxiliaryLinks?.[1]?.href,
							},
							{
								name: "footerAuxLink3Label",
								label: "Link 3",
								defaultValue: page.footer?.auxiliaryLinks?.[2]?.label,
							},
							{
								name: "footerAuxLink3Href",
								label: "Destino do link 3",
								defaultValue: page.footer?.auxiliaryLinks?.[2]?.href,
							},
							{
								name: "footerAuxLink4Label",
								label: "Link 4",
								defaultValue: page.footer?.auxiliaryLinks?.[3]?.label,
							},
							{
								name: "footerAuxLink4Href",
								label: "Destino do link 4",
								defaultValue: page.footer?.auxiliaryLinks?.[3]?.href,
							},
							{
								name: "footerCopyrightText",
								label: "Texto de copyright",
								defaultValue: page.footer?.copyrightText,
							},
						],
					},
				]}
			/>
		</AdminEditorialPage>
	);
}
