import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { commerce } from "@/lib/commerce-stripe";
import { getRequestPreferredCurrency } from "@/lib/currency-preference";
import { getEditorialProductsPage } from "@/lib/editorial-content-store";
import { seloEditorialAssets } from "@/lib/selolibertaria-content";
import { EditorialShell } from "@/ui/editorial/editorial-primitives";
import { CatalogIntro } from "@/ui/products/catalog-intro";
import { ProductList } from "@/ui/products/product-list";
import { YnsLink } from "@/ui/yns-link";

export const generateMetadata = async (): Promise<Metadata> => {
	const page = await getEditorialProductsPage();

	return {
		title: page.title,
		description: page.hero?.body || page.summary || undefined,
		alternates: {
			canonical: `${publicUrl}/products`,
		},
	};
};

export default async function AllProductsPage() {
	const preferredCurrency = await getRequestPreferredCurrency();
	const [page, result] = await Promise.all([
		getEditorialProductsPage(),
		commerce.product.browse({
			first: 100,
			currency: preferredCurrency,
		}),
	]);

	const products = result.data;
	const featuredProduct = products.find((product) => product.images[0]) ?? products[0] ?? null;
	const featuredHref = featuredProduct ? `/product/${featuredProduct.slug}` : "/products#catalogo-publicado";

	return (
		<main className="bg-[color:var(--editorial-paper)]">
			<CatalogIntro
				eyebrow={page.hero?.eyebrow || "Livros"}
				title={page.hero?.title || "Livros para entrar no universo do selo pela leitura."}
				description={
					page.hero?.body ||
					"Catálogo autoral de literatura erótica, urbana e dissidente, com capas, trechos e caminhos de compra preservados."
				}
				highlight={
					page.curatorialNote?.title || "Catálogo como mesa de curadoria, não como vitrine genérica."
				}
				cards={[
					{
						label: page.listing?.label || "Catálogo",
						body: page.listing?.body || "Cada capa abre uma rota: compra, trecho e contexto editorial.",
					},
					{
						label: "Curadoria",
						body:
							page.curatorialNote?.body ||
							"A página de livros deve preservar a operação de loja enquanto apresenta cada obra como objeto editorial.",
					},
					{
						label: "Continuidade",
						body: page.finalCta?.body || "Depois do livro, continue pelo Sarau Safado e pelos projetos.",
					},
				]}
				featureImage={{
					src: featuredProduct?.images[0] ?? seloEditorialAssets.bookStandingMock,
					alt: featuredProduct?.name ?? "Livro em destaque do catálogo do Selo Libertária",
				}}
				featureQuote={page.hero?.quote || "Uma prateleira curta, quente e curada."}
				primaryCtaLabel={page.hero?.primaryCtaLabel || "Ver catálogo"}
				primaryCtaHref={page.hero?.primaryCtaHref || "#catalogo-publicado"}
				secondaryCtaLabel={page.hero?.secondaryCtaLabel || "Comprar destaque"}
				secondaryCtaHref={page.hero?.secondaryCtaHref || featuredHref}
				tone="dark"
			/>

			<EditorialShell className="space-y-8 py-10 sm:py-14">
				{products.length > 0 ? (
					<ProductList
						products={products}
						anchorId="catalogo-publicado"
						eyebrow={page.listing?.label || "Catálogo"}
						title={page.listing?.title || page.curatorialNote?.title || "Catálogo publicado"}
						description={
							page.curatorialNote?.body ||
							"A página de livros deve preservar a operação de loja enquanto apresenta cada obra como objeto editorial."
						}
					/>
				) : (
					<div className="border border-dashed border-[color:var(--editorial-border)] bg-[color:rgba(247,244,239,0.6)] px-6 py-10 text-sm leading-7 text-[color:var(--editorial-muted)]">
						{page.listing?.emptyText ||
							"O catálogo ainda não tem títulos publicados. Volte em breve para acompanhar os próximos livros."}
					</div>
				)}
			</EditorialShell>

			<section className="bg-[color:var(--editorial-beige)] text-[color:var(--editorial-ink)]">
				<EditorialShell className="grid gap-5 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8">
					<div>
						<h2 className="max-w-3xl text-3xl leading-[0.95] font-black sm:text-4xl">
							{page.finalCta?.title || "Depois do livro, continue pelo Sarau Safado e pelos projetos."}
						</h2>
						<p className="mt-3 text-sm leading-7 text-[color:var(--editorial-muted)]">
							{page.finalCta?.body ||
								"A página de livros continua orientada à compra, mas abre caminhos editoriais claros para outros contextos do selo."}
						</p>
					</div>
					<div className="flex flex-wrap gap-3 lg:justify-end">
						<YnsLink
							href={page.hero?.secondaryCtaHref || featuredHref}
							className="inline-flex min-h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-paper)] transition-colors duration-300 hover:bg-[color:var(--editorial-accent)]"
						>
							{page.hero?.secondaryCtaLabel || "Comprar destaque"}
						</YnsLink>
						<YnsLink
							href={page.finalCta?.primaryCtaHref || "/contact"}
							className="inline-flex min-h-11 items-center justify-center border border-[color:rgba(11,11,11,0.18)] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-ink)] transition-colors duration-300 hover:bg-[color:rgba(247,244,239,0.42)]"
						>
							{page.finalCta?.primaryCtaLabel || "Falar sobre livros"}
						</YnsLink>
					</div>
				</EditorialShell>
			</section>
		</main>
	);
}
