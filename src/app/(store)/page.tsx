import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { getLocale } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { canBuyOnSelolibertaria } from "@/lib/authz";
import { commerce } from "@/lib/commerce";
import { getRequestPreferredCurrency } from "@/lib/currency-preference";
import { blockButtonLabel, blockImageSrc, blockList, blockText } from "@/lib/editorial-blocks-slots";
import { getEditorialHomePage, listEditorialEvents } from "@/lib/editorial-content-store";
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

const HERO_FALLBACK_IMAGE = "/images/selolibertaria/home-capa-destaque-lfbf.webp";

export default async function Home() {
	const [homeContent, locale, session, currency] = await Promise.all([
		getEditorialHomePage(),
		getLocale(),
		auth(),
		getRequestPreferredCurrency(),
	]);

	const [featuredEvents, heroProduct, featuredProduct, browse] = await Promise.all([
		listEditorialEvents(),
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
	// "arquivo" events are past/archival, not the upcoming edition the Home spotlight promises.
	const featuredEvent = featuredEvents.find((event) => event.published && event.status !== "arquivo") ?? null;

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
				eyebrow={blockText(homeContent.contentDoc, "home-hero-eyebrow") || hero?.eyebrow || "Lançamento"}
				tags={hero?.supportingLine ? [hero.supportingLine] : ["Catálogo do selo"]}
				title={
					heroSource?.name ||
					blockText(homeContent.contentDoc, "home-hero-title") ||
					hero?.title ||
					"little fish, big fish"
				}
				blurb={
					heroSource?.summary ||
					blockText(homeContent.contentDoc, "home-hero-blurb") ||
					hero?.description ||
					"Editora e produtora cultural dedicada à literatura erótica, à performance e aos encontros."
				}
				imageUrl={
					heroSource?.images[0] ||
					blockImageSrc(homeContent.contentDoc, "home-hero-image") ||
					hero?.featureImage?.src ||
					HERO_FALLBACK_IMAGE
				}
				imageAlt={hero?.featureImage?.alt || heroSource?.name || "Selo Libertária"}
				priceLabel={heroPrice}
				installmentLabel={heroInstallment}
				primaryHref={heroSource ? `/product/${heroSource.slug}` : hero?.primaryCtaHref || "/products"}
				primaryLabel={heroSource ? "Comprar agora" : hero?.primaryCtaLabel || "Ver a loja"}
				secondaryHref={hero?.secondaryCtaHref || "/products"}
				secondaryLabel={
					blockButtonLabel(homeContent.contentDoc, "home-hero-secondary-cta") ||
					hero?.secondaryCtaLabel ||
					"Ver o catálogo"
				}
				metaItems={
					blockList(homeContent.contentDoc, "home-hero-meta-items") || [
						"Pix, cartão ou boleto",
						"Frete calculado no carrinho",
						"Envio com rastreio pelo Melhor Envio",
					]
				}
			/>

			<SlHomeCategoryBand categories={categories} />

			<SlHomeFeatured rows={rows} />

			<SlHomeManifesto
				title={
					blockText(homeContent.contentDoc, "home-manifesto-title") ||
					homeContent.manifesto?.title ||
					"Literatura que acende presença"
				}
				body={
					blockText(homeContent.contentDoc, "home-manifesto-body") ||
					homeContent.manifesto?.body ||
					"Editora e produtora cultural de São Paulo. Publicamos livros, edições sonoras, zines e objetos — e produzimos saraus e laboratórios de escrita."
				}
				linkLabel={
					blockButtonLabel(homeContent.contentDoc, "home-manifesto-link-label") ||
					homeContent.manifesto?.linkLabel ||
					"Conhecer o selo"
				}
				linkHref={homeContent.manifesto?.linkHref || "/about"}
				sarau={{
					eyebrow: blockText(homeContent.contentDoc, "home-sarau-eyebrow") || "Sarau Safado · próxima edição",
					data: featuredEvent?.period || "Agenda em breve",
					local: featuredEvent?.location || "São Paulo · centro",
					entrada: blockText(homeContent.contentDoc, "home-sarau-entrada") || "R$ 30,00",
					ctaLabel: blockButtonLabel(homeContent.contentDoc, "home-sarau-cta-label") || "Garantir ingresso",
					ctaHref: featuredEvent ? "/events" : "/sarau-safado",
				}}
			/>
		</div>
	);
}
