import { getTranslations } from "@/i18n/server";
import { seloEvents } from "@/lib/selolibertaria-content";
import { EditorialEyebrow } from "@/ui/editorial/editorial-primitives";
import { YnsLink } from "@/ui/yns-link";

export async function HomeProgramGrid() {
	const t = await getTranslations("Selo");
	const featuredEvent = seloEvents[0];

	return (
		<section className="border border-[color:var(--editorial-border)] bg-[color:var(--editorial-beige)] p-8 sm:p-10">
			<div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
				<div className="space-y-5">
					<EditorialEyebrow>Projetos / eventos</EditorialEyebrow>
					<h2 className="text-5xl leading-[0.9] font-black uppercase tracking-[-0.06em] sm:text-6xl">
						Sarau
						<br />
						Safado
					</h2>
					<p className="max-w-xl text-base leading-8 text-[color:var(--editorial-muted)]">
						{featuredEvent?.summary ??
							"Poesia, performance, corpo e encontro. A página de eventos deve ter agenda simples, memória visual e formulário de interesse."}
					</p>
					<YnsLink
						href="/events"
						className="inline-flex h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--editorial-paper)]"
					>
						{t("home.agenda.link")}
					</YnsLink>
				</div>
				<div className="flex min-h-[280px] items-center justify-center bg-[color:var(--editorial-ink)] p-8 text-[color:var(--editorial-paper)]">
					<p className="max-w-[240px] text-3xl leading-[1.05] font-bold uppercase tracking-[-0.04em]">
						Foto / video / cartaz do evento
					</p>
				</div>
			</div>
		</section>
	);
}
