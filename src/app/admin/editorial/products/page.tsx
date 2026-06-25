import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
	getEditorialProductsPageCopyRecord,
	updateEditorialProductsPageCopyAction,
} from "@/app/admin/editorial/page-content-actions";
import { EditorialPageCopyForm } from "@/app/admin/editorial/_components/editorial-page-copy-form";
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
				<AdminEditorialStat label="Status" value={page.published ? "Publicado" : "Rascunho"} helper="Rota: /products" />
				<AdminEditorialStat label="Blocos" value="4" helper="Hero, nota, catálogo e continuidade." />
				<AdminEditorialStat label="Fonte" value="Admin editorial" helper="Copy pública editável sem deploy." />
			</div>
			<EditorialPageCopyForm
				action={updateEditorialProductsPageCopyAction}
				submitLabel="Salvar textos de /products"
				base={{ title: page.title, summary: page.summary, order: page.order, published: page.published }}
				sections={[
					{
						title: "Hero",
						description: "Abertura principal da página de livros.",
						route: "/products",
						fields: [
							{ name: "heroEyebrow", label: "Linha curta", defaultValue: page.hero?.eyebrow },
							{ name: "heroTitle", label: "Título", defaultValue: page.hero?.title },
							{ name: "heroBody", label: "Texto", type: "textarea", rows: 4, defaultValue: page.hero?.body },
							{ name: "heroPrimaryCtaLabel", label: "Botão principal", defaultValue: page.hero?.primaryCtaLabel },
							{ name: "heroPrimaryCtaHref", label: "Link do botão principal", defaultValue: page.hero?.primaryCtaHref },
							{ name: "heroSecondaryCtaLabel", label: "Botão secundário", defaultValue: page.hero?.secondaryCtaLabel },
							{ name: "heroSecondaryCtaHref", label: "Link do botão secundário", defaultValue: page.hero?.secondaryCtaHref },
							{ name: "heroQuote", label: "Frase de apoio", defaultValue: page.hero?.quote },
						],
					},
					{
						title: "Nota curatorial",
						description: "Explica o catálogo como mesa de curadoria.",
						route: "/products",
						fields: [
							{ name: "curatorialTitle", label: "Título", defaultValue: page.curatorialNote?.title },
							{ name: "curatorialBody", label: "Texto", type: "textarea", rows: 4, defaultValue: page.curatorialNote?.body },
						],
					},
					{
						title: "Listagem de livros",
						description: "Textos estruturais acima da grade e fallbacks dos cards.",
						route: "/products",
						fields: [
							{ name: "listingLabel", label: "Linha curta", defaultValue: page.listing?.label },
							{ name: "listingTitle", label: "Título interno do bloco", defaultValue: page.listing?.title },
							{ name: "listingBody", label: "Texto de apoio", type: "textarea", rows: 3, defaultValue: page.listing?.body },
							{ name: "listingEmptyText", label: "Texto quando não houver livros", type: "textarea", rows: 4, defaultValue: page.listing?.emptyText },
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
							{ name: "listingViewBookLabel", label: "Botão para livro disponível", defaultValue: page.listing?.viewBookLabel },
							{ name: "listingLaunchAlertLabel", label: "Botão para livro futuro", defaultValue: page.listing?.launchAlertLabel },
						],
					},
					{
						title: "Faixa final",
						description: "Saída editorial após o catálogo.",
						route: "/products",
						fields: [
							{ name: "finalTitle", label: "Título", defaultValue: page.finalCta?.title },
							{ name: "finalBody", label: "Texto", type: "textarea", rows: 3, defaultValue: page.finalCta?.body },
							{ name: "finalPrimaryCtaLabel", label: "Botão", defaultValue: page.finalCta?.primaryCtaLabel },
							{ name: "finalPrimaryCtaHref", label: "Link do botão", defaultValue: page.finalCta?.primaryCtaHref },
						],
					},
				]}
			/>
		</AdminEditorialPage>
	);
}
