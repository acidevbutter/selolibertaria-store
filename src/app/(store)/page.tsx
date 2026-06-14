import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { getTranslations } from "@/i18n/server";
import { commerce } from "@/lib/commerce";
import { getRequestPreferredCurrency } from "@/lib/currency-preference";
import { getEditorialHomePage } from "@/lib/editorial-content-store";
import { EditorialShell } from "@/ui/editorial/editorial-primitives";
import { HomeCommunityCta } from "@/ui/home/home-community-cta";
import { HomeFeaturedBooks } from "@/ui/home/home-featured-books";
import { HomeHero } from "@/ui/home/home-hero";
import { HomeManifesto } from "@/ui/home/home-manifesto";
import { HomeProgramGrid } from "@/ui/home/home-program-grid";
import { YnsLink } from "@/ui/yns-link";

export const metadata: Metadata = {
	alternates: { canonical: publicUrl },
};

export const dynamic = "force-dynamic";

export default async function Home() {
	const [homeContent, t] = await Promise.all([getEditorialHomePage(), getTranslations("Selo.home.fallback")]);
	try {
		const result = await commerce.product.browse({ first: 6, currency: await getRequestPreferredCurrency() });
		const products = result.data || [];

		return (
			<div className="space-y-8 pb-12 md:space-y-12">
				<HomeHero content={homeContent.hero} />
				<EditorialShell className="space-y-8 md:space-y-12">
					<HomeManifesto content={homeContent.manifesto} />
					<HomeFeaturedBooks products={products} />
					<HomeProgramGrid />
					<HomeCommunityCta content={homeContent.community} />
				</EditorialShell>
			</div>
		);
	} catch (error) {
		return (
			<div className="space-y-8 pb-12 md:space-y-12">
				<HomeHero content={homeContent.hero} />
				<EditorialShell className="space-y-8 md:space-y-12">
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
					<HomeManifesto content={homeContent.manifesto} />
					<HomeProgramGrid />
					<HomeCommunityCta content={homeContent.community} />
				</EditorialShell>
			</div>
		);
	}
}
