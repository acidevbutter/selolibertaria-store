import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";
import { seloAbout, seloSiteMeta } from "@/lib/selolibertaria-content";
import { AboutSection } from "@/ui/about-section";
import { Footer } from "@/ui/footer/footer";
import { Nav } from "@/ui/nav/nav";

export const generateMetadata = async (): Promise<Metadata> => {
	const t = await getTranslations("Selo");
	return {
		title: `${t("about.heroEyebrow")} · ${seloSiteMeta.name}`,
		description: t("about.heroBody"),
	};
};

export default async function AboutPage() {
	const t = await getTranslations("Selo");
	return (
		<div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
			<Nav />
			<main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
				<section className="overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.46),transparent_36%),linear-gradient(180deg,#220607_0%,#050203_100%)] px-6 py-10 text-primary-foreground sm:px-10 sm:py-14">
					<div className="max-w-4xl space-y-5">
						<p className="text-xs uppercase tracking-[0.32em] text-primary-foreground/58 sm:text-sm">
							{t("about.heroEyebrow")}
						</p>
						<h1 className="editorial-serif max-w-3xl text-balance text-5xl leading-[0.95] font-semibold tracking-[-0.04em] sm:text-6xl">
							{t("about.heroTitle")}
						</h1>
						<p className="max-w-2xl text-base leading-8 text-primary-foreground/78 sm:text-lg">
							{t("about.heroBody")}
						</p>
					</div>
				</section>

				<AboutSection
					headingTag="h2"
					showReadMore={false}
					imageSrc={seloAbout.imageSrc}
					imageAlt={seloAbout.imageAlt}
					title={t("about.sectionTitle")}
					body={t("about.sectionBody")}
					extended={t("about.sectionExtended")}
				/>

				<section className="grid gap-6 lg:grid-cols-3">
					<article className="border border-border/60 bg-card/60 p-6">
						<p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
							{t("about.publishingEyebrow")}
						</p>
						<h2 className="editorial-serif mt-3 text-3xl font-semibold">{t("about.publishingTitle")}</h2>
						<p className="mt-3 text-sm leading-7 text-muted-foreground">{t("about.publishingBody")}</p>
					</article>
					<article className="border border-border/60 bg-card/60 p-6">
						<p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
							{t("about.programmingEyebrow")}
						</p>
						<h2 className="editorial-serif mt-3 text-3xl font-semibold">{t("about.programmingTitle")}</h2>
						<p className="mt-3 text-sm leading-7 text-muted-foreground">{t("about.programmingBody")}</p>
					</article>
					<article className="border border-border/60 bg-card/60 p-6">
						<p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
							{t("about.directionEyebrow")}
						</p>
						<h2 className="editorial-serif mt-3 text-3xl font-semibold">{t("about.directionTitle")}</h2>
						<p className="mt-3 text-sm leading-7 text-muted-foreground">{t("about.directionBody")}</p>
					</article>
				</section>

				<section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
					<article className="border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.38),transparent_42%),linear-gradient(180deg,#220607_0%,#050203_100%)] p-6 text-primary-foreground">
						<p className="text-xs uppercase tracking-[0.28em] text-primary-foreground/48">
							{t("about.whyEyebrow")}
						</p>
						<h2 className="editorial-serif mt-3 text-3xl font-semibold tracking-tight">
							{t("about.whyTitle")}
						</h2>
						<p className="mt-4 max-w-2xl text-sm leading-8 text-primary-foreground/72">
							{t("about.whyBody")}
						</p>
					</article>
					<article className="border border-border/60 bg-card/60 p-6">
						<p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
							{t("about.coreEyebrow")}
						</p>
						<p className="editorial-serif mt-3 text-2xl leading-tight font-medium">{t("about.coreTitle")}</p>
					</article>
				</section>
			</main>
			<Footer />
		</div>
	);
}
