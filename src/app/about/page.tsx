import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";
import { getEditorialAboutPage } from "@/lib/editorial-content-store";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { AboutSection } from "@/ui/about-section";
import { EditorialEyebrow, EditorialPanel, EditorialShell } from "@/ui/editorial/editorial-primitives";
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
	const about = await getEditorialAboutPage();
	const cards = about.cards ?? [];
	return (
		<div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
			<Nav />
			<EditorialShell className="flex flex-1 flex-col gap-8 py-8">
				<section className="overflow-hidden border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-paper)] px-6 py-10 sm:px-10 sm:py-14">
					<div className="max-w-4xl space-y-5">
						<EditorialEyebrow className="sm:text-sm">
							{about.hero?.eyebrow || t("about.heroEyebrow")}
						</EditorialEyebrow>
						<h1 className="max-w-3xl text-balance text-5xl leading-[0.92] font-black uppercase tracking-[-0.06em] sm:text-6xl">
							{about.hero?.title || t("about.heroTitle")}
						</h1>
						<p className="max-w-2xl text-base leading-8 text-[color:var(--editorial-muted)] sm:text-lg">
							{about.hero?.body || t("about.heroBody")}
						</p>
					</div>
				</section>

				<AboutSection
					headingTag="h2"
					showReadMore={false}
					imageSrc={about.section?.image?.src || undefined}
					imageAlt={about.section?.image?.alt || undefined}
					title={about.section?.title || t("about.sectionTitle")}
					body={about.section?.body || t("about.sectionBody")}
					extended={about.section?.extended || t("about.sectionExtended")}
				/>

				<section className="grid gap-6 lg:grid-cols-3">
					<EditorialPanel className="p-6">
						<p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
							{cards[0]?.eyebrow || t("about.publishingEyebrow")}
						</p>
						<h2 className="editorial-serif mt-3 text-3xl font-semibold">
							{cards[0]?.title || t("about.publishingTitle")}
						</h2>
						<p className="mt-3 text-sm leading-7 text-muted-foreground">
							{cards[0]?.body || t("about.publishingBody")}
						</p>
					</EditorialPanel>
					<EditorialPanel className="p-6">
						<p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
							{cards[1]?.eyebrow || t("about.programmingEyebrow")}
						</p>
						<h2 className="editorial-serif mt-3 text-3xl font-semibold">
							{cards[1]?.title || t("about.programmingTitle")}
						</h2>
						<p className="mt-3 text-sm leading-7 text-muted-foreground">
							{cards[1]?.body || t("about.programmingBody")}
						</p>
					</EditorialPanel>
					<EditorialPanel className="p-6">
						<p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
							{cards[2]?.eyebrow || t("about.directionEyebrow")}
						</p>
						<h2 className="editorial-serif mt-3 text-3xl font-semibold">
							{cards[2]?.title || t("about.directionTitle")}
						</h2>
						<p className="mt-3 text-sm leading-7 text-muted-foreground">
							{cards[2]?.body || t("about.directionBody")}
						</p>
					</EditorialPanel>
				</section>

				<section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
					<article className="border-l-[12px] border-[color:var(--editorial-accent)] bg-[color:var(--editorial-beige)] p-6">
						<p className="text-xs uppercase tracking-[0.28em] text-[color:var(--editorial-muted)]">
							{about.closing?.eyebrow || t("about.whyEyebrow")}
						</p>
						<h2 className="mt-3 text-3xl font-black uppercase tracking-tight">
							{about.closing?.title || t("about.whyTitle")}
						</h2>
						<p className="mt-4 max-w-2xl text-sm leading-8 text-[color:var(--editorial-muted)]">
							{about.closing?.body || t("about.whyBody")}
						</p>
					</article>
					<EditorialPanel className="p-6 bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)]">
						<p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
							{about.closing?.coreEyebrow || t("about.coreEyebrow")}
						</p>
						<p className="mt-3 text-2xl leading-tight font-black uppercase">
							{about.closing?.coreTitle || t("about.coreTitle")}
						</p>
					</EditorialPanel>
				</section>
			</EditorialShell>
			<Footer />
		</div>
	);
}
