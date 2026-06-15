import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { getTranslations } from "@/i18n/server";
import { commerce } from "@/lib/commerce-stripe";
import { getRequestPreferredCurrency } from "@/lib/currency-preference";
import { EditorialEyebrow, EditorialPanel, EditorialShell } from "@/ui/editorial/editorial-primitives";
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
			<section className="px-0 py-10 sm:py-14">
				<EditorialShell>
					<div className="max-w-4xl space-y-5">
						<EditorialEyebrow className="sm:text-sm">{seloT("catalogue.eyebrow")}</EditorialEyebrow>
						<h1 className="max-w-5xl text-balance text-5xl leading-[0.9] font-black tracking-[-0.06em] uppercase sm:text-6xl lg:text-7xl">
							{t("title")}
						</h1>
						<p className="max-w-2xl text-base leading-8 text-[color:var(--editorial-muted)] sm:text-lg">
							{seloT("catalogue.description")}
						</p>
					</div>
				</EditorialShell>
			</section>
			<EditorialShell className="space-y-8">
				<section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
					<div className="border-l-[12px] border-[color:var(--editorial-accent)] bg-[color:var(--editorial-beige)] p-6 sm:p-8">
						<p className="text-xs uppercase tracking-[0.28em] text-[color:var(--editorial-muted)]">
							Leitura do catálogo
						</p>
						<h2 className="mt-4 text-3xl leading-[0.95] font-black uppercase sm:text-4xl">
							O catálogo funciona como prateleira curada, não como grade neutra.
						</h2>
					</div>
					<div className="grid gap-4 sm:grid-cols-3">
						<EditorialPanel className="p-5">
							<p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Livros</p>
							<p className="mt-3 text-sm leading-7 text-muted-foreground">
								Títulos, edições e formatos aparecem como entradas para o universo do selo.
							</p>
						</EditorialPanel>
						<EditorialPanel className="p-5">
							<p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Curadoria</p>
							<p className="mt-3 text-sm leading-7 text-muted-foreground">
								A seleção preserva atmosfera editorial sem perder clareza comercial.
							</p>
						</EditorialPanel>
						<EditorialPanel className="p-5">
							<p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Continuidade</p>
							<p className="mt-3 text-sm leading-7 text-muted-foreground">
								Cada livro pode levar a eventos, projetos e contexto cultural mais amplo.
							</p>
						</EditorialPanel>
					</div>
				</section>
				<ProductList products={products} />
			</EditorialShell>
		</main>
	);
}
