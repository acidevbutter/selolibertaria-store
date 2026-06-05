import Image from "next/image";
import { getTranslations } from "@/i18n/server";
import { seloHomeHero } from "@/lib/selolibertaria-content";
import { YnsLink } from "@/ui/yns-link";

export async function HomeHero() {
	const t = await getTranslations("Selo");

	return (
		<section className="overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.52),transparent_36%),radial-gradient(circle_at_85%_15%,rgba(239,68,68,0.3),transparent_28%),linear-gradient(180deg,#220607_0%,#050203_100%)] text-primary-foreground shadow-[0_34px_120px_-48px_rgba(0,0,0,0.9)]">
			<div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1.08fr_0.92fr] lg:px-12 lg:py-14">
				<div className="flex max-w-2xl flex-col justify-center space-y-6 lg:space-y-8">
					<p className="text-xs uppercase tracking-[0.32em] text-primary-foreground/60 sm:text-sm">
						{t("home.hero.eyebrow")}
					</p>
					<h1 className="editorial-serif max-w-3xl text-balance text-5xl leading-[0.92] font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
						{t("home.hero.title")}
					</h1>
					<p className="max-w-xl text-pretty text-base leading-8 text-primary-foreground/78 sm:text-lg">
						{t("home.hero.description")}
					</p>
					<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
						<YnsLink
							href={seloHomeHero.primaryCta.href}
							className="inline-flex h-12 items-center justify-center rounded-full bg-red-600 px-6 text-sm font-medium text-black transition-colors hover:bg-red-500"
						>
							{t("home.hero.primaryCta")}
						</YnsLink>
						<YnsLink
							href={seloHomeHero.secondaryCta.href}
							className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-white/10"
						>
							{t("home.hero.secondaryCta")}
						</YnsLink>
					</div>
					<p className="text-sm leading-7 text-primary-foreground/56">{t("home.hero.supportingLine")}</p>
				</div>

				<div className="grid gap-4 lg:gap-5">
					<div className="rounded-[2rem] border border-white/10 bg-black/30 p-6 backdrop-blur-sm">
						<p className="text-xs uppercase tracking-[0.28em] text-primary-foreground/50 sm:text-sm">
							{t("home.hero.featureEyebrow")}
						</p>
						<p className="editorial-serif mt-4 text-2xl leading-tight font-semibold sm:text-[2rem]">
							{t("home.hero.featureTitle")}
						</p>
						<p className="mt-4 max-w-md text-sm leading-7 text-primary-foreground/72">
							{t("home.hero.featureBody")}
						</p>
					</div>

					<div className="grid gap-4 md:grid-cols-[0.7fr_0.3fr]">
						<div className="relative overflow-hidden border border-white/10 bg-[#120d0d]">
							<div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
							<Image
								src={seloHomeHero.featureImage.src}
								alt={seloHomeHero.featureImage.alt}
								width={720}
								height={840}
								priority
								className="h-full min-h-[320px] w-full object-cover object-center"
								sizes="(max-width: 1024px) 100vw, 620px"
							/>
						</div>
						<div className="flex min-h-[320px] flex-col justify-between border border-white/10 bg-[linear-gradient(180deg,rgba(127,29,29,0.88),rgba(17,3,3,0.96))] p-5 text-primary-foreground/78">
							<div className="space-y-3">
								<div className="h-px w-12 bg-red-500" />
								<p className="text-xs uppercase tracking-[0.28em] text-primary-foreground/46">
									{t("home.hero.nightEdit")}
								</p>
							</div>
							<p className="editorial-serif text-xl leading-tight font-medium sm:text-2xl">
								{t("home.hero.featureQuote")}
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
