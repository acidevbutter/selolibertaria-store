import Image from "next/image";
import { getTranslations } from "@/i18n/server";
import type { EditorialEvent, EditorialSarauPage } from "@/lib/editorial-content";
import { EditorialEyebrow } from "@/ui/editorial/editorial-primitives";
import { LiftOnHover, Reveal } from "@/ui/motion/reveal";
import { YnsLink } from "@/ui/yns-link";

export async function HomeProgramGrid({
	event,
	sarau,
}: {
	event?: EditorialEvent | null;
	sarau?: EditorialSarauPage | null;
}) {
	const t = await getTranslations("Selo");
	const featuredTitle = sarau?.hero?.title || event?.title || t("nav.sarau");
	const featuredSummary =
		sarau?.hero?.body ||
		event?.summary ||
		"Leituras, aparições e encontros presenciais que fazem a literatura sair da página e virar corpo coletivo.";
	const featuredImage = sarau?.hero?.image ?? event?.image ?? null;
	const ctaHref = sarau ? "/sarau-safado" : "/events";
	const ctaLabel = sarau ? "Conhecer o Sarau Safado" : "Ver agenda";

	return (
		<section className="bg-[color:var(--editorial-paper)] py-12 sm:py-16">
			<div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="border border-[color:var(--editorial-border)] bg-[color:var(--editorial-beige)] p-8 sm:p-10 lg:p-12">
					<div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
						<div className="space-y-5">
							<Reveal>
								<EditorialEyebrow>Sarau Safado</EditorialEyebrow>
							</Reveal>
							<Reveal delay={0.04}>
								<h2 className="display-font max-w-[11ch] text-5xl leading-[0.9] font-black uppercase tracking-[-0.06em] sm:text-6xl lg:text-[4.8rem]">
									{featuredTitle}
								</h2>
							</Reveal>
							<Reveal delay={0.08}>
								<p className="max-w-[32rem] text-base leading-8 text-[color:var(--editorial-muted)]">
									{featuredSummary}
								</p>
							</Reveal>
							<Reveal delay={0.12}>
								<YnsLink
									href={ctaHref}
									className="inline-flex h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--editorial-paper)] transition-colors duration-300 hover:bg-[color:var(--editorial-accent)]"
								>
									{ctaLabel}
								</YnsLink>
							</Reveal>
						</div>
						<Reveal delay={0.08}>
							<LiftOnHover>
								{featuredImage?.src ? (
									<div className="relative min-h-[320px] overflow-hidden bg-[color:var(--editorial-ink)] lg:min-h-[360px]">
										<Image
											src={featuredImage.src}
											alt={featuredImage.alt || featuredTitle}
											fill
											className="object-cover transition-transform duration-700"
											sizes="(max-width: 1024px) 100vw, 520px"
										/>
										<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,11,0.12),rgba(11,11,11,0.62))]" />
										{featuredImage.caption ? (
											<p className="absolute right-4 bottom-4 max-w-[240px] text-right text-xs uppercase tracking-[0.18em] text-[color:var(--editorial-paper)]">
												{featuredImage.caption}
											</p>
										) : null}
									</div>
								) : (
									<div className="flex min-h-[320px] items-center justify-center bg-[color:var(--editorial-ink)] p-8 text-[color:var(--editorial-paper)] lg:min-h-[360px]">
										<p className="max-w-[320px] text-center text-3xl leading-[1.02] font-black uppercase tracking-[-0.04em]">
											Leitura, corpo e presença ao vivo.
										</p>
									</div>
								)}
							</LiftOnHover>
						</Reveal>
					</div>
				</div>
			</div>
		</section>
	);
}
