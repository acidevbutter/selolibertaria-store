import { notFound } from "next/navigation";
import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { getTranslations } from "@/i18n/server";
import { commerce } from "@/lib/commerce";
import { getRequestPreferredCurrency } from "@/lib/currency-preference";
import { deslugify } from "@/lib/utils";
import { EditorialShell } from "@/ui/editorial/editorial-primitives";
import { CatalogIntro } from "@/ui/products/catalog-intro";
import { ProductList } from "@/ui/products/product-list";

export const generateMetadata = async (props: { params: Promise<{ slug: string }> }): Promise<Metadata> => {
	const params = await props.params;
	const preferredCurrency = await getRequestPreferredCurrency();
	const result = await commerce.product.browse({
		first: 100,
		category: params.slug, // YNS SDK uses direct category parameter
		currency: preferredCurrency,
	});

	if (!result.data || result.data.length === 0) {
		return notFound();
	}

	const t = await getTranslations("/category.metadata");

	return {
		title: t("title", { categoryName: deslugify(params.slug) }),
		alternates: { canonical: `${publicUrl}/category/${params.slug}` },
	};
};

export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
	const params = await props.params;
	const preferredCurrency = await getRequestPreferredCurrency();
	const result = await commerce.product.browse({
		first: 100,
		category: params.slug, // YNS SDK uses direct category parameter
		currency: preferredCurrency,
	});

	if (!result.data || result.data.length === 0) {
		return notFound();
	}

	const products = result.data;

	const t = await getTranslations("/category.page");
	const seloT = await getTranslations("Selo");

	return (
		<main className="space-y-8 pb-8">
			<CatalogIntro
				eyebrow={seloT("category.eyebrow")}
				title={deslugify(params.slug)}
				description={t("title", { categoryName: deslugify(params.slug) })}
				highlight="A categoria mantém o mesmo pulso editorial do catálogo, com recorte mais preciso."
				cards={[
					{
						label: "Recorte",
						body: "A seleção agrupa livros e edições por afinidade sem perder a sensação de descoberta.",
					},
					{
						label: "Ritmo",
						body: "O bloco de abertura prepara a leitura antes da grade, em vez de jogar a pessoa direto na listagem.",
					},
					{
						label: "Conexão",
						body: "Cada resultado ainda funciona como porta de entrada para autores, eventos e contexto do selo.",
					},
				]}
			/>
			<EditorialShell>
				<ProductList products={products} />
			</EditorialShell>
		</main>
	);
}
