import Image from "next/image";
import type { ReactNode } from "react";
import { EditorialEyebrow, EditorialPanel, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { LiftOnHover, Reveal } from "@/ui/motion/reveal";
import { YnsLink } from "@/ui/yns-link";

type CatalogIntroCard = {
	label: string;
	body: string;
};

export function CatalogIntro({
	eyebrow,
	title,
	description,
	highlight,
	cards,
	featureImage,
	featureQuote,
	primaryCtaLabel,
	primaryCtaHref,
}: {
	eyebrow: ReactNode;
	title: ReactNode;
	description: ReactNode;
	highlight: ReactNode;
	cards: CatalogIntroCard[];
	featureImage?: {
		src: string;
		alt: string;
	};
	featureQuote?: ReactNode;
	primaryCtaLabel?: ReactNode;
	primaryCtaHref?: string;
}) {
	return (
		<EditorialShell className="space-y-10 pt-10 pb-2 sm:pt-14">
			<Reveal>
				<section className="grid gap-8 border-y border-[color:var(--editorial-border)] py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-14">
					<div className="space-y-5">
						<EditorialEyebrow className="text-[color:var(--editorial-accent)] sm:text-sm">
							{eyebrow}
						</EditorialEyebrow>
						<h1 className="max-w-5xl text-balance text-5xl leading-[0.9] font-black tracking-[-0.06em] sm:text-6xl lg:text-7xl">
							{title}
						</h1>
						<p className="max-w-2xl text-base leading-8 text-[color:var(--editorial-ink)] sm:text-lg">
							{description}
						</p>
						{primaryCtaHref && primaryCtaLabel ? (
							<div className="pt-2">
								<YnsLink
									href={primaryCtaHref}
									className="inline-flex min-h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-paper)] transition-colors duration-300 hover:bg-[color:var(--editorial-accent)]"
								>
									{primaryCtaLabel}
								</YnsLink>
							</div>
						) : null}
					</div>

					<div className="relative mx-auto w-full max-w-md lg:mr-0">
						<div className="relative ml-auto w-[68%] border border-[color:var(--editorial-border)] bg-[color:var(--editorial-beige)] p-5 sm:p-7">
							<div
								className="absolute bottom-0 left-3 top-3 w-1 bg-[color:var(--editorial-accent)]"
								aria-hidden="true"
							/>
							<div className="relative aspect-[0.78] w-full overflow-hidden bg-[color:rgba(247,244,239,0.78)]">
								{featureImage ? (
									<Image
										src={featureImage.src}
										alt={featureImage.alt}
										fill
										className="object-contain p-4 sm:p-5"
										sizes="(max-width: 1024px) 60vw, 360px"
									/>
								) : null}
							</div>
						</div>
						{featureQuote ? (
							<div className="relative -mt-12 mr-6 max-w-[19rem] bg-[color:var(--editorial-ink)] p-5 text-lg leading-8 text-[color:var(--editorial-paper)] sm:-mt-16 sm:p-6">
								{featureQuote}
							</div>
						) : null}
					</div>
				</section>
			</Reveal>

			<section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
				<Reveal delay={0.04}>
					<div className="border-l-[12px] border-[color:var(--editorial-accent)] bg-[color:var(--editorial-beige)] p-6 sm:p-8">
						<p className="text-xs uppercase tracking-[0.28em] text-[color:var(--editorial-muted)]">
							Leitura do catálogo
						</p>
						<h2 className="mt-4 text-3xl leading-[0.95] font-black sm:text-4xl">{highlight}</h2>
					</div>
				</Reveal>
				<div className="grid gap-4 sm:grid-cols-3">
					{cards.map((card, index) => (
						<Reveal key={card.label} delay={0.08 + index * 0.04}>
							<LiftOnHover>
								<EditorialPanel className="h-full p-5">
									<p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{card.label}</p>
									<p className="mt-3 text-sm leading-7 text-muted-foreground">{card.body}</p>
								</EditorialPanel>
							</LiftOnHover>
						</Reveal>
					))}
				</div>
			</section>
		</EditorialShell>
	);
}
