import Image from "next/image";
import { getLocale } from "@/i18n/server";
import type { Product } from "@/lib/commerce-types";
import { seloEditorialAssets } from "@/lib/selolibertaria-content";
import { formatMoney } from "@/lib/utils";
import {
	EditorialEyebrow,
	EditorialPanel,
	EditorialSection,
	EditorialShell,
} from "@/ui/editorial/editorial-primitives";
import { LiftOnHover, Reveal } from "@/ui/motion/reveal";
import { YnsLink } from "@/ui/yns-link";

export async function HomeFeaturedBooks({ products }: { products: Product[] }) {
	const locale = await getLocale();
	const isPortuguese = locale === "pt-BR";
	const featured = products[0] ?? null;
	const catalog = products.slice(0, 3);
	const fallbackSummary = isPortuguese
		? "Uma leitura de tom noturno e autoral, atravessada por desejo, cidade e memória, pensada como porta de entrada para o universo editorial do selo."
		: "A nocturnal author-led read shaped by desire, the city, and memory, conceived as an entry point into the selo's editorial universe.";
	const tags = isPortuguese ? ["Romance", "Erotismo", "São Paulo"] : ["Novel", "Erotica", "Sao Paulo"];
	const primaryCtaLabel = isPortuguese ? "Comprar agora" : "Buy now";
	const secondaryCtaLabel = isPortuguese ? "Ver livro" : "View book";
	const catalogTitle = isPortuguese ? "Catálogo" : "Catalogue";
	const catalogDescription = isPortuguese
		? "Capas grandes, poucas escolhas por vez e leitura direta de prateleira. A vitrine deve parecer curada, não infinita."
		: "Large covers, a few choices at a time, and shelf-like reading. The catalogue should feel curated instead of endless.";
	const defaultCardSummary = isPortuguese
		? "Leitura editorial em preparação."
		: "Editorial release in progress.";
	const primaryCardSummary = isPortuguese
		? "Leitura curta, noturna e urbana."
		: "A short nocturnal urban read.";
	const viewBookLabel = isPortuguese ? "Ver livro" : "View book";
	const launchAlertLabel = isPortuguese ? "Avise-me" : "Notify me";

	return (
		<EditorialSection className="space-y-[4.5rem]">
			{featured ? (
				<section className="bg-[color:var(--editorial-ink)] py-12 text-[color:var(--editorial-paper)] sm:py-16 lg:py-20">
					<EditorialShell className="grid gap-10 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:items-center lg:gap-20">
						<Reveal>
							<LiftOnHover>
								<div className="bg-[color:var(--editorial-paper)] p-4">
									<div className="relative aspect-[0.667] overflow-hidden">
										<Image
											src={featured.images[0] ?? "/images/ninfas-example.png"}
											alt={featured.name}
											fill
											className="object-cover transition-transform duration-700"
											sizes="320px"
										/>
									</div>
								</div>
							</LiftOnHover>
						</Reveal>
						<div className="space-y-5">
							<Reveal delay={0.04}>
								<EditorialEyebrow className="text-[color:rgba(247,244,239,0.58)]">
									{isPortuguese ? "Livro em destaque" : "Featured book"}
								</EditorialEyebrow>
							</Reveal>
							<Reveal delay={0.08}>
								<h2 className="display-font max-w-[10ch] text-4xl font-black uppercase tracking-[-0.05em] sm:text-6xl lg:text-[4.9rem]">
									{featured.name}
								</h2>
							</Reveal>
							<Reveal delay={0.12}>
								<p className="max-w-[36rem] text-base leading-8 text-[color:rgba(247,244,239,0.72)]">
									{featured.summary ?? fallbackSummary}
								</p>
							</Reveal>
							<Reveal delay={0.16}>
								<div className="flex flex-wrap gap-2">
									{tags.map((tag) => (
										<span
											key={tag}
											className="border border-[color:rgba(247,244,239,0.26)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em]"
										>
											{tag}
										</span>
									))}
								</div>
							</Reveal>
							<Reveal delay={0.2}>
								<p className="text-3xl font-black sm:text-[2.2rem]">
									{formatMoney({ amount: featured.price, currency: featured.currency, locale })}
								</p>
							</Reveal>
							<Reveal delay={0.24}>
								<div className="flex flex-wrap gap-4">
									<YnsLink
										href={`/product/${featured.slug}`}
										className="inline-flex h-12 items-center justify-center bg-[color:var(--editorial-paper)] px-6 text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--editorial-ink)] transition-colors duration-300 hover:bg-[color:var(--editorial-beige)]"
									>
										{primaryCtaLabel}
									</YnsLink>
									<YnsLink
										href={`/product/${featured.slug}`}
										className="inline-flex h-12 items-center justify-center border border-[color:rgba(247,244,239,0.22)] px-6 text-[10px] font-black uppercase tracking-[0.24em] text-[color:rgba(247,244,239,0.78)] transition-colors duration-300 hover:bg-[color:rgba(247,244,239,0.08)]"
									>
										{secondaryCtaLabel}
									</YnsLink>
								</div>
							</Reveal>
						</div>
					</EditorialShell>
				</section>
			) : null}

			<section className="bg-[color:var(--editorial-paper)] py-10 sm:py-12">
				<EditorialShell className="space-y-8">
					<div className="grid gap-6 border-t border-[color:var(--editorial-border)] pt-8 lg:grid-cols-[1fr_380px] lg:items-start">
						<Reveal>
							<h2 className="display-font text-4xl font-black uppercase tracking-[-0.05em] sm:text-6xl">
								{catalogTitle}
							</h2>
						</Reveal>
						<Reveal delay={0.06}>
							<p className="text-sm leading-7 text-[color:var(--editorial-muted)]">{catalogDescription}</p>
						</Reveal>
					</div>
					<ul className="grid gap-8 lg:grid-cols-3">
						{catalog.map((product, index) => (
							<li key={product.id}>
								<Reveal delay={0.08 * index}>
									<LiftOnHover>
										<EditorialPanel className="group h-full p-5 transition-colors duration-300 hover:border-[color:var(--editorial-ink)]">
											<div className="relative aspect-[0.72] max-w-[220px] overflow-hidden bg-[color:var(--editorial-beige)]">
												<Image
													src={product.images[0] ?? seloEditorialAssets.bookCover}
													alt={product.name}
													fill
													className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
													sizes="220px"
												/>
											</div>
											<h3 className="mt-6 text-2xl font-bold tracking-[-0.03em]">{product.name}</h3>
											<p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
												{formatMoney({ amount: product.price, currency: product.currency, locale })}
											</p>
											<p className="mt-3 text-sm leading-7 text-[color:var(--editorial-muted)]">
												{product.summary ?? (index === 0 ? primaryCardSummary : defaultCardSummary)}
											</p>
											<YnsLink
												href={`/product/${product.slug}`}
												className="mt-6 inline-flex h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--editorial-paper)] transition-colors duration-300 hover:bg-[color:var(--editorial-accent)]"
											>
												{(product.stock ?? 1) > 0 ? viewBookLabel : launchAlertLabel}
											</YnsLink>
										</EditorialPanel>
									</LiftOnHover>
								</Reveal>
							</li>
						))}
					</ul>
				</EditorialShell>
			</section>
		</EditorialSection>
	);
}
