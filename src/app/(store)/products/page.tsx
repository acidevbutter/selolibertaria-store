import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { getTranslations } from "@/i18n/server";
import { commerce } from "@/lib/commerce-stripe";
import { getRequestPreferredCurrency } from "@/lib/currency-preference";
import { EditorialShell } from "@/ui/editorial/editorial-primitives";
import { CatalogIntro } from "@/ui/products/catalog-intro";
import { ProductList } from "@/ui/products/product-list";

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

	return (
		<main className="space-y-8 pb-12">
			<CatalogIntro
				eyebrow={seloT("catalogue.eyebrow")}
				title={t("title")}
				description={seloT("catalogue.description")}
				highlight="O catálogo funciona como prateleira curada, não como grade neutra."
				cards={[
					{
						label: "Livros",
						body: "Títulos, edições e formatos aparecem como entradas para o universo do selo.",
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
			/>
			<EditorialShell className="space-y-8">
				<ProductList products={products} />
			</EditorialShell>
		</main>
	);
}
