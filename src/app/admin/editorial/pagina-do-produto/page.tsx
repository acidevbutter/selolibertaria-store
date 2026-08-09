import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EditorialPageCopyForm } from "@/app/admin/editorial/_components/editorial-page-copy-form";
import { EditorialPagePreview } from "@/app/admin/editorial/_components/editorial-page-preview.client";
import {
	getEditorialProductPageCopyRecord,
	updateEditorialProductPageCopyAction,
} from "@/app/admin/editorial/page-content-actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
} from "@/ui/editorial/editorial-primitives";

export default async function AdminEditorialProductPage() {
	const session = await auth();
	if (!session || !hasCapability(session.user.role, "editorial.write")) return null;
	const page = await getEditorialProductPageCopyRecord();
	if (!page) return null;

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Editorial"
				title="Página do produto"
				description="Textos estruturais globais da página pública de produto."
				actions={
					<>
						<EditorialPagePreview
							href="/products"
							published={page.published}
							formId="editorial-copy-form-pagina-do-produto"
							pageTitle="Página do produto"
						/>
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
					helper="Rota: /product/[slug]"
				/>
				<AdminEditorialStat
					label="Blocos"
					value="5"
					helper="Sinopse, trecho, ficha, relacionados e continuidade."
				/>
				<AdminEditorialStat
					label="Escopo"
					value="Estrutural"
					helper="Os dados do produto continuam vindo do catálogo."
				/>
			</div>
			<EditorialPageCopyForm
				action={updateEditorialProductPageCopyAction}
				submitLabel="Salvar textos da página do produto"
				base={{ published: page.published }}
				previewHref="/products"
				pageTitle="Página do produto"
				sections={[
					{
						title: "Sinopse e trecho",
						description: "Rótulos fixos da leitura principal.",
						route: "/product/[slug]",
						tools: ["Texto", "Texto padrão"],
						defaultOpen: true,
						fields: [
							{ name: "synopsisLabel", label: "Rótulo da sinopse", defaultValue: page.synopsis?.label },
							{ name: "excerptTitle", label: "Título do trecho", defaultValue: page.excerpt?.title },
							{
								name: "excerptBodyFallback",
								label: "Texto de apoio do trecho",
								type: "textarea",
								rows: 3,
								defaultValue: page.excerpt?.bodyFallback,
							},
						],
					},
					{
						title: "Ficha técnica",
						description: "Cabeçalho do bloco factual do produto.",
						route: "/product/[slug]",
						tools: ["Texto"],
						fields: [
							{ name: "detailsTitle", label: "Título da ficha técnica", defaultValue: page.details?.title },
						],
					},
					{
						title: "Relacionados",
						description: "Bloco de continuidade entre produtos.",
						route: "/product/[slug]",
						tools: ["Texto", "botão", "Texto padrão"],
						fields: [
							{
								name: "relatedTitle",
								label: "Título da seção de relacionados",
								defaultValue: page.related?.title,
							},
							{
								name: "relatedBody",
								label: "Texto da seção de relacionados",
								type: "textarea",
								rows: 3,
								defaultValue: page.related?.body,
							},
							{
								name: "relatedViewBookLabel",
								label: "Texto do botão de produto relacionado",
								defaultValue: page.related?.viewBookLabel,
							},
							{
								name: "relatedFallbackSummary",
								label: "Texto padrão sem resumo",
								defaultValue: page.related?.fallbackSummary,
							},
						],
					},
					{
						title: "Continuidade editorial",
						description: "Faixa final com saídas para outras rotas públicas.",
						route: "/product/[slug]",
						tools: ["Texto", "CTAs"],
						fields: [
							{
								name: "continuityTitle",
								label: "Título da faixa de continuidade",
								defaultValue: page.continuity?.title,
							},
							{
								name: "continuityBody",
								label: "Texto da faixa de continuidade",
								type: "textarea",
								rows: 3,
								defaultValue: page.continuity?.body,
							},
							{
								name: "continuityLink1Label",
								label: "Texto do botão 1 da continuidade",
								defaultValue: page.continuity?.links?.[0]?.label,
							},
							{
								name: "continuityLink1Href",
								label: "Destino do botão 1 da continuidade",
								defaultValue: page.continuity?.links?.[0]?.href,
								help: "Prefira rotas internas do site, como /projects ou /contact.",
							},
							{
								name: "continuityLink2Label",
								label: "Texto do botão 2 da continuidade",
								defaultValue: page.continuity?.links?.[1]?.label,
							},
							{
								name: "continuityLink2Href",
								label: "Destino do botão 2 da continuidade",
								defaultValue: page.continuity?.links?.[1]?.href,
								help: "Prefira rotas internas do site para manter a leitura editorial coesa.",
							},
							{
								name: "continuityLink3Label",
								label: "Texto do botão 3 da continuidade",
								defaultValue: page.continuity?.links?.[2]?.label,
							},
							{
								name: "continuityLink3Href",
								label: "Destino do botão 3 da continuidade",
								defaultValue: page.continuity?.links?.[2]?.href,
								help: "Use uma rota interna curta, como /sarau-safado ou /about.",
							},
						],
					},
					{
						title: "Fallback de produto não encontrado",
						description: "Mensagem editorial de segurança quando o slug não existir.",
						route: "/product/[slug]",
						tools: ["Texto", "botão", "Texto padrão"],
						fields: [
							{ name: "notFoundTitle", label: "Título do fallback", defaultValue: page.notFound?.title },
							{
								name: "notFoundBody",
								label: "Texto do fallback",
								type: "textarea",
								rows: 3,
								defaultValue: page.notFound?.body,
							},
							{
								name: "notFoundPrimaryCtaLabel",
								label: "Texto do botão do fallback",
								defaultValue: page.notFound?.primaryCtaLabel,
							},
							{
								name: "notFoundPrimaryCtaHref",
								label: "Destino do botão do fallback",
								defaultValue: page.notFound?.primaryCtaHref,
								help: "Prefira uma rota interna de continuidade, como /products ou /projects.",
							},
						],
					},
				]}
			/>
		</AdminEditorialPage>
	);
}
