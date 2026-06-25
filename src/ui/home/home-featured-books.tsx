import Image from "next/image";
import { getLocale } from "@/i18n/server";
import type { Product } from "@/lib/commerce-types";
import type { EditorialHomePage } from "@/lib/editorial-content";
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

export async function HomeFeaturedBooks({
	products,
	content,
}: {
	products: Product[];
	content?: EditorialHomePage | null;
}) {
	const locale = await getLocale();
	const featured = products[0] ?? null;
	const catalog = products.slice(0, 3);
	const tags = ["Erotismo", "Cidade", "Corpo"];
	const fallbackSummary =
		content?.featuredBook?.body ?? "Produto com cara de página literária: sinopse curta, preço claro, amostra e compra.";
	const primaryCtaLabel = content?.featuredBook?.primaryCtaLabel || "Comprar agora";
	const secondaryCtaLabel = content?.featuredBook?.secondaryCtaLabel || "Ver livro";
	const catalogTitle = content?.catalog?.title || "Catálogo";
	const catalogDescription =
		content?.catalog?.body || "Uma prateleira curta e curada para entrar no universo do selo pela leitura.";
	const primaryCardSummary =
		content?.catalog?.primaryCardFallback ||
		"Poesia erótica em trânsito pela cidade, com corpo e linguagem em tensão.";
	const defaultCardSummary =
		content?.catalog?.defaultCardFallback || "Livro em preparação dentro do mesmo universo literário do selo.";
	const viewBookLabel = content?.catalog?.viewBookLabel || "Ver livro";
	const launchAlertLabel = content?.catalog?.launchAlertLabel || "Avise-me";

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
									{content?.featuredBook?.eyebrow || "Livro em destaque"}
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
