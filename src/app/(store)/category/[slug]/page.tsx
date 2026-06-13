import { notFound } from "next/navigation";
import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { getTranslations } from "@/i18n/server";
import { commerce } from "@/lib/commerce";
import { getRequestPreferredCurrency } from "@/lib/currency-preference";
import { deslugify } from "@/lib/utils";
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
			<section className="overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.46),transparent_36%),linear-gradient(180deg,#220607_0%,#050203_100%)] px-6 py-10 text-primary-foreground sm:px-10 sm:py-14">
				<div className="max-w-4xl space-y-5">
					<p className="text-xs uppercase tracking-[0.32em] text-primary-foreground/58 sm:text-sm">
						{seloT("category.eyebrow")}
					</p>
					<h1 className="editorial-serif max-w-4xl text-balance text-5xl leading-[0.95] font-semibold tracking-[-0.04em] sm:text-6xl">
						{deslugify(params.slug)}
					</h1>
					<p className="max-w-2xl text-base leading-8 text-primary-foreground/78 sm:text-lg">
						{t("title", { categoryName: deslugify(params.slug) })}
					</p>
				</div>
			</section>
			<ProductList products={products} />
		</main>
	);
}
