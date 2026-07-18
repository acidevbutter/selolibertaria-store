import type { Metadata } from "next";
import Image from "next/image";
import { getEditorialAboutPage } from "@/lib/editorial-content-store";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { EditorialEyebrow, EditorialPanel, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { EditorialRichText } from "@/ui/editorial/editorial-rich-text";
import { Footer } from "@/ui/footer/footer";
import { LiftOnHover, Reveal } from "@/ui/motion/reveal";
import { Nav } from "@/ui/nav/nav";
import { YnsLink } from "@/ui/yns-link";

export const generateMetadata = async (): Promise<Metadata> => {
	const about = await getEditorialAboutPage();

	return {
		title: `${about.hero?.eyebrow || "Sobre"} · ${seloSiteMeta.name}`,
		description: about.hero?.body || "Manifesto, autoria e linha editorial do Selo Libertária em pt-BR.",
	};
};

export default async function AboutPage() {
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
									{about.hero?.eyebrow || "Sobre o selo"}
								</EditorialEyebrow>
								<h1 className="display-font max-w-5xl text-balance text-5xl leading-[0.92] font-black tracking-[-0.06em] sm:text-6xl">
									{about.hero?.title ||
										"O Selo Libertária publica corpos, cidades, desejos e linguagens que escapam das margens."}
								</h1>
							</div>
							<EditorialRichText
								source={
									about.hero?.body ||
									"Editora e produtora cultural dedicada à literatura erótica, performance, encontros e projetos autorais."
								}
								className="max-w-2xl text-base leading-8 text-[color:var(--editorial-ink)] sm:text-lg"
							/>
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
										alt={about.section.image.alt || about.section?.title || "Autoria"}
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
									{about.section?.eyebrow || "Autoria e curadoria"}
								</EditorialEyebrow>
								<h2 className="text-4xl leading-[0.95] font-black tracking-[-0.05em] sm:text-5xl">
									{about.section?.title || "Natália Nolli Sasso e o universo do Selo Libertária."}
								</h2>
								<EditorialRichText
									source={
										about.section?.body ||
										"A página Sobre deve apresentar história, linha editorial, autoria e manifesto sem parecer uma bio protocolar ou institucional fria."
									}
									className="text-base leading-8 text-[color:rgba(247,244,239,0.82)]"
								/>
								<EditorialRichText
									source={
										about.section?.extended ||
										"Livro, performance e presença urbana aparecem aqui como uma mesma linha curatorial."
									}
									className="text-base leading-8 text-[color:rgba(247,244,239,0.72)]"
								/>
								<YnsLink
									href={about.section?.primaryCtaHref || "/sarau-safado"}
									className="inline-flex min-h-11 items-center justify-center bg-[color:var(--editorial-paper)] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-ink)] transition-colors duration-300 hover:bg-[color:var(--editorial-beige)]"
								>
									{about.section?.primaryCtaLabel || "Conhecer Sarau Safado"}
								</YnsLink>
							</div>
						</EditorialShell>
					</section>
				</Reveal>

				<EditorialShell className="grid gap-6 py-8 lg:grid-cols-3">
					{cards.slice(0, 3).map((card, index) => (
						<Reveal key={`${card.title}-${index}`} delay={0.08 * index}>
							<LiftOnHover>
								<EditorialPanel className="p-6">
									<p className="text-xs uppercase tracking-[0.28em] text-[color:var(--editorial-accent)]">
										{card.eyebrow}
									</p>
									<h2 className="mt-3 text-3xl leading-[1] font-black tracking-[-0.04em]">{card.title}</h2>
									<EditorialRichText
										source={card.body}
										className="mt-3 text-sm leading-7 text-muted-foreground"
									/>
								</EditorialPanel>
							</LiftOnHover>
						</Reveal>
					))}
				</EditorialShell>

				<EditorialShell className="grid gap-6 py-8 lg:grid-cols-[1.1fr_0.9fr]">
					<Reveal>
						<article className="border-l-[12px] border-[color:var(--editorial-accent)] bg-[color:var(--editorial-beige)] p-6">
							<p className="text-xs uppercase tracking-[0.28em] text-[color:var(--editorial-muted)]">
								{about.closing?.eyebrow || "Manifesto"}
							</p>
							<h2 className="mt-3 text-3xl font-black uppercase tracking-tight">
								{about.closing?.title || "O catálogo, a programação e a autoria se reforçam mutuamente."}
							</h2>
							<EditorialRichText
								source={
									about.closing?.body ||
									"Ler um livro, descobrir uma programação, entrar num arquivo e voltar ao catálogo. A experiência deve parecer um único ecossistema, não páginas paralelas."
								}
								className="mt-4 max-w-2xl text-sm leading-8 text-[color:var(--editorial-muted)]"
							/>
						</article>
					</Reveal>
					<Reveal delay={0.08}>
						<LiftOnHover>
							<EditorialPanel className="bg-[color:var(--editorial-ink)] p-6 text-[color:var(--editorial-paper)]">
								<p className="text-xs uppercase tracking-[0.28em] text-[color:rgba(247,244,239,0.72)]">
									{about.closing?.coreEyebrow || "Princípio central"}
								</p>
								<p className="mt-3 text-2xl leading-tight font-black">
									{about.closing?.coreTitle ||
										"Uma livraria para adultos pode ser quente, literária e sensual sem se tornar visualmente óbvia."}
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
