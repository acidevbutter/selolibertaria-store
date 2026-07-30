import Image from "next/image";
import type { Product } from "@/lib/commerce-types";
import {
	type EditorialHomePage,
	getEditorialBackgroundContrast,
	getEditorialBackgroundStyle,
} from "@/lib/editorial-content";
import { EditorialEyebrow, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { EditorialRichText } from "@/ui/editorial/editorial-rich-text";
import { LiftOnHover, Reveal } from "@/ui/motion/reveal";
import { YnsLink } from "@/ui/yns-link";

export async function HomeHero({
	content,
	product,
}: {
	content?: EditorialHomePage["hero"] | null;
	product?: Product | null;
}) {
	const hero = content ?? null;
	const usesProduct = hero?.mode === "product" && Boolean(product);
	const eyebrow = usesProduct ? "Livro em destaque" : hero?.eyebrow || "Lançamento";
	const title = usesProduct ? product?.name || "Livro em destaque" : hero?.title || "Ninfas do Tiete";
	const description =
		(usesProduct ? product?.summary : hero?.description) ||
		"Um romance breve, noturno e urbano em que desejo, cidade e memória atravessam a leitura como presença.";
	const primaryCtaLabel = usesProduct ? "Ver livro" : hero?.primaryCtaLabel || "Ver loja";
	const secondaryCtaLabel = hero?.secondaryCtaLabel || "Conhecer o Sarau Safado";
	const supportingLine =
		hero?.supportingLine || "Livros impressos, edições sonoras, encontros ao vivo e projetos culturais.";
	const quoteEyebrow = hero?.featureEyebrow || "Trecho";
	const quote = hero?.featureQuote || "Ler também pode ser uma forma de acender presença.";
	const featureImage =
		(usesProduct ? product?.images[0] : hero?.featureImage?.src) || "/images/ninfas-example.png";
	const featureImageAlt = hero?.featureImage?.alt || title;
	const backgroundStyle = getEditorialBackgroundStyle(hero?.background, null, "strong");
	const useDarkText = Boolean(backgroundStyle) && getEditorialBackgroundContrast(hero?.background) === "dark";
	const sectionClassName = [
		"overflow-hidden",
		useDarkText
			? "bg-[color:var(--editorial-paper)] text-[color:var(--editorial-ink)]"
			: "bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)]",
	].join(" ");

	return (
		<section className={sectionClassName} style={backgroundStyle}>
			<EditorialShell className="grid min-h-[720px] grid-cols-1 gap-12 py-8 sm:py-10 lg:min-h-[834px] lg:grid-cols-[minmax(0,0.88fr)_minmax(360px,0.92fr)] lg:items-center lg:gap-20 lg:py-16 xl:py-20">
				<div className="flex max-w-2xl flex-col justify-center space-y-6 lg:space-y-8">
					<Reveal>
						<EditorialEyebrow
							className={
								useDarkText
									? "text-[color:var(--editorial-accent)] sm:text-sm"
									: "text-[color:var(--editorial-beige)] sm:text-sm"
							}
						>
							{eyebrow}
						</EditorialEyebrow>
					</Reveal>
					<Reveal delay={0.05}>
						<h1
							className={[
								"display-font max-w-[8ch] text-balance text-[3.45rem] leading-[0.84] font-black tracking-[-0.07em] uppercase sm:text-[5.2rem] lg:text-[6.2rem] xl:text-[6.7rem]",
								useDarkText ? "text-[color:var(--editorial-ink)]" : "text-[color:var(--editorial-paper)]",
							].join(" ")}
						>
							{title}
						</h1>
					</Reveal>
					<Reveal delay={0.1}>
						<EditorialRichText
							source={description}
							className={[
								"max-w-[31rem] text-pretty text-base leading-8 sm:text-lg sm:leading-8",
								useDarkText ? "text-[color:var(--editorial-ink)]" : "text-[color:rgba(247,244,239,0.76)]",
							].join(" ")}
						/>
					</Reveal>
					<Reveal delay={0.15}>
						<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
							<YnsLink
								href={
									usesProduct && product ? `/product/${product.slug}` : hero?.primaryCtaHref || "/products"
								}
								className={[
									"inline-flex h-12 items-center justify-center px-6 text-[11px] font-black uppercase tracking-[0.24em] transition-colors duration-300",
									useDarkText
										? "bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)] hover:bg-[color:var(--editorial-accent)]"
										: "bg-[color:var(--editorial-paper)] text-[color:var(--editorial-ink)] hover:bg-[color:var(--editorial-beige)]",
								].join(" ")}
							>
								{primaryCtaLabel}
							</YnsLink>
							<YnsLink
								href={hero?.secondaryCtaHref || "/sarau-safado"}
								className={[
									"inline-flex h-12 items-center justify-center border px-6 text-[11px] font-black uppercase tracking-[0.24em] transition-colors duration-300",
									useDarkText
										? "border-[color:rgba(11,11,11,0.24)] text-[color:var(--editorial-ink)] hover:bg-[color:rgba(11,11,11,0.06)]"
										: "border-[color:rgba(247,244,239,0.24)] text-[color:var(--editorial-paper)] hover:bg-[color:rgba(247,244,239,0.08)]",
								].join(" ")}
							>
								{secondaryCtaLabel}
							</YnsLink>
						</div>
					</Reveal>
					<Reveal delay={0.2}>
						<EditorialRichText
							source={supportingLine}
							className={[
								"max-w-[28rem] text-sm leading-7",
								useDarkText ? "text-[color:var(--editorial-muted)]" : "text-[color:rgba(216,208,196,0.84)]",
							].join(" ")}
						/>
					</Reveal>
				</div>

				<div className="relative">
					<Reveal delay={0.08}>
						<LiftOnHover>
							<div className="relative mx-auto w-full max-w-[620px] pb-20 lg:mx-0 lg:pb-28">
								<div className="relative mx-auto aspect-[0.667] w-[70vw] max-w-[360px] min-w-[220px] overflow-hidden border border-[color:rgba(247,244,239,0.08)] bg-[color:#121212] shadow-[0_32px_90px_rgba(0,0,0,0.42)] lg:ml-auto lg:mr-0 lg:w-full lg:max-w-[360px]">
									<Image
										src={featureImage}
										alt={featureImageAlt}
										fill
										priority
										className="object-cover object-center transition-transform duration-700"
										sizes="(max-width: 1024px) 72vw, 520px"
									/>
								</div>
								<div className="absolute right-0 bottom-0 w-[82%] max-w-[320px] border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-paper)] p-6 text-[color:var(--editorial-ink)] shadow-[0_22px_50px_rgba(11,11,11,0.24)] lg:right-[-1.5rem]">
									<p className="text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--editorial-accent)]">
										{quoteEyebrow}
									</p>
									<p className="mt-4 text-xl leading-tight font-medium sm:text-[2rem]">{quote}</p>
								</div>
							</div>
						</LiftOnHover>
					</Reveal>
				</div>
			</EditorialShell>
		</section>
	);
}
