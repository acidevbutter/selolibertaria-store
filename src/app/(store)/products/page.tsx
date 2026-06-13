import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { getTranslations } from "@/i18n/server";
import { commerce } from "@/lib/commerce-stripe";
import { getRequestPreferredCurrency } from "@/lib/currency-preference";
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
		<main className="space-y-8 pb-8">
			<section className="overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.46),transparent_36%),linear-gradient(180deg,#220607_0%,#050203_100%)] px-6 py-10 text-primary-foreground sm:px-10 sm:py-14">
				<div className="max-w-4xl space-y-5">
					<p className="text-xs uppercase tracking-[0.32em] text-primary-foreground/58 sm:text-sm">
						{seloT("catalogue.eyebrow")}
					</p>
					<h1 className="editorial-serif max-w-4xl text-balance text-5xl leading-[0.95] font-semibold tracking-[-0.04em] sm:text-6xl">
						{t("title")}
					</h1>
					<p className="max-w-2xl text-base leading-8 text-primary-foreground/78 sm:text-lg">
						{seloT("catalogue.description")}
					</p>
				</div>
			</section>
			<section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
				<div className="border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.38),transparent_42%),linear-gradient(180deg,#220607_0%,#050203_100%)] p-6 text-primary-foreground">
					<p className="text-xs uppercase tracking-[0.28em] text-primary-foreground/52">
						Leitura do catálogo
					</p>
					<h2 className="editorial-serif mt-4 text-3xl font-semibold sm:text-4xl">
						O catálogo funciona como prateleira curada, não como grade neutra.
					</h2>
				</div>
				<div className="grid gap-4 sm:grid-cols-3">
					<div className="border border-border/60 bg-card/60 p-5">
						<p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Livros</p>
						<p className="mt-3 text-sm leading-7 text-muted-foreground">
							Títulos, edições e formatos aparecem como entradas para o universo do selo.
						</p>
					</div>
					<div className="border border-border/60 bg-card/60 p-5">
						<p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Curadoria</p>
						<p className="mt-3 text-sm leading-7 text-muted-foreground">
							A seleção preserva atmosfera editorial sem perder clareza comercial.
						</p>
					</div>
					<div className="border border-border/60 bg-card/60 p-5">
						<p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Continuidade</p>
						<p className="mt-3 text-sm leading-7 text-muted-foreground">
							Cada livro pode levar a eventos, projetos e contexto cultural mais amplo.
						</p>
					</div>
				</div>
			</section>
			<ProductList products={products} />
		</main>
	);
}
