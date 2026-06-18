import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";
import { getEditorialAboutPage } from "@/lib/editorial-content-store";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { AboutSection } from "@/ui/about-section";
import { EditorialEyebrow, EditorialPanel, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { Footer } from "@/ui/footer/footer";
import { LiftOnHover, Reveal } from "@/ui/motion/reveal";
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
				<Reveal>
					<section className="overflow-hidden border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-paper)] px-6 py-10 sm:px-10 sm:py-14">
						<div className="max-w-4xl space-y-5">
							<EditorialEyebrow className="sm:text-sm">
								{about.hero?.eyebrow || t("about.heroEyebrow")}
							</EditorialEyebrow>
							<h1 className="display-font max-w-3xl text-balance text-5xl leading-[0.92] font-black uppercase tracking-[-0.06em] sm:text-6xl">
								{about.hero?.title || t("about.heroTitle")}
							</h1>
							<p className="max-w-2xl text-base leading-8 text-[color:var(--editorial-muted)] sm:text-lg">
								{about.hero?.body || t("about.heroBody")}
							</p>
						</div>
					</section>
				</Reveal>

				<Reveal delay={0.05}>
					<AboutSection
						headingTag="h2"
						showReadMore={false}
						imageSrc={about.section?.image?.src || undefined}
						imageAlt={about.section?.image?.alt || undefined}
						title={about.section?.title || t("about.sectionTitle")}
						body={about.section?.body || t("about.sectionBody")}
						extended={about.section?.extended || t("about.sectionExtended")}
					/>
				</Reveal>

				<section className="grid gap-6 lg:grid-cols-3">
					{cards.slice(0, 3).map((card, index) => {
						const fallback = [
							{
								eyebrow: t("about.publishingEyebrow"),
								title: t("about.publishingTitle"),
								body: t("about.publishingBody"),
							},
							{
								eyebrow: t("about.programmingEyebrow"),
								title: t("about.programmingTitle"),
								body: t("about.programmingBody"),
							},
							{
								eyebrow: t("about.directionEyebrow"),
								title: t("about.directionTitle"),
								body: t("about.directionBody"),
							},
						][index];

						return (
							<Reveal key={fallback?.title} delay={0.08 * index}>
								<LiftOnHover>
									<EditorialPanel className="p-6">
										<p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
											{card?.eyebrow || fallback?.eyebrow}
										</p>
										<h2 className="editorial-serif mt-3 text-3xl font-semibold">
											{card?.title || fallback?.title}
										</h2>
										<p className="mt-3 text-sm leading-7 text-muted-foreground">
											{card?.body || fallback?.body}
										</p>
									</EditorialPanel>
								</LiftOnHover>
							</Reveal>
						);
					})}
				</section>

				<section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
					<Reveal>
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
					</Reveal>
					<Reveal delay={0.08}>
						<LiftOnHover>
							<EditorialPanel className="bg-[color:var(--editorial-ink)] p-6 text-[color:var(--editorial-paper)]">
								<p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
									{about.closing?.coreEyebrow || t("about.coreEyebrow")}
								</p>
								<p className="mt-3 text-2xl leading-tight font-black uppercase">
									{about.closing?.coreTitle || t("about.coreTitle")}
								</p>
							</EditorialPanel>
						</LiftOnHover>
					</Reveal>
				</section>
			</EditorialShell>
			<Footer />
		</div>
	);
}
