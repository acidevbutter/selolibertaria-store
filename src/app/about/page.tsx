import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "@/i18n/server";
import { getEditorialAboutPage } from "@/lib/editorial-content-store";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { EditorialEyebrow, EditorialPanel, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { Footer } from "@/ui/footer/footer";
import { LiftOnHover, Reveal } from "@/ui/motion/reveal";
import { Nav } from "@/ui/nav/nav";
import { YnsLink } from "@/ui/yns-link";

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
			<div className="flex flex-1 flex-col">
				<Reveal>
					<section className="overflow-hidden border-b border-[color:var(--editorial-border)] bg-[color:var(--editorial-paper)]">
						<EditorialShell className="grid gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
							<div className="max-w-5xl space-y-5">
								<EditorialEyebrow className="text-[color:var(--editorial-accent)] sm:text-sm">
									{about.hero?.eyebrow || t("about.heroEyebrow")}
								</EditorialEyebrow>
								<h1 className="display-font max-w-5xl text-balance text-5xl leading-[0.92] font-black tracking-[-0.06em] sm:text-6xl">
									{about.hero?.title || t("about.heroTitle")}
								</h1>
							</div>
							<p className="max-w-2xl text-base leading-8 text-[color:var(--editorial-ink)] sm:text-lg">
								{about.hero?.body || t("about.heroBody")}
							</p>
						</EditorialShell>
					</section>
				</Reveal>

				<Reveal delay={0.05}>
					<section className="bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)]">
						<EditorialShell className="grid gap-8 px-6 py-10 sm:px-8 sm:py-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
							<div className="flex justify-center lg:justify-start">
								{about.section?.image?.src ? (
									<Image
										src={about.section.image.src}
										alt={about.section.image.alt || about.section?.title || t("about.sectionTitle")}
										width={520}
										height={520}
										className="w-full max-w-[20rem] border border-white/25 object-cover sm:max-w-[22rem]"
									/>
								) : (
									<div className="flex aspect-square w-full max-w-[20rem] items-center justify-center border border-white/20 px-6 text-center text-sm uppercase tracking-[0.24em] text-[color:rgba(247,244,239,0.72)]">
										Foto / autoria
									</div>
								)}
							</div>
							<div className="max-w-3xl space-y-5">
								<EditorialEyebrow className="text-[color:rgba(247,244,239,0.72)]">
									Autoria e curadoria
								</EditorialEyebrow>
								<h2 className="text-4xl leading-[0.95] font-black tracking-[-0.05em] sm:text-5xl">
									{about.section?.title || t("about.sectionTitle")}
								</h2>
								<p className="text-base leading-8 text-[color:rgba(247,244,239,0.82)]">
									{about.section?.body || t("about.sectionBody")}
								</p>
								<p className="text-base leading-8 text-[color:rgba(247,244,239,0.72)]">
									{about.section?.extended || t("about.sectionExtended")}
								</p>
								<YnsLink
									href="/sarau-safado"
									className="inline-flex min-h-11 items-center justify-center bg-[color:var(--editorial-paper)] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-ink)] transition-colors duration-300 hover:bg-[color:var(--editorial-beige)]"
								>
									Conhecer Sarau Safado
								</YnsLink>
							</div>
						</EditorialShell>
					</section>
				</Reveal>

				<EditorialShell className="grid gap-6 py-8 lg:grid-cols-3">
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
										<p className="text-xs uppercase tracking-[0.28em] text-[color:var(--editorial-accent)]">
											{card?.eyebrow || fallback?.eyebrow}
										</p>
										<h2 className="mt-3 text-3xl leading-[1] font-black tracking-[-0.04em]">
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
				</EditorialShell>

				<EditorialShell className="grid gap-6 py-8 lg:grid-cols-[1.1fr_0.9fr]">
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
								<p className="text-xs uppercase tracking-[0.28em] text-[color:rgba(247,244,239,0.72)]">
									{about.closing?.coreEyebrow || t("about.coreEyebrow")}
								</p>
								<p className="mt-3 text-2xl leading-tight font-black">
									{about.closing?.coreTitle || t("about.coreTitle")}
								</p>
							</EditorialPanel>
						</LiftOnHover>
					</Reveal>
				</EditorialShell>
			</div>
			<Footer />
		</div>
	);
}
