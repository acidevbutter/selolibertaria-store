import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { getLocale } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { canBuyOnSelolibertaria } from "@/lib/authz";
import { commerce } from "@/lib/commerce";
import { getRequestPreferredCurrency } from "@/lib/currency-preference";
import { blockText } from "@/lib/editorial-blocks-slots";
import { getEditorialProductsPage } from "@/lib/editorial-content-store";
import { buildSlProductRows, deriveSlCategories } from "@/lib/sl-catalog";
import { EditorialExtraBlocks } from "@/ui/editorial/editorial-extra-blocks";
import { SlCatalog } from "@/ui/products/sl-catalog.client";
import { SlButton } from "@/ui/sl/sl-button";
import { SlPageHero } from "@/ui/sl/sl-page-hero";

export const generateMetadata = async (): Promise<Metadata> => {
	const page = await getEditorialProductsPage();

	return {
		title: page.title,
		description: page.hero?.body || page.summary || undefined,
		alternates: {
			canonical: `${publicUrl}/products`,
		},
	};
};

export default async function AllProductsPage() {
	const [preferredCurrency, locale, session, page] = await Promise.all([
		getRequestPreferredCurrency(),
		getLocale(),
		auth(),
		getEditorialProductsPage(),
	]);

	const result = await commerce.product.browse({ first: 100, currency: preferredCurrency });
	const canPurchase = canBuyOnSelolibertaria(session?.user.role);
	const rows = buildSlProductRows(result.data, { locale, canPurchase });
	const categories = deriveSlCategories(rows);

	const count = rows.length;
	const lead =
		blockText(page.contentDoc, "products-hero-lead") ||
		page.hero?.body ||
		"Livros, edições sonoras, zines, objetos, ingressos e laboratórios — uma mesa de curadoria, não uma vitrine.";

	return (
		<div className="sl-scope" style={{ background: "var(--sl-surface-page)" }}>
			<SlPageHero
				eyebrow={blockText(page.contentDoc, "products-hero-eyebrow") || page.hero?.eyebrow || "Loja"}
				title={count > 0 ? `${count} ${count === 1 ? "item do selo" : "itens do selo"}` : "A loja do selo"}
				lead={lead}
			/>

			{count > 0 ? (
				<SlCatalog rows={rows} categories={categories} />
			) : (
				<div className="mx-auto w-full max-w-[var(--sl-w-narrow)] px-4 py-16 sm:px-8 lg:px-12">
					<p className="border border-[color:var(--sl-line-strong)] bg-[color:var(--sl-surface-card)] p-6 text-[14px] leading-[1.7] text-[color:var(--sl-text-muted)]">
						{blockText(page.contentDoc, "products-listing-empty") ||
							page.listing?.emptyText ||
							"A loja ainda não tem produtos publicados. Volte em breve para acompanhar os próximos lançamentos."}
					</p>
				</div>
			)}

			<section
				className="text-[color:var(--sl-text-on-ink)]"
				style={{ background: "var(--sl-surface-invert)" }}
			>
				<div className="mx-auto flex w-full max-w-[var(--sl-w-desktop)] flex-col gap-6 px-4 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
					<div className="max-w-[48ch]">
						<p className="sl-eyebrow m-0 text-[color:var(--sl-text-on-ink-label)]">Depois da compra</p>
						<h2 className="sl-head mt-3 text-[clamp(28px,4vw,var(--sl-size-section-sm))] leading-[0.98]">
							{blockText(page.contentDoc, "products-final-cta-title") ||
								page.finalCta?.title ||
								"Continue pelo Sarau Safado e pelos projetos do selo."}
						</h2>
					</div>
					<div className="flex flex-wrap gap-3">
						<SlButton href="/sarau-safado" variant="secondary" onInk>
							Sarau Safado
						</SlButton>
						<SlButton href="/contact" variant="secondary" onInk>
							Falar com a loja
						</SlButton>
					</div>
				</div>
			</section>
			<EditorialExtraBlocks doc={page.contentDoc} />
		</div>
	);
}
