import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EditorialEyebrow, EditorialPanel, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { LiftOnHover, Reveal } from "@/ui/motion/reveal";
import { YnsLink } from "@/ui/yns-link";

type CatalogIntroCard = {
	label: string;
	body: string;
};

type CatalogIntroProps = {
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
	secondaryCtaLabel?: ReactNode;
	secondaryCtaHref?: string;
	tone?: "light" | "dark";
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
	secondaryCtaLabel,
	secondaryCtaHref,
	tone = "light",
}: CatalogIntroProps) {
	const isDark = tone === "dark";

	return (
		<>
			<Reveal>
				<section
					className={cn(
						"border-b",
						isDark
							? "border-[color:rgba(247,244,239,0.12)] bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)]"
							: "border-[color:var(--editorial-border)] bg-[color:var(--editorial-paper)] text-[color:var(--editorial-ink)]",
					)}
				>
					<EditorialShell className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.78fr)] lg:items-center lg:gap-16 lg:py-20">
						<div className="space-y-5">
							<EditorialEyebrow
								className={cn(
									"sm:text-sm",
									isDark ? "text-[color:rgba(247,244,239,0.58)]" : "text-[color:var(--editorial-accent)]",
								)}
							>
								{eyebrow}
							</EditorialEyebrow>
							<h1
								className={cn(
									"max-w-[12ch] text-balance text-[3rem] leading-[0.9] font-black tracking-[-0.06em] sm:text-[4rem] lg:text-[4.7rem]",
									isDark ? "text-[color:var(--editorial-paper)]" : "text-[color:var(--editorial-ink)]",
								)}
							>
								{title}
							</h1>
							<p
								className={cn(
									"max-w-[34rem] text-base leading-8 sm:text-lg",
									isDark ? "text-[color:rgba(247,244,239,0.8)]" : "text-[color:var(--editorial-ink)]",
								)}
							>
								{description}
							</p>
							{(primaryCtaHref && primaryCtaLabel) || (secondaryCtaHref && secondaryCtaLabel) ? (
								<div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
									{primaryCtaHref && primaryCtaLabel ? (
										<YnsLink
											href={primaryCtaHref}
											className={cn(
												"inline-flex min-h-11 items-center justify-center px-5 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors duration-300",
												isDark
													? "bg-[color:var(--editorial-paper)] text-[color:var(--editorial-ink)] hover:bg-[color:var(--editorial-beige)]"
													: "bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)] hover:bg-[color:var(--editorial-accent)]",
											)}
										>
											{primaryCtaLabel}
										</YnsLink>
									) : null}
									{secondaryCtaHref && secondaryCtaLabel ? (
										<YnsLink
											href={secondaryCtaHref}
											className={cn(
												"inline-flex min-h-11 items-center justify-center border px-5 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors duration-300",
												isDark
													? "border-[color:rgba(247,244,239,0.18)] text-[color:var(--editorial-paper)] hover:bg-[color:rgba(247,244,239,0.08)]"
													: "border-[color:var(--editorial-border)] text-[color:var(--editorial-ink)] hover:bg-[color:rgba(216,208,196,0.22)]",
											)}
										>
											{secondaryCtaLabel}
										</YnsLink>
									) : null}
								</div>
							) : null}
						</div>

						<div className="relative mx-auto w-full max-w-[420px] lg:mr-0">
							<div
								className={cn(
									"relative ml-auto w-[68%] p-5 sm:p-7",
									isDark
										? "border border-[color:rgba(247,244,239,0.08)] bg-[color:var(--editorial-beige)] text-[color:var(--editorial-ink)]"
										: "border border-[color:var(--editorial-border)] bg-[color:var(--editorial-beige)] text-[color:var(--editorial-ink)]",
								)}
							>
								<div
									className="absolute bottom-3 left-3 top-3 w-1 bg-[color:rgba(11,11,11,0.2)]"
									aria-hidden="true"
								/>
								<div className="relative aspect-[0.72] w-full overflow-hidden bg-[color:rgba(247,244,239,0.72)]">
									{featureImage ? (
										<Image
											src={featureImage.src}
											alt={featureImage.alt}
											fill
											className="object-contain p-4 sm:p-5"
											sizes="(max-width: 1024px) 58vw, 320px"
										/>
									) : null}
								</div>
							</div>
							{featureQuote ? (
								<div
									className={cn(
										"relative -mt-12 mr-6 max-w-[19rem] p-5 text-lg leading-8 sm:-mt-16 sm:p-6",
										isDark
											? "bg-[color:var(--editorial-paper)] text-[color:var(--editorial-ink)]"
											: "bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)]",
									)}
								>
									{featureQuote}
								</div>
							) : null}
						</div>
					</EditorialShell>
				</section>
			</Reveal>

			<section className="bg-[color:var(--editorial-paper)] text-[color:var(--editorial-ink)]">
				<EditorialShell className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
					<Reveal delay={0.04}>
						<div className="space-y-5">
							<p className="text-xs uppercase tracking-[0.28em] text-[color:var(--editorial-muted)]">
								Leitura do catálogo
							</p>
							<h2 className="max-w-[14ch] text-3xl leading-[0.95] font-black tracking-[-0.04em] sm:text-5xl">
								{highlight}
							</h2>
						</div>
					</Reveal>
					<div className="grid gap-4 sm:grid-cols-3">
						{cards.map((card, index) => (
							<Reveal key={card.label} delay={0.08 + index * 0.04}>
								<LiftOnHover>
									<EditorialPanel className="h-full border-[color:rgba(11,11,11,0.18)] bg-transparent p-5 sm:p-6">
										<p className="text-xs uppercase tracking-[0.22em] text-[color:var(--editorial-accent)]">
											{card.label}
										</p>
										<p className="mt-3 text-sm leading-7 text-[color:var(--editorial-muted)]">{card.body}</p>
									</EditorialPanel>
								</LiftOnHover>
							</Reveal>
						))}
					</div>
				</EditorialShell>
			</section>
		</>
	);
}
