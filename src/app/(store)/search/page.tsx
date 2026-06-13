import { RedirectType, redirect } from "next/navigation";
import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { getTranslations } from "@/i18n/server";
import { Search } from "@/lib/api";
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
			<section className="overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.46),transparent_36%),linear-gradient(180deg,#220607_0%,#050203_100%)] px-6 py-10 text-primary-foreground sm:px-10 sm:py-14">
				<div className="max-w-4xl space-y-5">
					<p className="text-xs uppercase tracking-[0.32em] text-primary-foreground/58 sm:text-sm">
						{seloT("search.eyebrow")}
					</p>
					<h1 className="editorial-serif max-w-4xl text-balance text-5xl leading-[0.95] font-semibold tracking-[-0.04em] sm:text-6xl">
						{t("title", { query })}
					</h1>
					<p className="max-w-2xl text-base leading-8 text-primary-foreground/78 sm:text-lg">
						{seloT("search.description")}
					</p>
				</div>
			</section>
			{products?.length ? <ProductList products={products} /> : <ProductNotFound query={query} />}
		</main>
	);
}
