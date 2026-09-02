import { notFound } from "next/navigation";
import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { getLocale, getTranslations } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { canBuyOnSelolibertaria } from "@/lib/authz";
import { commerce } from "@/lib/commerce";
import { getRequestPreferredCurrency } from "@/lib/currency-preference";
import { buildSlProductRows, deriveSlCategories } from "@/lib/sl-catalog";
import { deslugify } from "@/lib/utils";
import { SlCatalog } from "@/ui/products/sl-catalog.client";
import { SlPageHero } from "@/ui/sl/sl-page-hero";

export const generateMetadata = async (props: { params: Promise<{ slug: string }> }): Promise<Metadata> => {
	const params = await props.params;
	const result = await commerce.product.browse({
		first: 100,
		category: params.slug,
		currency: await getRequestPreferredCurrency(),
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
	const [currency, locale, session, seloT] = await Promise.all([
		getRequestPreferredCurrency(),
		getLocale(),
		auth(),
		getTranslations("Selo"),
	]);

	const result = await commerce.product.browse({ first: 100, category: params.slug, currency });
	if (!result.data || result.data.length === 0) {
		return notFound();
	}

	const rows = buildSlProductRows(result.data, {
		locale,
		canPurchase: canBuyOnSelolibertaria(session?.user.role),
	});
	const categories = deriveSlCategories(rows);
	const name = result.data[0]?.category?.name ?? deslugify(params.slug);
	const count = rows.length;

	return (
		<div className="sl-scope" style={{ background: "var(--sl-surface-page)" }}>
			<SlPageHero
				eyebrow={seloT("category.eyebrow")}
				title={name}
				lead={`${count} ${count === 1 ? "item" : "itens"} nesta categoria — mesma mesa de curadoria, recorte mais preciso.`}
			/>
			<SlCatalog rows={rows} categories={categories} />
		</div>
	);
}
