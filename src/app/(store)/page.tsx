import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { commerce } from "@/lib/commerce";
import { getRequestPreferredCurrency } from "@/lib/currency-preference";
import { HomeAuthorSpotlight } from "@/ui/home/home-author-spotlight";
import { HomeCommunityCta } from "@/ui/home/home-community-cta";
import { HomeFeaturedBooks } from "@/ui/home/home-featured-books";
import { HomeHero } from "@/ui/home/home-hero";
import { HomeImmersiveGallery } from "@/ui/home/home-immersive-gallery";
import { HomeManifesto } from "@/ui/home/home-manifesto";
import { HomeProgramGrid } from "@/ui/home/home-program-grid";
import { YnsLink } from "@/ui/yns-link";

export const metadata: Metadata = {
	alternates: { canonical: publicUrl },
};

export const dynamic = "force-dynamic";

export default async function Home() {
	try {
		const result = await commerce.product.browse({ first: 6, currency: await getRequestPreferredCurrency() });
		const products = result.data || [];

		return (
			<div className="space-y-8 pb-8 md:space-y-10">
				<HomeHero />
				<HomeFeaturedBooks products={products} />
				<HomeManifesto />
				<HomeProgramGrid />
				<HomeImmersiveGallery />
				<HomeAuthorSpotlight />
				<HomeCommunityCta />
			</div>
		);
	} catch (error) {
		return (
			<div className="space-y-8 pb-8 md:space-y-10">
				<HomeHero />
				<section className="border border-red-500/30 bg-red-500/8 p-4 text-center text-sm text-red-700 dark:text-red-300">
					The editorial home is available, but the live catalogue could not be loaded right now.
					<br />
					<small>{error instanceof Error ? error.message : "Unknown product loading error"}</small>
				</section>
				<div className="flex justify-center">
					<YnsLink
						className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium transition-colors hover:bg-accent"
						href="/projects"
					>
						View projects
					</YnsLink>
				</div>
				<HomeManifesto />
				<HomeProgramGrid />
				<HomeImmersiveGallery />
				<HomeAuthorSpotlight />
				<HomeCommunityCta />
			</div>
		);
	}
}
