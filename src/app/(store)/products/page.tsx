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
	const [page, result] = await Promise.all([
		getEditorialProductsPage(),
		commerce.product.browse({
			first: 100,
			currency: await getRequestPreferredCurrency(),
		}),
	]);

	const products = result.data;
	const featuredProduct = products.find((product) => product.images[0]) ?? products[0] ?? null;

	return (
		<main>
			<CatalogIntro
				eyebrow={page.hero?.eyebrow || "Livros"}
				title={page.hero?.title || "Livros para entrar no universo do selo pela leitura."}
				description={
					page.hero?.body ||
					"Catálogo autoral de literatura erótica, urbana e dissidente, com capas, trechos e caminhos de compra preservados."
				}
				highlight={page.hero?.quote || "Uma prateleira curta, quente e curada."}
				cards={[
					{
						label: page.listing?.label || "Catálogo",
						body: page.listing?.body || "Cada capa abre uma rota: compra, trecho e contexto editorial.",
					},
					{
						label: "Curadoria",
						body: page.curatorialNote?.title || "Catálogo como mesa de curadoria, não como vitrine genérica.",
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
				featureQuote={page.hero?.quote || "O livro como objeto, presença e faísca."}
				primaryCtaLabel={page.hero?.primaryCtaLabel || "Ver catálogo"}
				primaryCtaHref={page.hero?.primaryCtaHref || "/products"}
			/>

			<EditorialShell className="space-y-8 py-8">
				<div className="max-w-3xl space-y-4">
					<h2 className="text-3xl font-black tracking-[-0.04em] text-[color:var(--editorial-ink)]">
						{page.curatorialNote?.title || "Catálogo publicado"}
					</h2>
					<p className="text-sm leading-7 text-[color:var(--editorial-muted)]">
						{page.curatorialNote?.body ||
							"A página de livros deve preservar a operação de loja enquanto apresenta cada obra como objeto editorial."}
					</p>
				</div>

				{products.length > 0 ? (
					<ProductList products={products} />
				) : (
					<div className="border border-dashed border-[color:var(--editorial-border)] bg-[color:rgba(247,244,239,0.6)] px-6 py-10 text-sm leading-7 text-[color:var(--editorial-muted)]">
						{page.listing?.emptyText ||
							"O catálogo ainda não tem títulos publicados. Volte em breve para acompanhar os próximos livros."}
					</div>
				)}
			</EditorialShell>

			<section className="bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)]">
				<EditorialShell className="grid gap-5 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
					<div>
						<h2 className="max-w-3xl text-3xl leading-[0.95] font-black sm:text-4xl">
							{page.finalCta?.title || "Depois do livro, continue pelo Sarau Safado e pelos projetos."}
						</h2>
						<p className="mt-3 text-sm leading-7 text-[color:rgba(247,244,239,0.76)]">
							{page.finalCta?.body ||
								"A página de livros continua orientada à compra, mas abre caminhos editoriais claros para outros contextos do selo."}
						</p>
					</div>
					<div className="flex flex-wrap gap-3 lg:justify-end">
						<YnsLink
							href={page.hero?.secondaryCtaHref || "/products"}
							className="inline-flex min-h-11 items-center justify-center border border-white/20 px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-paper)] transition-colors duration-300 hover:bg-white/8"
						>
							{page.hero?.secondaryCtaLabel || "Comprar destaque"}
						</YnsLink>
						<YnsLink
							href={page.finalCta?.primaryCtaHref || "/contact"}
							className="inline-flex min-h-11 items-center justify-center bg-[color:var(--editorial-paper)] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-ink)] transition-colors duration-300 hover:bg-[color:var(--editorial-beige)]"
						>
							{page.finalCta?.primaryCtaLabel || "Falar sobre livros"}
						</YnsLink>
					</div>
				</EditorialShell>
			</section>
		</main>
	);
}
