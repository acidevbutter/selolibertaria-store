import Image from "next/image";
import type { EditorialEvent, EditorialHomePage, EditorialSarauPage } from "@/lib/editorial-content";
import { seloEditorialAssets } from "@/lib/selolibertaria-content";
import { EditorialEyebrow, EditorialSection, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { Reveal } from "@/ui/motion/reveal";
import { YnsLink } from "@/ui/yns-link";

export async function HomeProgramGrid({
	event,
	sarau,
	content,
}: {
	event: EditorialEvent | null;
	sarau: EditorialSarauPage | null;
	content?: EditorialHomePage["program"] | null;
}) {
	const featuredTitle = content?.title || sarau?.title || event?.title || "Sarau Safado";
	const featuredSummary =
		content?.body ||
		sarau?.summary ||
		event?.summary ||
		"Agenda, memória e presença pública em torno das literaturas eróticas.";
	const ctaHref = content?.ctaHref || (sarau ? "/sarau-safado" : "/events");
	const ctaLabel = content?.ctaLabel || (sarau ? "Conhecer o Sarau Safado" : "Ver agenda");

	return (
		<EditorialSection className="bg-[color:var(--editorial-beige)] py-12 sm:py-16">
			<EditorialShell className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
				<div className="space-y-5">
					<Reveal>
						<EditorialEyebrow>{content?.eyebrow || "Sarau Safado"}</EditorialEyebrow>
					</Reveal>
					<Reveal delay={0.04}>
						<h2 className="display-font max-w-[12ch] text-4xl font-black tracking-[-0.05em] sm:text-5xl">
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
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="relative min-h-[280px] overflow-hidden border border-[color:var(--editorial-border)] bg-[color:var(--editorial-paper)]">
							<Image
								src={event?.image?.src || seloEditorialAssets.bookStandingMock}
								alt={event?.image?.alt || event?.title || featuredTitle}
								fill
								className="object-cover"
								sizes="(max-width: 1024px) 100vw, 320px"
							/>
						</div>
						<div className="flex min-h-[280px] flex-col justify-end bg-[color:var(--editorial-ink)] p-6 text-[color:var(--editorial-paper)]">
							<p className="text-xs uppercase tracking-[0.22em] text-[color:rgba(247,244,239,0.62)]">
								{event?.period || event?.status || "Agenda"}
							</p>
							<h3 className="mt-3 text-3xl font-black tracking-[-0.04em]">{event?.title || "Próxima edição"}</h3>
							<p className="mt-3 text-sm leading-7 text-[color:rgba(247,244,239,0.74)]">
								{event?.location || "São Paulo · local a confirmar"}
							</p>
						</div>
					</div>
				</Reveal>
			</EditorialShell>
		</EditorialSection>
	);
}
