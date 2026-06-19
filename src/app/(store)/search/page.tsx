import { RedirectType, redirect } from "next/navigation";
import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { getTranslations } from "@/i18n/server";
import { Search } from "@/lib/api";
import { EditorialShell } from "@/ui/editorial/editorial-primitives";
import { CatalogIntro } from "@/ui/products/catalog-intro";
import { ProductList } from "@/ui/products/product-list";
import { ProductNotFound } from "@/ui/products/product-not-found";

export const generateMetadata = async (props: {
	searchParams: Promise<{
		q?: string;
	}>;
}): Promise<Metadata> => {
	const searchParams = await props.searchParams;
	const t = await getTranslations("/search.metadata");
	return {
		title: t("title", { query: searchParams.q }),
		alternates: { canonical: `${publicUrl}/search` },
	};
};

export default async function SearchPage(props: {
	searchParams: Promise<{
		q?: string;
	}>;
}) {
	const searchParams = await props.searchParams;
	const query = searchParams.q;

	if (!query) {
		return redirect("/", RedirectType.replace);
	}

	const t = await getTranslations("/search.page");
	const seloT = await getTranslations("Selo");

	const products = await Search.searchProducts(query);

	return (
		<main className="space-y-8 pb-8">
			<CatalogIntro
				eyebrow={seloT("search.eyebrow")}
				title={t("title", { query })}
				description={seloT("search.description")}
				highlight="A busca deve parecer uma leitura guiada, não um estado técnico isolado."
				cards={[
					{
						label: "Leitura",
						body: "O termo pesquisado ganha contexto visual antes da lista, deixando a resposta menos seca.",
					},
					{
						label: "Precisão",
						body: "Resultados continuam rápidos, mas entram em uma moldura editorial consistente com o resto da loja.",
					},
					{
						label: "Continuidade",
						body: "Mesmo na busca, a pessoa sente que continua navegando o mesmo universo curado do selo.",
					},
				]}
			/>
			<EditorialShell>
				{products?.length ? <ProductList products={products} /> : <ProductNotFound query={query} />}
			</EditorialShell>
		</main>
	);
}
