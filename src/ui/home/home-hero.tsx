import Image from "next/image";
import { getLocale } from "@/i18n/server";
import type { EditorialHomePage } from "@/lib/editorial-content";
import { EditorialEyebrow, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { LiftOnHover, Reveal } from "@/ui/motion/reveal";
import { YnsLink } from "@/ui/yns-link";

export async function HomeHero({ content }: { content?: EditorialHomePage["hero"] | null }) {
	const locale = await getLocale();
	const isPortuguese = locale === "pt-BR";
	const hero = content ?? null;
	const eyebrow = hero?.eyebrow || (isPortuguese ? "Livro em destaque" : "Featured release");
	const title = hero?.title || "Ninfas do Tiete";
	const description =
		hero?.description ||
		(isPortuguese
			? "Um romance breve, noturno e urbano em que desejo, cidade e memória atravessam a leitura como presença."
			: "A brief nocturnal urban novel where desire, the city, and memory move through reading as presence.");
	const primaryCtaLabel = hero?.primaryCtaLabel || (isPortuguese ? "Comprar livro" : "Buy the book");
	const secondaryCtaLabel = hero?.secondaryCtaLabel || (isPortuguese ? "Ler trecho" : "Read an excerpt");
	const quote =
		hero?.featureQuote ||
		(isPortuguese
			? "Ler também pode ser uma forma de acender presença."
			: "Reading can also be a way of igniting presence.");
	const featureImage = hero?.featureImage?.src || "/images/ninfas-example.png";
	const featureImageAlt = hero?.featureImage?.alt || title;

	return (
		<section className="overflow-hidden bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)]">
			<EditorialShell className="grid min-h-[720px] grid-cols-1 gap-10 py-8 sm:py-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(420px,0.92fr)] lg:items-center lg:gap-16 lg:py-14 xl:min-h-[840px]">
				<div className="flex max-w-xl flex-col justify-center space-y-6 lg:space-y-8">
					<Reveal>
						<EditorialEyebrow className="text-[color:rgba(247,244,239,0.7)] sm:text-sm">
							{eyebrow}
						</EditorialEyebrow>
					</Reveal>
					<Reveal delay={0.05}>
						<h1 className="display-font max-w-3xl text-balance text-[3.5rem] leading-[0.84] font-black tracking-[-0.07em] text-[color:var(--editorial-paper)] uppercase sm:text-[5rem] lg:text-[6rem] xl:text-[6.8rem]">
							{title}
						</h1>
					</Reveal>
					<Reveal delay={0.1}>
						<p className="max-w-md text-pretty text-base leading-8 text-[color:rgba(247,244,239,0.76)] sm:text-lg sm:leading-8">
							{description}
						</p>
					</Reveal>
					<Reveal delay={0.15}>
						<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
							<YnsLink
								href={hero?.primaryCtaHref || "/products"}
								className="inline-flex h-11 items-center justify-center bg-[color:var(--editorial-paper)] px-5 text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--editorial-ink)] transition-colors duration-300 hover:bg-[color:var(--editorial-beige)]"
							>
								{primaryCtaLabel}
							</YnsLink>
							<YnsLink
								href={hero?.secondaryCtaHref || "/events"}
								className="inline-flex h-11 items-center justify-center border border-[color:rgba(247,244,239,0.24)] px-5 text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--editorial-paper)] transition-colors duration-300 hover:bg-[color:rgba(247,244,239,0.08)]"
							>
								{secondaryCtaLabel}
							</YnsLink>
						</div>
					</Reveal>
				</div>

				<div className="relative">
					<Reveal delay={0.08}>
						<LiftOnHover>
							<div className="relative mx-auto w-full max-w-[620px] pb-24 lg:mx-0 lg:pb-32">
								<div className="relative ml-auto aspect-[0.72] w-[72%] min-w-[320px] overflow-hidden bg-[color:#121212] shadow-[0_28px_80px_rgba(0,0,0,0.35)]">
									<Image
										src={featureImage}
										alt={featureImageAlt}
										fill
										priority
										className="object-cover object-center transition-transform duration-700"
										sizes="(max-width: 1024px) 72vw, 520px"
									/>
								</div>
								<div className="absolute right-0 bottom-0 w-full max-w-[290px] border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-paper)] p-6 text-[color:var(--editorial-ink)] lg:right-[-2rem] lg:max-w-[320px]">
									<p className="text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--editorial-accent)]">
										{isPortuguese ? "Leitura em campo" : "Reading note"}
									</p>
									<p className="mt-4 text-xl leading-tight font-medium sm:text-2xl">{quote}</p>
								</div>
							</div>
						</LiftOnHover>
					</Reveal>
				</div>
			</EditorialShell>
		</section>
	);
}
