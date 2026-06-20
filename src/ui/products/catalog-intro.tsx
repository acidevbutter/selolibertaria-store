import type { ReactNode } from "react";
import { EditorialEyebrow, EditorialPanel, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { LiftOnHover, Reveal } from "@/ui/motion/reveal";

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
}: {
	eyebrow: ReactNode;
	title: ReactNode;
	description: ReactNode;
	highlight: ReactNode;
	cards: CatalogIntroCard[];
}) {
	return (
		<EditorialShell className="space-y-8 pt-10 pb-2 sm:pt-14">
			<Reveal>
				<div className="max-w-4xl space-y-5">
					<EditorialEyebrow className="sm:text-sm">{eyebrow}</EditorialEyebrow>
					<h1 className="max-w-5xl text-balance text-5xl leading-[0.9] font-black tracking-[-0.06em] uppercase sm:text-6xl lg:text-7xl">
						{title}
					</h1>
					<p className="max-w-2xl text-base leading-8 text-[color:var(--editorial-muted)] sm:text-lg">
						{description}
					</p>
				</div>
			</Reveal>

			<section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
				<Reveal delay={0.04}>
					<div className="border-l-[12px] border-[color:var(--editorial-accent)] bg-[color:var(--editorial-beige)] p-6 sm:p-8">
						<p className="text-xs uppercase tracking-[0.28em] text-[color:var(--editorial-muted)]">
							Leitura do catálogo
						</p>
						<h2 className="mt-4 text-3xl leading-[0.95] font-black uppercase sm:text-4xl">{highlight}</h2>
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
