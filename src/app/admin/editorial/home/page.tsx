import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EditorialPageCopyForm } from "@/app/admin/editorial/_components/editorial-page-copy-form";
import { EditorialPagePreview } from "@/app/admin/editorial/_components/editorial-page-preview.client";
import {
	getEditorialHomeCopyRecord,
	updateEditorialHomeCopyAction,
} from "@/app/admin/editorial/page-content-actions";
import { listAdminProductGroups } from "@/lib/admin-products";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
} from "@/ui/editorial/editorial-primitives";

export default async function AdminEditorialHomePage() {
	const session = await auth();
	if (!session) {
		return null;
	}
	if (!hasCapability(session.user.role, "editorial.write")) {
		return null;
	}

	const [page, products] = await Promise.all([getEditorialHomeCopyRecord(), listAdminProductGroups()]);
	if (!page) {
		return null;
	}

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Editorial"
				title="Página inicial"
				description="Texto público principal da Home. Organize a copy pelos mesmos blocos que aparecem na página."
				actions={
					<>
						<EditorialPagePreview href="/" published={page.published} />
						<Link
							href="/admin/editorial"
							className="inline-flex items-center gap-2 border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3 text-sm text-[color:var(--editorial-muted)] transition-colors hover:text-[color:var(--editorial-ink)]"
						>
							<ArrowLeft className="h-4 w-4" />
							Voltar para editorial
						</Link>
					</>
				}
			/>

			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat
					label="Status"
					value={page.published ? "Publicado" : "Rascunho"}
					helper="Página inicial pública."
				/>
				<AdminEditorialStat
					label="Blocos"
					value="5"
					helper="Abertura, manifesto, produto, catálogo e programação."
				/>
				<AdminEditorialStat label="Rota" value="/" helper="Onde esta copy aparece." />
			</div>

			<EditorialPageCopyForm
				action={updateEditorialHomeCopyAction}
				submitLabel="Salvar página inicial"
				base={{ published: page.published }}
				sections={[
					{
						title: "Chamada principal",
						description:
							"Bloco de abertura da Home. Escolha um livro publicado ou mantenha a composição personalizada.",
						route: "/",
						tools: ["Texto", "botão", "Fundo"],
						fields: [
							{
								name: "heroMode",
								label: "Modo do hero",
								type: "radio",
								defaultValue: page.hero?.mode ?? "custom",
								options: [
									{ value: "custom", label: "Personalizado" },
									{ value: "product", label: "Livro em destaque" },
								],
								help: "No modo livro, capa, título, resumo e CTA vêm do catálogo publicado.",
							},
							{
								name: "heroProductSlug",
								label: "Livro em destaque",
								type: "select",
								defaultValue: page.hero?.productSlug,
								options: products
									.filter((product) => product.active)
									.map((product) => ({
										value: product.slug,
										label: product.name,
									})),
								visibleWhen: { name: "heroMode", value: "product" },
							},
							{
								name: "heroEyebrow",
								label: "Linha curta",
								defaultValue: page.hero?.eyebrow,
								visibleWhen: { name: "heroMode", value: "custom" },
							},
							{
								name: "heroTitle",
								label: "Título",
								defaultValue: page.hero?.title,
								visibleWhen: { name: "heroMode", value: "custom" },
							},
							{
								name: "heroDescription",
								label: "Texto",
								type: "textarea",
								rows: 4,
								defaultValue: page.hero?.description,
								visibleWhen: { name: "heroMode", value: "custom" },
							},
							{
								name: "heroPrimaryCtaLabel",
								label: "Botão principal",
								defaultValue: page.hero?.primaryCtaLabel,
								visibleWhen: { name: "heroMode", value: "custom" },
							},
							{
								name: "heroPrimaryCtaHref",
								label: "Destino do botão principal",
								defaultValue: page.hero?.primaryCtaHref,
								visibleWhen: { name: "heroMode", value: "custom" },
							},
							{
								name: "heroSecondaryCtaLabel",
								label: "Botão secundário",
								defaultValue: page.hero?.secondaryCtaLabel,
								visibleWhen: { name: "heroMode", value: "custom" },
							},
							{
								name: "heroSecondaryCtaHref",
								label: "Destino do botão secundário",
								defaultValue: page.hero?.secondaryCtaHref,
								visibleWhen: { name: "heroMode", value: "custom" },
							},
							{
								name: "heroSupportingLine",
								label: "Linha de apoio",
								defaultValue: page.hero?.supportingLine,
								visibleWhen: { name: "heroMode", value: "custom" },
							},
							{
								name: "heroFeatureEyebrow",
								label: "Linha do destaque",
								defaultValue: page.hero?.featureEyebrow,
								visibleWhen: { name: "heroMode", value: "custom" },
							},
							{
								name: "heroFeatureQuote",
								label: "Frase de apoio",
								defaultValue: page.hero?.featureQuote,
								visibleWhen: { name: "heroMode", value: "custom" },
							},
							{
								name: "heroBackground",
								label: "Imagem de fundo da abertura",
								type: "background",
								background: page.hero?.background,
								visibleWhen: { name: "heroMode", value: "custom" },
							},
						],
					},
					{
						title: "Manifesto",
						description: "Bloco curto entre abertura e catálogo.",
						route: "/",
						tools: ["Texto", "botão", "Fundo"],
						fields: [
							{ name: "manifestoTitle", label: "Título", defaultValue: page.manifesto?.title },
							{
								name: "manifestoBody",
								label: "Texto",
								type: "textarea",
								rows: 4,
								defaultValue: page.manifesto?.body,
							},
							{ name: "manifestoLinkLabel", label: "Botão", defaultValue: page.manifesto?.linkLabel },
							{
								name: "manifestoLinkHref",
								label: "Destino do botão",
								defaultValue: page.manifesto?.linkHref,
							},
							{
								name: "manifestoBackground",
								label: "Fundo do manifesto",
								type: "background",
								background: page.manifesto?.background,
							},
						],
					},
					{
						title: "Produto em destaque",
						description: "Texto estrutural do bloco principal de produto.",
						route: "/",
						tools: ["Texto", "botão", "Fundo"],
						fields: [
							{
								name: "featuredProductSlug",
								label: "Endereço do produto em destaque",
								defaultValue: page.featuredBook?.productSlug,
								help: "Use o endereço publicado em /product/nome-do-produto para controlar qual item aparece nesse bloco.",
							},
							{ name: "featuredEyebrow", label: "Linha curta", defaultValue: page.featuredBook?.eyebrow },
							{
								name: "featuredBody",
								label: "Texto",
								type: "textarea",
								rows: 3,
								defaultValue: page.featuredBook?.body,
							},
							{
								name: "featuredPrimaryCtaLabel",
								label: "Botão principal",
								defaultValue: page.featuredBook?.primaryCtaLabel,
							},
							{
								name: "featuredSecondaryCtaLabel",
								label: "Botão secundário",
								defaultValue: page.featuredBook?.secondaryCtaLabel,
							},
						],
					},
					{
						title: "Catálogo",
						description: "Copy estrutural do bloco curto de catálogo.",
						route: "/",
						tools: ["Texto", "Texto padrão"],
						fields: [
							{ name: "catalogTitle", label: "Título", defaultValue: page.catalog?.title },
							{
								name: "catalogBody",
								label: "Texto",
								type: "textarea",
								rows: 3,
								defaultValue: page.catalog?.body,
							},
							{
								name: "catalogPrimaryFallback",
								label: "Texto padrão do primeiro card",
								type: "textarea",
								rows: 3,
								defaultValue: page.catalog?.primaryCardFallback,
							},
							{
								name: "catalogDefaultFallback",
								label: "Texto padrão dos demais cards",
								type: "textarea",
								rows: 3,
								defaultValue: page.catalog?.defaultCardFallback,
							},
							{
								name: "catalogViewBookLabel",
								label: "Botão para produto disponível",
								defaultValue: page.catalog?.viewBookLabel,
							},
							{
								name: "catalogLaunchAlertLabel",
								label: "Botão para produto futuro",
								defaultValue: page.catalog?.launchAlertLabel,
							},
						],
					},
					{
						title: "Programação",
						description: "Bloco de continuidade para Sarau Safado.",
						route: "/",
						tools: ["Texto", "botão"],
						fields: [
							{ name: "programEyebrow", label: "Linha curta", defaultValue: page.program?.eyebrow },
							{ name: "programTitle", label: "Título", defaultValue: page.program?.title },
							{
								name: "programBody",
								label: "Texto",
								type: "textarea",
								rows: 3,
								defaultValue: page.program?.body,
							},
							{ name: "programCtaLabel", label: "Botão", defaultValue: page.program?.ctaLabel },
							{ name: "programCtaHref", label: "Destino do botão", defaultValue: page.program?.ctaHref },
							{
								name: "programBackground",
								label: "Fundo da programação",
								type: "background",
								background: page.program?.background,
							},
						],
					},
				]}
			/>
		</AdminEditorialPage>
	);
}
