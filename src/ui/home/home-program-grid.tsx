import Image from "next/image";
import { getTranslations } from "@/i18n/server";
import type { EditorialEvent, EditorialSarauPage } from "@/lib/editorial-content";
import { EditorialEyebrow } from "@/ui/editorial/editorial-primitives";
import { YnsLink } from "@/ui/yns-link";

export async function HomeProgramGrid({
	event,
	sarau,
}: {
	event?: EditorialEvent | null;
	sarau?: EditorialSarauPage | null;
}) {
	const t = await getTranslations("Selo");
	const featuredTitle = sarau?.hero?.title || event?.title || "Sarau Safado";
	const featuredSummary =
		sarau?.hero?.body ||
		event?.summary ||
		"Poesia, performance, corpo e encontro. A página de eventos deve ter agenda simples, memória visual e formulário de interesse.";
	const featuredImage = sarau?.hero?.image ?? event?.image ?? null;

	return (
		<section className="border border-[color:var(--editorial-border)] bg-[color:var(--editorial-beige)] p-8 sm:p-10">
			<div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
				<div className="space-y-5">
					<EditorialEyebrow>Projetos / eventos</EditorialEyebrow>
					<h2 className="text-5xl leading-[0.9] font-black uppercase tracking-[-0.06em] sm:text-6xl">
						{featuredTitle}
					</h2>
					<p className="max-w-xl text-base leading-8 text-[color:var(--editorial-muted)]">
						{featuredSummary}
					</p>
					<YnsLink
						href={sarau ? "/sarau-safado" : "/events"}
						className="inline-flex h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--editorial-paper)]"
					>
						{sarau ? "Conhecer o Sarau" : t("home.agenda.link")}
					</YnsLink>
				</div>
				{featuredImage?.src ? (
					<div className="relative min-h-[280px] overflow-hidden bg-[color:var(--editorial-ink)]">
						<Image
							src={featuredImage.src}
							alt={featuredImage.alt || featuredTitle}
							fill
							className="object-cover"
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
					<div className="flex min-h-[280px] items-center justify-center bg-[color:var(--editorial-ink)] p-8 text-[color:var(--editorial-paper)]">
						<p className="max-w-[240px] text-3xl leading-[1.05] font-bold uppercase tracking-[-0.04em]">
							Foto / video / cartaz do evento
						</p>
					</div>
				)}
			</div>
		</section>
	);
}
