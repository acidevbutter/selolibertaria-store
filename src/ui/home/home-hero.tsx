import Image from "next/image";
import { getTranslations } from "@/i18n/server";
import type { EditorialHomePage } from "@/lib/editorial-content";
import { EditorialEyebrow, EditorialPanel, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { LiftOnHover, Reveal } from "@/ui/motion/reveal";
import { YnsLink } from "@/ui/yns-link";

export async function HomeHero({ content }: { content?: EditorialHomePage["hero"] | null }) {
	const t = await getTranslations("Selo");
	const hero = content ?? null;

	return (
		<section className="overflow-hidden bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)]">
			<EditorialShell className="grid min-h-[auto] grid-cols-1 gap-10 py-8 sm:py-10 lg:min-h-[min(840px,calc(100vh-7rem))] lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14 lg:py-14">
				<div className="flex max-w-2xl flex-col justify-center space-y-6 lg:space-y-8">
					<Reveal>
						<EditorialEyebrow className="text-[color:rgba(247,244,239,0.7)] sm:text-sm">
							{hero?.eyebrow || t("home.hero.eyebrow")}
						</EditorialEyebrow>
					</Reveal>
					<Reveal delay={0.05}>
						<h1 className="display-font max-w-4xl text-balance text-[3.5rem] leading-[0.86] font-black tracking-[-0.07em] text-[color:var(--editorial-paper)] uppercase sm:text-[5rem] lg:text-[6.2rem] xl:text-[7rem]">
							{hero?.title || t("home.hero.title")}
						</h1>
					</Reveal>
					<Reveal delay={0.1}>
						<p className="max-w-xl text-pretty text-base leading-8 text-[color:rgba(247,244,239,0.76)] sm:text-xl sm:leading-9">
							{hero?.description || t("home.hero.description")}
						</p>
					</Reveal>
					<Reveal delay={0.15}>
						<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
							<YnsLink
								href={hero?.primaryCtaHref || "/products"}
								className="inline-flex h-12 items-center justify-center bg-[color:var(--editorial-paper)] px-6 text-sm font-medium text-[color:var(--editorial-ink)] transition-colors duration-300 hover:bg-[color:var(--editorial-beige)]"
							>
								{hero?.primaryCtaLabel || t("home.hero.primaryCta")}
							</YnsLink>
							<YnsLink
								href={hero?.secondaryCtaHref || "/events"}
								className="inline-flex h-12 items-center justify-center border border-[color:rgba(247,244,239,0.22)] px-6 text-sm font-medium text-[color:var(--editorial-paper)] transition-colors duration-300 hover:bg-[color:rgba(247,244,239,0.08)]"
							>
								{hero?.secondaryCtaLabel || t("home.hero.secondaryCta")}
							</YnsLink>
						</div>
					</Reveal>
					<Reveal delay={0.2}>
						<p className="max-w-lg border-t border-[color:rgba(247,244,239,0.16)] pt-4 text-sm leading-7 text-[color:rgba(247,244,239,0.58)]">
							{hero?.supportingLine || t("home.hero.supportingLine")}
						</p>
					</Reveal>
				</div>

				<div className="grid gap-5 lg:grid-cols-[0.68fr_0.32fr]">
					<Reveal delay={0.08}>
						<LiftOnHover>
							<div className="relative overflow-hidden border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-beige)] lg:pb-28">
								{hero?.featureImage?.src ? (
									<Image
										src={hero.featureImage.src}
										alt={hero.featureImage.alt || hero.title || t("home.hero.title")}
										width={720}
										height={840}
										priority
										className="h-full min-h-[420px] w-full object-cover object-center transition-transform duration-700"
										sizes="(max-width: 1024px) 100vw, 620px"
									/>
								) : (
									<div className="flex min-h-[420px] items-center justify-center bg-[color:var(--editorial-ink)] p-8 text-center text-[color:var(--editorial-paper)]">
										<p className="max-w-xs text-2xl leading-tight font-black uppercase tracking-[-0.04em]">
											{hero?.featureTitle || t("home.hero.featureTitle")}
										</p>
									</div>
								)}
								<div className="border-t border-[color:var(--editorial-ink)] bg-[color:var(--editorial-paper)] p-5 lg:absolute lg:-bottom-px lg:left-[-38%] lg:w-[78%] lg:border lg:p-8">
									<p className="display-font text-3xl leading-[0.98] font-black tracking-[-0.05em] text-[color:var(--editorial-ink)] sm:text-5xl">
										“Se te começo,
										<br />
										logo me despeço.”
									</p>
								</div>
							</div>
						</LiftOnHover>
					</Reveal>
					<div className="flex flex-col gap-5">
						<Reveal delay={0.14}>
							<EditorialPanel className="bg-[color:var(--editorial-beige)]">
								<p className="text-xs uppercase tracking-[0.28em] text-[color:var(--editorial-accent)] sm:text-sm">
									{hero?.featureEyebrow || t("home.hero.featureEyebrow")}
								</p>
								<p className="display-font mt-4 text-3xl font-black leading-[0.92] tracking-[-0.05em] uppercase">
									{hero?.featureTitle || t("home.hero.featureTitle")}
								</p>
								<p className="mt-4 max-w-md text-sm leading-7 text-[color:var(--editorial-muted)]">
									{hero?.featureBody || t("home.hero.featureBody")}
								</p>
							</EditorialPanel>
						</Reveal>
						<Reveal delay={0.18}>
							<div className="border-l-[10px] border-[color:var(--editorial-accent)] pl-5">
								<p className="text-xs uppercase tracking-[0.28em] text-[color:var(--editorial-muted)]">
									{t("home.hero.nightEdit")}
								</p>
								<p className="mt-4 text-xl leading-tight font-medium sm:text-2xl">
									{hero?.featureQuote || t("home.hero.featureQuote")}
								</p>
							</div>
						</Reveal>
					</div>
				</div>
			</EditorialShell>
		</section>
	);
}
