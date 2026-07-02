import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";
import { getEditorialSarauPage, listEditorialEvents } from "@/lib/editorial-content-store";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { EditorialEyebrow, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { Footer } from "@/ui/footer/footer";
import { LiftOnHover, Reveal } from "@/ui/motion/reveal";
import { Nav } from "@/ui/nav/nav";
import { YnsLink } from "@/ui/yns-link";

export const dynamic = "force-dynamic";

export const generateMetadata = async (): Promise<Metadata> => {
	const t = await getTranslations("Selo");
	return {
		title: `Sarau Safado · ${seloSiteMeta.name}`,
		description: t("sarau.metadataDescription"),
	};
};

export default async function SarauSafadoPage() {
	const t = await getTranslations("Selo");
	const [sarau, events] = await Promise.all([getEditorialSarauPage(), listEditorialEvents()]);
	const agenda = events.filter((event) => event.published).slice(0, 3);
	const signals = sarau.signals?.filter(Boolean) ?? [];
	const notes = sarau.programNotes?.length
		? sarau.programNotes
		: [
				{
					title: "O Sarau Safado existe como ritual recorrente de leitura, presença e escuta.",
					body: "Em vez de um evento avulso, ele sustenta continuidade: cria público, prolonga o catálogo e abre espaço para vozes convidadas dentro de uma linha curatorial nítida.",
				},
				{
					title: "Origem",
					body: "O programa nasce da literatura erótica como campo de leitura e encontro, não como tema ornamental da marca.",
				},
				{
					title: "Continuidade",
					body: "Cada edição reforça a circulação entre livros, artistas convidadas, bibliotecas, instituições e leitoras recorrentes.",
				},
				{
					title: "Presença",
					body: "O sarau transforma leitura em acontecimento público e ajuda a dar corpo ao imaginário do selo fora da prateleira.",
				},
			];
	const continueLinks = sarau.continueLinks?.length
		? sarau.continueLinks
		: [
				{ label: t("sarau.linkEvents"), href: "/events" },
				{ label: t("sarau.linkProjects"), href: "/projects" },
				{ label: t("sarau.linkBooks"), href: "/products" },
			];

	return (
		<div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
			<Nav />
			<div className="flex flex-1 flex-col">
				<Reveal>
					<section
						className="relative overflow-hidden bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)]"
						style={
							sarau.hero?.image?.src
								? {
										backgroundImage: `linear-gradient(120deg, rgba(11,11,11,0.9) 0%, rgba(11,11,11,0.82) 46%, rgba(11,11,11,0.72) 100%), url(${sarau.hero.image.src})`,
										backgroundPosition: "center",
										backgroundRepeat: "no-repeat",
										backgroundSize: "cover",
									}
								: undefined
						}
					>
						<EditorialShell className="relative flex min-h-[440px] flex-col justify-between px-6 py-8 sm:min-h-[520px] sm:px-10 sm:py-10">
							<div className="max-w-3xl space-y-4">
								<EditorialEyebrow className="text-[color:rgba(247,244,239,0.72)] sm:text-sm">
									{sarau.hero?.eyebrow || t("nav.sarau")}
								</EditorialEyebrow>
								<h1 className="display-font mt-4 max-w-4xl text-5xl font-black tracking-[-0.06em] text-[color:var(--editorial-paper)] sm:text-6xl">
									{sarau.hero?.title || t("sarau.heroTitle")}
								</h1>
								<p className="max-w-2xl text-base leading-8 text-[color:rgba(247,244,239,0.82)] sm:text-lg">
									{sarau.hero?.body || t("sarau.heroBody")}
								</p>
								<div className="flex flex-wrap gap-3 pt-2">
									<YnsLink
										href={sarau.hero?.primaryCtaHref || "/events"}
										className="inline-flex min-h-11 items-center justify-center bg-[color:var(--editorial-paper)] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-ink)] transition-colors duration-300 hover:bg-[color:var(--editorial-beige)]"
									>
										{sarau.hero?.primaryCtaLabel || "Próxima edição"}
									</YnsLink>
									<YnsLink
										href={sarau.hero?.secondaryCtaHref || "/events"}
										className="inline-flex min-h-11 items-center justify-center border border-white/20 px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-paper)] transition-colors duration-300 hover:bg-white/8"
									>
										{sarau.hero?.secondaryCtaLabel || "Memória do Sarau"}
									</YnsLink>
								</div>
								{signals.length > 0 ? (
									<div className="flex flex-wrap gap-2 pt-2">
										{signals.map((signal) => (
											<span
												key={signal}
												className="border border-[color:rgba(247,244,239,0.22)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:rgba(247,244,239,0.72)]"
											>
												{signal}
											</span>
										))}
									</div>
								) : null}
							</div>
						</EditorialShell>
					</section>
				</Reveal>

				<EditorialShell className="grid gap-8 py-10 lg:grid-cols-[1fr_1fr] lg:items-start">
					<Reveal>
						<div className="space-y-4">
							<EditorialEyebrow className="text-[color:var(--editorial-accent)]">Agenda</EditorialEyebrow>
							<h2 className="max-w-3xl text-4xl leading-[0.95] font-black tracking-[-0.05em]">
								Próxima edição e encontros recentes.
							</h2>
						</div>
					</Reveal>
					<Reveal delay={0.08}>
						<div className="grid gap-8">
							{agenda.map((event) => (
								<div
									key={event.slug}
									className="grid gap-3 border-b border-[color:var(--editorial-border)] pb-6 sm:grid-cols-[5.5rem_1fr]"
								>
									<div className="text-3xl font-black text-[color:var(--editorial-accent)]">
										{event.period?.slice(0, 6).toUpperCase() || "AGENDA"}
									</div>
									<div>
										<h3 className="text-2xl font-semibold">{event.title}</h3>
										<p className="mt-1 text-sm text-[color:var(--editorial-muted)]">
											{event.location} · {event.summary}
										</p>
									</div>
								</div>
							))}
						</div>
					</Reveal>
				</EditorialShell>

				<section className="bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)]">
					<EditorialShell className="grid gap-6 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
						<Reveal>
							<div className="space-y-4">
								<EditorialEyebrow className="text-[color:rgba(247,244,239,0.7)]">
									Galeria / memória
								</EditorialEyebrow>
								<h2 className="max-w-2xl text-4xl leading-[0.95] font-black tracking-[-0.05em]">
									Fotos grandes, vídeos, textos e registros.
								</h2>
								<p className="max-w-2xl text-sm leading-7 text-[color:rgba(247,244,239,0.72)]">
									{sarau.why?.body || t("sarau.whyBody")}
								</p>
							</div>
						</Reveal>
						<div className="grid gap-4 sm:grid-cols-3">
							{notes.slice(1, 4).map((note, index) => (
								<Reveal key={note.title} delay={0.08 * index}>
									<LiftOnHover>
										<div
											className={
												index === 1
													? "flex min-h-[17rem] flex-col justify-end bg-[color:var(--editorial-beige)] p-5 text-[color:var(--editorial-ink)]"
													: "flex min-h-[17rem] flex-col justify-end border border-white/30 bg-[color:rgba(247,244,239,0.08)] p-5"
											}
										>
											<p
												className={
													index === 1
														? "text-xs uppercase tracking-[0.22em] text-[color:var(--editorial-muted)]"
														: "text-xs uppercase tracking-[0.22em] text-[color:rgba(247,244,239,0.72)]"
												}
											>
												{note.title}
											</p>
											<p
												className={
													index === 1
														? "mt-3 text-sm leading-7 text-[color:var(--editorial-muted)]"
														: "mt-3 text-sm leading-7 text-[color:rgba(247,244,239,0.72)]"
												}
											>
												{note.body}
											</p>
										</div>
									</LiftOnHover>
								</Reveal>
							))}
						</div>
					</EditorialShell>
				</section>

				<Reveal>
					<section className="bg-[color:rgba(216,208,196,0.55)]">
						<EditorialShell className="px-6 py-8 sm:px-8 sm:py-10">
							<h2 className="max-w-4xl text-3xl leading-[1.05] font-black sm:text-4xl">
								Eventos vivem aqui como agenda do Sarau, não como item principal do menu.
							</h2>
							<div className="mt-6 flex flex-wrap gap-3">
								{continueLinks.map((link) => (
									<YnsLink
										key={link.href}
										href={link.href}
										className="inline-flex min-h-11 items-center justify-center border border-[color:var(--editorial-border)] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-ink)] transition-colors duration-300 hover:bg-white/45"
									>
										{link.label}
									</YnsLink>
								))}
							</div>
						</EditorialShell>
					</section>
				</Reveal>
			</div>
			<Footer />
		</div>
	);
}
