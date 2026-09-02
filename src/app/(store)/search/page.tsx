import { RedirectType, redirect } from "next/navigation";
import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { getLocale, getTranslations } from "@/i18n/server";
import { Search } from "@/lib/api";
import { auth } from "@/lib/auth";
import { canBuyOnSelolibertaria } from "@/lib/authz";
import type { Product } from "@/lib/commerce-types";
import { buildSlProductRows, deriveSlCategories } from "@/lib/sl-catalog";
import { SlCatalog } from "@/ui/products/sl-catalog.client";
import { SlButton } from "@/ui/sl/sl-button";
import { SlPageHero } from "@/ui/sl/sl-page-hero";

export const generateMetadata = async (props: {
	searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> => {
	const searchParams = await props.searchParams;
	const t = await getTranslations("/search.metadata");
	return {
		title: t("title", { query: searchParams.q }),
		alternates: { canonical: `${publicUrl}/search` },
	};
};

export default async function SearchPage(props: { searchParams: Promise<{ q?: string }> }) {
	const searchParams = await props.searchParams;
	const query = searchParams.q;

	if (!query) {
		return redirect("/", RedirectType.replace);
	}

	const [t, seloT, locale, session, results] = await Promise.all([
		getTranslations("/search.page"),
		getTranslations("Selo"),
		getLocale(),
		auth(),
		Search.searchProducts(query),
	]);

	const products = (results ?? []).filter((product): product is Product => Boolean(product));
	const rows = buildSlProductRows(products, {
		locale,
		canPurchase: canBuyOnSelolibertaria(session?.user.role),
	});
	const categories = deriveSlCategories(rows);

	return (
		<div className="sl-scope" style={{ background: "var(--sl-surface-page)" }}>
			<SlPageHero
				eyebrow={seloT("search.eyebrow")}
				title={t("title", { query })}
				lead={seloT("search.description")}
			/>
			{rows.length > 0 ? (
				<SlCatalog rows={rows} categories={categories} />
			) : (
				<div className="mx-auto flex w-full max-w-[var(--sl-w-narrow)] flex-col gap-4 px-4 py-16 sm:px-8 lg:px-12">
					<p className="m-0 border border-[color:var(--sl-line-strong)] bg-[color:var(--sl-surface-card)] p-6 text-[14px] leading-[1.7] text-[color:var(--sl-text-muted)]">
						Nada encontrado para <strong>“{query}”</strong>. Tente outro termo ou volte para o catálogo
						completo.
					</p>
					<SlButton href="/products" variant="secondary" className="self-start">
						Ver a loja
					</SlButton>
				</div>
			)}
		</div>
	);
}
