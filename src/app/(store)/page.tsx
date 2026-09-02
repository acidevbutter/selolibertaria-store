import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { getLocale } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { canBuyOnSelolibertaria } from "@/lib/authz";
import { commerce } from "@/lib/commerce";
import { getRequestPreferredCurrency } from "@/lib/currency-preference";
import {
	getEditorialHomePage,
	getEditorialSarauPage,
	listEditorialEvents,
} from "@/lib/editorial-content-store";
import { buildSlProductRows, deriveSlCategories } from "@/lib/sl-catalog";
import { formatMoney } from "@/lib/utils";
import { SlHomeCategoryBand } from "@/ui/home/sl/sl-home-category-band";
import { SlHomeFeatured } from "@/ui/home/sl/sl-home-featured";
import { SlHomeHero } from "@/ui/home/sl/sl-home-hero";
import { SlHomeManifesto } from "@/ui/home/sl/sl-home-manifesto";

export const metadata: Metadata = {
	alternates: { canonical: publicUrl },
};

export const dynamic = "force-dynamic";

const HERO_FALLBACK_IMAGE = "/images/selolibertaria/virus-do-beijo-cover.png";

export default async function Home() {
	const [homeContent, locale, session, currency] = await Promise.all([
		getEditorialHomePage(),
		getLocale(),
		auth(),
		getRequestPreferredCurrency(),
	]);

	const [featuredEvents, sarauPage, heroProduct, featuredProduct, browse] = await Promise.all([
		listEditorialEvents(),
		getEditorialSarauPage(),
		homeContent.hero?.mode === "product" && homeContent.hero.productSlug
			? commerce.product.get({ slug: homeContent.hero.productSlug, currency }).catch(() => null)
			: Promise.resolve(null),
		homeContent.featuredBook?.productSlug
			? commerce.product.get({ slug: homeContent.featuredBook.productSlug, currency }).catch(() => null)
			: Promise.resolve(null),
		commerce.product.browse({ first: 100, currency }).catch(() => ({ data: [] })),
	]);

	const canPurchase = canBuyOnSelolibertaria(session?.user.role);
	const rows = buildSlProductRows(browse.data, { locale, canPurchase });
	const categories = deriveSlCategories(rows);
	const featuredEvent = featuredEvents.find((event) => event.published) ?? null;

	// --- Hero resolution: product-backed when possible, editorial copy otherwise.
	const hero = homeContent.hero ?? null;
	const heroSource = heroProduct ?? featuredProduct ?? null;
	const heroPrice = heroSource
		? formatMoney({
				amount: heroSource.variants?.[0]?.price ?? heroSource.price ?? 0,
				currency: heroSource.currency,
				locale,
			})
		: null;
	const heroPriceMinor = heroSource ? (heroSource.variants?.[0]?.price ?? heroSource.price ?? 0) : 0;
	const heroInstallment =
		heroSource && heroPriceMinor >= 15000
			? `ou 6x de ${formatMoney({
					amount: Math.round(heroPriceMinor / 6),
					currency: heroSource.currency,
					locale,
				})} sem juros`
			: null;

	return (
		<div className="sl-scope" style={{ background: "var(--sl-surface-page)" }}>
			<SlHomeHero
				eyebrow={hero?.eyebrow || "Lançamento"}
				tags={hero?.supportingLine ? [hero.supportingLine] : ["Catálogo do selo"]}
				title={heroSource?.name || hero?.title || "little fish, big fish"}
				blurb={
					heroSource?.summary ||
					hero?.description ||
					"Editora e produtora cultural dedicada à literatura erótica, à performance e aos encontros."
				}
				imageUrl={heroSource?.images[0] || hero?.featureImage?.src || HERO_FALLBACK_IMAGE}
				imageAlt={hero?.featureImage?.alt || heroSource?.name || "Selo Libertária"}
				priceLabel={heroPrice}
				installmentLabel={heroInstallment}
				primaryHref={heroSource ? `/product/${heroSource.slug}` : hero?.primaryCtaHref || "/products"}
				primaryLabel={heroSource ? "Comprar agora" : hero?.primaryCtaLabel || "Ver a loja"}
				secondaryHref={hero?.secondaryCtaHref || "/products"}
				secondaryLabel={hero?.secondaryCtaLabel || "Ver o catálogo"}
				metaItems={[
					"Pix, cartão ou boleto",
					"Frete calculado no carrinho",
					"Envio com rastreio pelo Melhor Envio",
				]}
			/>

			<SlHomeCategoryBand categories={categories} />

			<SlHomeFeatured rows={rows} />

			<SlHomeManifesto
				title={homeContent.manifesto?.title || "Literatura que acende presença"}
				body={
					homeContent.manifesto?.body ||
					"Editora e produtora cultural de São Paulo. Publicamos livros, edições sonoras, zines e objetos — e produzimos saraus e laboratórios de escrita."
				}
				linkLabel={homeContent.manifesto?.linkLabel || "Conhecer o selo"}
				linkHref={homeContent.manifesto?.linkHref || "/about"}
				sarau={{
					eyebrow: "Sarau Safado · próxima edição",
					data: featuredEvent?.period || sarauPage?.agenda?.title || "Agenda em breve",
					local: featuredEvent?.location || "São Paulo · centro",
					entrada: "R$ 30,00",
					ctaLabel: "Garantir ingresso",
					ctaHref: featuredEvent ? "/events" : "/sarau-safado",
				}}
			/>
		</div>
	);
}
