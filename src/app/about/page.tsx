import type { Metadata } from "next";
import Image from "next/image";
import { blockButtonLabel, blockText } from "@/lib/editorial-blocks-slots";
import { getEditorialAboutPage } from "@/lib/editorial-content-store";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { Footer } from "@/ui/footer/footer";
import { Nav } from "@/ui/nav/nav";
import { SlBand, SlProse } from "@/ui/sl/sl-band";
import { SlButton } from "@/ui/sl/sl-button";
import { SlEyebrow } from "@/ui/sl/sl-section-head";

export const generateMetadata = async (): Promise<Metadata> => {
	const about = await getEditorialAboutPage();

	return {
		title: `${blockText(about.contentDoc, "about-hero-eyebrow") || about.hero?.eyebrow || "Sobre"} · ${seloSiteMeta.name}`,
		description:
			blockText(about.contentDoc, "about-hero-body") ||
			about.hero?.body ||
			"Manifesto, autoria e linha editorial do Selo Libertária em pt-BR.",
	};
};

export default async function AboutPage() {
	const about = await getEditorialAboutPage();
	const cards = (about.cards ?? []).slice(0, 3);

	return (
		<div
			className="sl-scope flex min-h-full flex-1 flex-col"
			style={{ background: "var(--sl-surface-page)" }}
		>
			<Nav />
			<main className="flex flex-1 flex-col">
				{/* Hero — paper, hairline foot */}
				<SlBand
					tone="paper"
					className="border-b border-[color:var(--sl-line-hairline)]"
					innerClassName="grid gap-10 px-4 py-16 sm:px-8 lg:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] lg:items-end lg:px-12"
				>
					<div className="flex flex-col gap-4">
						<SlEyebrow>
							{blockText(about.contentDoc, "about-hero-eyebrow") || about.hero?.eyebrow || "Sobre o selo"}
						</SlEyebrow>
						<h1 className="sl-head m-0 max-w-[24ch] text-[clamp(40px,7vw,var(--sl-size-hero-lg))] leading-[0.9] text-balance">
							{blockText(about.contentDoc, "about-hero-title") ||
								about.hero?.title ||
								"Publicamos corpos, cidades, desejos e linguagens que escapam das margens"}
						</h1>
					</div>
					<p className="m-0 max-w-[46ch] text-[var(--sl-size-lead)] leading-[1.75] text-[color:var(--sl-text-muted)]">
						{blockText(about.contentDoc, "about-hero-body") ||
							about.hero?.body ||
							"Editora e produtora cultural dedicada à literatura erótica, à performance, aos encontros públicos e a projetos autorais — uma linha curatorial só, em três frentes."}
					</p>
				</SlBand>

				{/* Autoria e curadoria — ink */}
				<SlBand
					tone="ink"
					innerClassName="grid gap-10 px-4 py-16 sm:px-8 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] lg:items-center lg:px-12"
				>
					<div className="w-full max-w-[360px] border border-[color:var(--sl-line-on-ink)]">
						<div
							className="relative aspect-square overflow-hidden"
							style={{ background: "var(--sl-surface-desk)" }}
						>
							{about.section?.image?.src ? (
								<Image
									src={about.section.image.src}
									alt={about.section.image.alt || about.section?.title || "Autoria"}
									fill
									sizes="360px"
									className="object-cover"
								/>
							) : null}
						</div>
					</div>
					<div className="flex max-w-[56ch] flex-col gap-4">
						<SlEyebrow onInk>
							{blockText(about.contentDoc, "about-section-eyebrow") ||
								about.section?.eyebrow ||
								"Autoria e curadoria"}
						</SlEyebrow>
						<h2 className="sl-head m-0 max-w-[20ch] text-[clamp(28px,4vw,var(--sl-size-section))] leading-[0.98]">
							{blockText(about.contentDoc, "about-section-title") ||
								about.section?.title ||
								"Natália Nolli Sasso e o universo do selo"}
						</h2>
						<SlProse
							source={
								blockText(about.contentDoc, "about-section-body") ||
								about.section?.body ||
								"A autoria não é uma bio protocolar: é o critério que define o que entra no catálogo, quem sobe ao palco do Sarau e como cada livro é editado, impresso e lido em público."
							}
							className="text-[var(--sl-size-body)] leading-[1.8] text-[color:var(--sl-text-on-ink-muted)]"
						/>
						{about.section?.extended ? (
							<SlProse
								source={about.section.extended}
								className="text-[var(--sl-size-body)] leading-[1.8] text-[color:var(--sl-text-on-ink-soft)]"
							/>
						) : null}
						<SlButton
							href={about.section?.primaryCtaHref || "/sarau-safado"}
							variant="secondary"
							onInk
							className="mt-2 self-start"
						>
							{blockButtonLabel(about.contentDoc, "about-section-cta-label") ||
								about.section?.primaryCtaLabel ||
								"Conhecer Sarau Safado"}
						</SlButton>
					</div>
				</SlBand>

				{/* Linha editorial — paper cards */}
				{cards.length > 0 ? (
					<SlBand tone="paper" innerClassName="flex flex-col gap-6 px-4 py-16 sm:px-8 lg:px-12">
						<div className="border-b border-[color:var(--sl-line-hairline)] pb-5">
							<h2 className="sl-head m-0 text-[clamp(28px,4vw,var(--sl-size-section))] leading-[0.98]">
								Linha editorial
							</h2>
						</div>
						<ul className="m-0 grid list-none gap-[var(--sl-grid-gap)] p-0 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
							{cards.map((card, index) => (
								<li
									key={`${card.title}-${index}`}
									className="flex flex-col gap-2.5 border border-[color:var(--sl-line-hairline)] bg-[color:var(--sl-surface-card)] p-5"
								>
									{card.eyebrow ? <p className="sl-lbl m-0">{card.eyebrow}</p> : null}
									<h3 className="sl-head m-0 text-[var(--sl-size-card-title)] leading-[1.05]">
										{card.title}
									</h3>
									<p className="m-0 text-[var(--sl-size-meta)] leading-[1.7] text-[color:var(--sl-text-muted)]">
										{card.body}
									</p>
								</li>
							))}
						</ul>
					</SlBand>
				) : null}

				{/* Manifesto + princípio central — paper split */}
				<SlBand
					tone="paper"
					innerClassName="grid gap-5 px-4 pb-16 pt-0 sm:px-8 lg:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] lg:items-stretch lg:px-12"
				>
					<article className="flex flex-col gap-4 border-t-2 border-[color:var(--sl-wine)] bg-[color:var(--sl-surface-band)] px-6 py-8">
						<p className="sl-lbl m-0">
							{blockText(about.contentDoc, "about-closing-eyebrow") || about.closing?.eyebrow || "Manifesto"}
						</p>
						<h2 className="sl-head m-0 max-w-[24ch] text-[clamp(26px,3.4vw,var(--sl-size-section-sm))] leading-[1]">
							{blockText(about.contentDoc, "about-closing-title") ||
								about.closing?.title ||
								"A programação e a autoria se reforçam mutuamente"}
						</h2>
						<SlProse
							source={
								blockText(about.contentDoc, "about-closing-body") ||
								about.closing?.body ||
								"Conhecer uma autora, descobrir uma programação e entrar num arquivo. A experiência deve formar um ecossistema cultural, não páginas paralelas."
							}
							className="max-w-[52ch] text-[var(--sl-size-body)] leading-[1.8] text-[color:var(--sl-text-muted)]"
						/>
					</article>
					<div
						className="flex flex-col justify-center gap-4 border border-[color:var(--sl-ink)] px-6 py-8 text-[color:var(--sl-text-on-ink)]"
						style={{ background: "var(--sl-surface-invert)" }}
					>
						<p className="sl-eyebrow m-0 text-[color:var(--sl-text-on-ink-label)]">
							{blockText(about.contentDoc, "about-closing-core-eyebrow") ||
								about.closing?.coreEyebrow ||
								"Princípio central"}
						</p>
						<p className="m-0 max-w-[32ch] font-[family-name:var(--sl-font-head)] text-[var(--sl-size-card-title)] leading-[1.35] font-black tracking-[var(--sl-track-card)]">
							{blockText(about.contentDoc, "about-closing-core-title") ||
								about.closing?.coreTitle ||
								"Uma livraria para adultos pode ser quente, literária e sensual sem se tornar visualmente óbvia."}
						</p>
					</div>
				</SlBand>
			</main>
			<Footer />
		</div>
	);
}
