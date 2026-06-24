import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { getLocale, getTranslations } from "@/i18n/server";
import { commerce } from "@/lib/commerce";
import { getRequestPreferredCurrency } from "@/lib/currency-preference";
import {
	getEditorialHomePage,
	getEditorialSarauPage,
	listEditorialEvents,
} from "@/lib/editorial-content-store";
import { HomeFeaturedBooks } from "@/ui/home/home-featured-books";
import { HomeHero } from "@/ui/home/home-hero";
import { HomeManifesto } from "@/ui/home/home-manifesto";
import { HomeProgramGrid } from "@/ui/home/home-program-grid";
import { YnsLink } from "@/ui/yns-link";

export const metadata: Metadata = {
	alternates: { canonical: publicUrl },
};

export const dynamic = "force-dynamic";

function isMockContent(record: { createdBy?: string | null; updatedBy?: string | null } | null | undefined) {
	return record?.createdBy === "system:mock" || record?.updatedBy === "system:mock";
}

export default async function Home() {
	const [homeContent, featuredEvents, sarauPage, t, locale] = await Promise.all([
		getEditorialHomePage(),
		listEditorialEvents(),
		getEditorialSarauPage(),
		getTranslations("Selo.home.fallback"),
		getLocale(),
	]);
	const shouldPreferTranslatedFallbacks = locale !== DEFAULT_LOCALE;
	const featuredEvent = featuredEvents.find((event) => event.published) ?? null;
	const homeSections =
		shouldPreferTranslatedFallbacks && isMockContent(homeContent)
			? {
					hero: null,
					manifesto: null,
					author: null,
					community: null,
				}
			: homeContent;
	const featuredProgramEvent =
		shouldPreferTranslatedFallbacks && isMockContent(featuredEvent) ? null : featuredEvent;
	const featuredSarauPage =
		shouldPreferTranslatedFallbacks && isMockContent(sarauPage) ? null : sarauPage;
	try {
		const result = await commerce.product.browse({ first: 6, currency: await getRequestPreferredCurrency() });
		const products = result.data || [];

		return (
			<div className="space-y-8 md:space-y-12">
				<HomeHero content={homeSections.hero} />
				<div className="space-y-8 md:space-y-12">
					<HomeManifesto content={homeSections.manifesto} />
					<HomeFeaturedBooks products={products} />
					<HomeProgramGrid event={featuredProgramEvent} sarau={featuredSarauPage} />
				</div>
			</div>
		);
	} catch (error) {
		return (
			<div className="space-y-8 md:space-y-12">
				<HomeHero content={homeSections.hero} />
				<div className="space-y-8 md:space-y-12">
					<section className="border border-red-500/30 bg-red-500/8 p-4 text-center text-sm text-red-700 dark:text-red-300">
						{t("catalogUnavailable")}
						<br />
						<small>{error instanceof Error ? error.message : t("unknownError")}</small>
					</section>
					<div className="flex justify-center">
						<YnsLink
							className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium transition-colors hover:bg-accent"
							href="/projects"
						>
							{t("viewProjects")}
						</YnsLink>
					</div>
					<HomeManifesto content={homeSections.manifesto} />
					<HomeProgramGrid event={featuredProgramEvent} sarau={featuredSarauPage} />
				</div>
			</div>
		);
	}
}
