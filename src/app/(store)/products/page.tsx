import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { getTranslations } from "@/i18n/server";
import { commerce } from "@/lib/commerce-stripe";
import { getRequestPreferredCurrency } from "@/lib/currency-preference";
import { seloEditorialAssets } from "@/lib/selolibertaria-content";
import { EditorialShell } from "@/ui/editorial/editorial-primitives";
import { CatalogIntro } from "@/ui/products/catalog-intro";
import { ProductList } from "@/ui/products/product-list";
import { YnsLink } from "@/ui/yns-link";

export const generateMetadata = async (): Promise<Metadata> => {
	const t = await getTranslations("/products.metadata");
	return {
		title: t("title"),
		alternates: { canonical: `${publicUrl}/products` },
	};
};

export default async function AllProductsPage() {
	const result = await commerce.product.browse({ first: 100, currency: await getRequestPreferredCurrency() });
	const products = result.data;
	const t = await getTranslations("/products.page");
	const seloT = await getTranslations("Selo");
	const featuredProduct = products.find((product) => product.images[0]) ?? products[0] ?? null;

	return (
		<main>
			<CatalogIntro
				eyebrow={seloT("catalogue.eyebrow")}
				title={t("title")}
				description={seloT("catalogue.description")}
				highlight="Catálogo para entrar no universo do selo pela leitura."
				cards={[
					{
						label: "Livros",
						body: "Títulos, edições e formatos aparecem como portas de entrada para o universo do selo.",
					},
					{
						label: "Curadoria",
						body: "A seleção preserva atmosfera editorial sem perder clareza comercial.",
					},
					{
						label: "Continuidade",
						body: "Cada livro pode levar a eventos, projetos e contexto cultural mais amplo.",
					},
				]}
				featureImage={{
					src: featuredProduct?.images[0] ?? seloEditorialAssets.bookStandingMock,
					alt: featuredProduct?.name ?? "Livro em destaque do catálogo do Selo Libertária",
				}}
				featureQuote="O livro como objeto, presença e faísca."
				primaryCtaLabel="Comprar agora"
				primaryCtaHref={featuredProduct ? `/product/${featuredProduct.slug}` : "/products"}
			/>
			<EditorialShell className="space-y-8 py-8">
				<ProductList products={products} />
			</EditorialShell>
			<section className="bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)]">
				<EditorialShell className="grid gap-5 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
					<h2 className="max-w-3xl text-3xl leading-[0.95] font-black sm:text-4xl">
						Cada capa abre uma rota: compra, trecho e contexto editorial.
					</h2>
					<div className="space-y-4 text-sm leading-7 text-[color:rgba(247,244,239,0.76)]">
						<p>
							A página de livros funciona como prateleira curta e curada, não como grade genérica de loja.
						</p>
						<YnsLink
							href="/contact"
							className="inline-flex min-h-11 items-center justify-center border border-white/20 px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-paper)] transition-colors duration-300 hover:bg-white/8"
						>
							Falar sobre livros
						</YnsLink>
					</div>
				</EditorialShell>
			</section>
		</main>
	);
}
