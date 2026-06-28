import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EditorialPageCopyForm } from "@/app/admin/editorial/_components/editorial-page-copy-form";
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
				title="Página do livro"
				description="Textos estruturais globais da PDP pública."
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
					helper="Os dados do livro continuam vindo do catálogo."
				/>
			</div>
			<EditorialPageCopyForm
				action={updateEditorialProductPageCopyAction}
				submitLabel="Salvar textos da página do livro"
				base={{ title: page.title, summary: page.summary, order: page.order, published: page.published }}
				sections={[
					{
						title: "Sinopse e trecho",
						description: "Rótulos fixos da leitura principal.",
						route: "/product/[slug]",
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
						description: "Cabeçalho do bloco factual do livro.",
						route: "/product/[slug]",
						fields: [{ name: "detailsTitle", label: "Título", defaultValue: page.details?.title }],
					},
					{
						title: "Relacionados",
						description: "Bloco de continuidade entre livros.",
						route: "/product/[slug]",
						fields: [
							{ name: "relatedTitle", label: "Título", defaultValue: page.related?.title },
							{
								name: "relatedBody",
								label: "Texto",
								type: "textarea",
								rows: 3,
								defaultValue: page.related?.body,
							},
							{ name: "relatedViewBookLabel", label: "Botão", defaultValue: page.related?.viewBookLabel },
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
						fields: [
							{ name: "continuityTitle", label: "Título", defaultValue: page.continuity?.title },
							{
								name: "continuityBody",
								label: "Texto",
								type: "textarea",
								rows: 3,
								defaultValue: page.continuity?.body,
							},
							{
								name: "continuityLink1Label",
								label: "Botão 1",
								defaultValue: page.continuity?.links?.[0]?.label,
							},
							{
								name: "continuityLink1Href",
								label: "Link do botão 1",
								defaultValue: page.continuity?.links?.[0]?.href,
							},
							{
								name: "continuityLink2Label",
								label: "Botão 2",
								defaultValue: page.continuity?.links?.[1]?.label,
							},
							{
								name: "continuityLink2Href",
								label: "Link do botão 2",
								defaultValue: page.continuity?.links?.[1]?.href,
							},
							{
								name: "continuityLink3Label",
								label: "Botão 3",
								defaultValue: page.continuity?.links?.[2]?.label,
							},
							{
								name: "continuityLink3Href",
								label: "Link do botão 3",
								defaultValue: page.continuity?.links?.[2]?.href,
							},
						],
					},
					{
						title: "Fallback de livro não encontrado",
						description: "Mensagem editorial de segurança quando o slug não existir.",
						route: "/product/[slug]",
						fields: [
							{ name: "notFoundTitle", label: "Título", defaultValue: page.notFound?.title },
							{
								name: "notFoundBody",
								label: "Texto",
								type: "textarea",
								rows: 3,
								defaultValue: page.notFound?.body,
							},
							{
								name: "notFoundPrimaryCtaLabel",
								label: "Botão",
								defaultValue: page.notFound?.primaryCtaLabel,
							},
							{
								name: "notFoundPrimaryCtaHref",
								label: "Link do botão",
								defaultValue: page.notFound?.primaryCtaHref,
							},
						],
					},
				]}
			/>
		</AdminEditorialPage>
	);
}
