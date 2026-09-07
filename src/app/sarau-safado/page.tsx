import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";
import { getEditorialSarauPage, listEditorialEvents } from "@/lib/editorial-content-store";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { EditorialRichText } from "@/ui/editorial/editorial-rich-text";
import { Footer } from "@/ui/footer/footer";
import { Nav } from "@/ui/nav/nav";
import { SlBand, SlProse } from "@/ui/sl/sl-band";
import { SlButton } from "@/ui/sl/sl-button";
import { SlEyebrow } from "@/ui/sl/sl-section-head";
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
	const signals = sarau.signals?.filter(Boolean).slice(0, 3) ?? [];
	const heroSignals = signals.length > 0 ? signals : ["Leitura em voz alta", "Convidadas", "Entrada franca"];

	const notes = sarau.programNotes?.length
		? sarau.programNotes.slice(0, 3)
		: [
				{
					title: "Origem",
					body: "Nasce da literatura erótica como campo de leitura e encontro, não como tema ornamental.",
				},
				{
					title: "Continuidade",
					body: "Doze edições, público recorrente e uma rede de convidadas que retorna e traz outras.",
				},
				{
					title: "Presença",
					body: "Leitura em voz alta, corpo em cena e escuta coletiva no mesmo espaço.",
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
		<div
			className="sl-scope flex min-h-full flex-1 flex-col"
			style={{ background: "var(--sl-surface-page)" }}
		>
			<Nav />
			<main className="flex flex-1 flex-col">
				{/* Hero — ink */}
				<SlBand
					tone="ink"
					innerClassName="flex flex-wrap items-end justify-between gap-8 px-4 py-14 sm:px-8 lg:px-12"
				>
					<div className="flex max-w-[52ch] flex-col gap-3.5">
						<SlEyebrow onInk>{sarau.hero?.eyebrow || t("nav.sarau")}</SlEyebrow>
						<h1 className="sl-head m-0 text-[clamp(38px,6vw,var(--sl-size-hero-md))] leading-[0.95]">
							{sarau.hero?.title || t("sarau.heroTitle")}
						</h1>
						<p className="m-0 max-w-[48ch] text-[var(--sl-size-lead)] leading-[1.75] text-[color:var(--sl-text-on-ink-muted)]">
							{sarau.hero?.body || t("sarau.heroBody")}
						</p>
						<div className="flex flex-wrap gap-3 pt-2.5">
							<SlButton
								href={sarau.hero?.primaryCtaHref || "/events"}
								variant="primary"
								className="bg-[color:var(--sl-paper)] text-[color:var(--sl-ink)] hover:bg-[color:var(--sl-sand)]"
							>
								{sarau.hero?.primaryCtaLabel || "Próxima edição"}
							</SlButton>
							<SlButton href={sarau.hero?.secondaryCtaHref || "/events"} variant="secondary" onInk>
								{sarau.hero?.secondaryCtaLabel || "Memória do Sarau"}
							</SlButton>
						</div>
					</div>
					<div className="flex flex-none flex-wrap gap-2">
						{heroSignals.map((signal) => (
							<span
								key={signal}
								className="inline-flex h-[var(--sl-h-chip)] items-center border border-[color:var(--sl-line-on-ink-hi)] px-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--sl-text-on-ink)]"
							>
								{signal}
							</span>
						))}
					</div>
				</SlBand>

				{/* Agenda — paper */}
				<SlBand
					tone="paper"
					innerClassName="grid gap-10 px-4 py-16 sm:px-8 lg:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] lg:items-start lg:px-12"
				>
					<div className="flex flex-col gap-4">
						<SlEyebrow>{sarau.agenda?.eyebrow || "Agenda"}</SlEyebrow>
						<div className="border-b border-[color:var(--sl-line-hairline)] pb-5">
							<h2 className="sl-head m-0 text-[clamp(28px,4vw,var(--sl-size-section))] leading-[0.98]">
								{sarau.agenda?.title || "Próxima edição e encontros recentes"}
							</h2>
						</div>
						<SlProse
							source={
								sarau.agenda?.body ||
								"Cada edição reforça a circulação entre livros, artistas convidadas, bibliotecas, instituições e leitoras recorrentes."
							}
							className="max-w-[44ch] text-[var(--sl-size-body)] leading-[1.7] text-[color:var(--sl-text-muted)]"
						/>
					</div>
					<div className="flex flex-col gap-6">
						{agenda.length > 0 ? (
							agenda.map((event) => (
								<div
									key={event.slug}
									className="grid gap-3 border-b border-[color:var(--sl-line-hairline)] pb-6 [grid-template-columns:5.5rem_minmax(0,1fr)]"
								>
									<p className="sl-lbl m-0 text-[color:var(--sl-accent)]">{event.period || "Agenda"}</p>
									<div className="flex flex-col gap-2">
										<h3 className="sl-head m-0 text-[var(--sl-size-card-title)] leading-[1.05]">
											{event.title}
										</h3>
										<div className="text-[var(--sl-size-meta)] leading-[1.7] text-[color:var(--sl-text-muted)]">
											{event.location ? <p className="m-0">{event.location}</p> : null}
											<EditorialRichText source={event.summary} />
										</div>
									</div>
								</div>
							))
						) : (
							<p className="m-0 border-b border-[color:var(--sl-line-hairline)] pb-6 text-[var(--sl-size-meta)] leading-[1.7] text-[color:var(--sl-text-muted)]">
								A agenda do Sarau será atualizada em breve.
							</p>
						)}
						<YnsLink href="/events" className="sl-btn sl-btn-secondary self-start">
							Ver agenda completa
						</YnsLink>
					</div>
				</SlBand>

				{/* Galeria / memória — ink */}
				<SlBand
					tone="ink"
					innerClassName="grid gap-10 px-4 py-16 sm:px-8 lg:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] lg:items-center lg:px-12"
				>
					<div className="flex flex-col gap-4">
						<SlEyebrow onInk>{sarau.gallery?.eyebrow || "Galeria / memória"}</SlEyebrow>
						<h2 className="sl-head m-0 max-w-[20ch] text-[clamp(28px,4vw,var(--sl-size-section))] leading-[0.98]">
							{sarau.gallery?.title || "Fotos grandes, vídeos, textos e registros"}
						</h2>
						<SlProse
							source={sarau.why?.body || sarau.gallery?.body || t("sarau.whyBody")}
							className="max-w-[46ch] text-[var(--sl-size-body)] leading-[1.8] text-[color:var(--sl-text-on-ink-muted)]"
						/>
					</div>
					<div className="grid gap-[var(--sl-grid-gap)] [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
						{notes.map((note, index) => (
							<div
								key={note.title}
								className={
									index === 1
										? "flex min-h-[272px] flex-col justify-end p-5 text-[color:var(--sl-text)]"
										: "flex min-h-[272px] flex-col justify-end border border-[color:var(--sl-line-on-ink)] p-5"
								}
								style={index === 1 ? { background: "var(--sl-surface-band)" } : undefined}
							>
								<p
									className={
										index === 1 ? "sl-lbl m-0" : "sl-lbl m-0 text-[color:var(--sl-text-on-ink-soft)]"
									}
								>
									{note.title}
								</p>
								<p
									className={
										index === 1
											? "m-0 mt-3 text-[var(--sl-size-meta)] leading-[1.7] text-[color:var(--sl-text-muted)]"
											: "m-0 mt-3 text-[var(--sl-size-meta)] leading-[1.7] text-[color:var(--sl-text-on-ink-muted)]"
									}
								>
									{note.body}
								</p>
							</div>
						))}
					</div>
				</SlBand>

				{/* Continue band — sand */}
				<SlBand
					tone="sand"
					innerClassName="flex flex-wrap items-center justify-between gap-6 px-4 py-12 sm:px-8 lg:px-12"
				>
					<h2 className="sl-head m-0 max-w-[34ch] text-[clamp(26px,3.4vw,var(--sl-size-section-sm))] leading-[1]">
						Eventos vivem aqui como agenda do Sarau
					</h2>
					<div className="flex flex-wrap gap-3">
						{continueLinks.map((link, index) => (
							<SlButton key={link.href} href={link.href} variant={index === 0 ? "primary" : "secondary"}>
								{link.label}
							</SlButton>
						))}
					</div>
				</SlBand>
			</main>
			<Footer />
		</div>
	);
}
