import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EditorialPageCopyForm } from "@/app/admin/editorial/_components/editorial-page-copy-form";
import {
	getEditorialProductsPageCopyRecord,
	updateEditorialProductsPageCopyAction,
} from "@/app/admin/editorial/page-content-actions";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
} from "@/ui/editorial/editorial-primitives";

export default async function AdminEditorialProductsPage() {
	const session = await auth();
	if (!session || !hasCapability(session.user.role, "editorial.write")) return null;
	const page = await getEditorialProductsPageCopyRecord();
	if (!page) return null;

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Editorial"
				title="Livros e catálogo"
				description="Textos estruturais da vitrine pública de livros."
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
					helper="Rota: /products"
				/>
				<AdminEditorialStat label="Blocos" value="4" helper="Abertura, nota, catálogo e continuidade." />
				<AdminEditorialStat
					label="Fonte"
					value="Admin editorial"
					helper="Copy pública editável sem deploy."
				/>
			</div>
			<EditorialPageCopyForm
				action={updateEditorialProductsPageCopyAction}
				submitLabel="Salvar textos de /products"
				base={{ published: page.published }}
				sections={[
					{
						title: "Abertura",
						description: "Abertura principal da página de livros.",
						route: "/products",
						defaultOpen: true,
						fields: [
							{ name: "heroEyebrow", label: "Linha curta da abertura", defaultValue: page.hero?.eyebrow },
							{ name: "heroTitle", label: "Título da abertura", defaultValue: page.hero?.title },
							{
								name: "heroBody",
								label: "Texto da abertura",
								type: "textarea",
								rows: 4,
								defaultValue: page.hero?.body,
							},
							{
								name: "heroPrimaryCtaLabel",
								label: "Texto do botão principal da abertura",
								defaultValue: page.hero?.primaryCtaLabel,
								help: "Use um texto curto de ação, como Comprar livros ou Ver catálogo.",
							},
							{
								name: "heroPrimaryCtaHref",
								label: "Destino do botão principal da abertura",
								defaultValue: page.hero?.primaryCtaHref,
								help: "Prefira rotas internas, como /products, /projects ou /contact.",
							},
							{
								name: "heroSecondaryCtaLabel",
								label: "Texto do botão secundário da abertura",
								defaultValue: page.hero?.secondaryCtaLabel,
								help: "Use um texto de apoio para a segunda saída editorial.",
							},
							{
								name: "heroSecondaryCtaHref",
								label: "Destino do botão secundário da abertura",
								defaultValue: page.hero?.secondaryCtaHref,
								help: "Prefira rotas internas do site para manter a navegação consistente.",
							},
							{ name: "heroQuote", label: "Frase de apoio da abertura", defaultValue: page.hero?.quote },
						],
					},
					{
						title: "Nota curatorial",
						description: "Explica o catálogo como mesa de curadoria.",
						route: "/products",
						fields: [
							{
								name: "curatorialTitle",
								label: "Título da nota curatorial",
								defaultValue: page.curatorialNote?.title,
							},
							{
								name: "curatorialBody",
								label: "Texto da nota curatorial",
								type: "textarea",
								rows: 4,
								defaultValue: page.curatorialNote?.body,
							},
						],
					},
					{
						title: "Listagem de livros",
						description: "Textos estruturais acima da grade e fallbacks dos cards.",
						route: "/products",
						fields: [
							{ name: "listingLabel", label: "Linha curta da listagem", defaultValue: page.listing?.label },
							{ name: "listingTitle", label: "Título interno do bloco", defaultValue: page.listing?.title },
							{
								name: "listingBody",
								label: "Texto de apoio da listagem",
								type: "textarea",
								rows: 3,
								defaultValue: page.listing?.body,
							},
							{
								name: "listingEmptyText",
								label: "Texto de fallback sem livros",
								type: "textarea",
								rows: 4,
								defaultValue: page.listing?.emptyText,
							},
							{
								name: "listingCardPrimaryFallback",
								label: "Texto padrão do primeiro card",
								type: "textarea",
								rows: 3,
								defaultValue: page.listing?.cardPrimaryFallback,
							},
							{
								name: "listingCardSecondaryFallback",
								label: "Texto padrão dos demais cards",
								type: "textarea",
								rows: 3,
								defaultValue: page.listing?.cardSecondaryFallback,
							},
							{
								name: "listingViewBookLabel",
								label: "Texto do botão para livro disponível",
								defaultValue: page.listing?.viewBookLabel,
							},
							{
								name: "listingLaunchAlertLabel",
								label: "Texto do botão para livro futuro",
								defaultValue: page.listing?.launchAlertLabel,
							},
						],
					},
					{
						title: "Faixa final",
						description: "Saída editorial após o catálogo.",
						route: "/products",
						fields: [
							{ name: "finalTitle", label: "Título da faixa final", defaultValue: page.finalCta?.title },
							{
								name: "finalBody",
								label: "Texto da faixa final",
								type: "textarea",
								rows: 3,
								defaultValue: page.finalCta?.body,
							},
							{
								name: "finalPrimaryCtaLabel",
								label: "Texto do botão da faixa final",
								defaultValue: page.finalCta?.primaryCtaLabel,
								help: "Use um botão curto para a saída editorial desta seção.",
							},
							{
								name: "finalPrimaryCtaHref",
								label: "Destino do botão da faixa final",
								defaultValue: page.finalCta?.primaryCtaHref,
								help: "Prefira rotas internas, como /projects, /contact ou /sarau-safado.",
							},
						],
					},
				]}
			/>
		</AdminEditorialPage>
	);
}
