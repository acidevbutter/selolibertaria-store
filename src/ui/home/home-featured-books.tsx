import Image from "next/image";
import { getLocale, getTranslations } from "@/i18n/server";
import type { Product } from "@/lib/commerce-types";
import { formatMoney } from "@/lib/utils";
import { EditorialEyebrow, EditorialPanel, EditorialSection } from "@/ui/editorial/editorial-primitives";
import { YnsLink } from "@/ui/yns-link";

export async function HomeFeaturedBooks({ products }: { products: Product[] }) {
	const t = await getTranslations("Selo");
	const locale = await getLocale();
	const featured = products[0] ?? null;
	const catalog = products.slice(0, 3);

	return (
		<EditorialSection className="space-y-16">
			{featured ? (
				<section className="bg-[color:var(--editorial-ink)] py-10 text-[color:var(--editorial-paper)] sm:py-14">
					<div className="grid gap-10 px-4 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:px-8">
						<div className="border border-[color:rgba(247,244,239,0.22)] bg-[color:var(--editorial-beige)] p-4">
							<div className="relative aspect-[0.72] overflow-hidden border border-[color:var(--editorial-ink)]">
								<Image
									src={featured.images[0] ?? "/yns-cover.jpg"}
									alt={featured.name}
									fill
									className="object-cover"
									sizes="280px"
								/>
							</div>
						</div>
						<div className="space-y-5">
							<EditorialEyebrow className="text-[color:rgba(247,244,239,0.58)]">
								{t("home.featured.eyebrow")}
							</EditorialEyebrow>
							<h2 className="text-4xl font-black tracking-[-0.05em] sm:text-6xl">{featured.name}</h2>
							<p className="max-w-2xl text-base leading-8 text-[color:rgba(247,244,239,0.72)]">
								{featured.summary ??
									"Sinopse curta com tom literário: uma obra atravessada por desejo, memória, cidade e tensão. A página do livro deve funcionar como vitrine, amostra e ritual de entrada no universo do selo."}
							</p>
							<div className="flex flex-wrap gap-2">
								{["Poesia", "Erotismo", "Urbano"].map((tag) => (
									<span
										key={tag}
										className="border border-[color:rgba(247,244,239,0.26)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em]"
									>
										{tag}
									</span>
								))}
							</div>
							<p className="text-3xl font-black">
								{formatMoney({ amount: featured.price, currency: featured.currency, locale })}
							</p>
							<div className="flex flex-wrap gap-4">
								<YnsLink
									href={`/product/${featured.slug}`}
									className="inline-flex h-11 items-center justify-center bg-[color:var(--editorial-paper)] px-5 text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--editorial-ink)]"
								>
									Comprar agora
								</YnsLink>
								<YnsLink
									href={`/product/${featured.slug}`}
									className="inline-flex h-11 items-center justify-center text-sm font-bold uppercase tracking-[0.18em] text-[color:rgba(247,244,239,0.78)]"
								>
									Ver detalhes
								</YnsLink>
							</div>
						</div>
					</div>
				</section>
			) : null}

			<section className="space-y-8">
				<div className="grid gap-6 border-t border-[color:var(--editorial-border)] px-8 pt-8 lg:grid-cols-[1fr_320px] lg:items-start">
					<h2 className="text-4xl font-black uppercase tracking-[-0.05em] sm:text-6xl">Catalogo</h2>
					<p className="text-sm leading-7 text-[color:var(--editorial-muted)]">
						Poucos cards, capas grandes e filtros discretos. O catálogo deve parecer uma estante curada, não
						uma grade infinita.
					</p>
				</div>
				<ul className="grid gap-8 lg:grid-cols-3">
					{catalog.map((product, index) => (
						<li key={product.id}>
							<EditorialPanel className="h-full p-5">
								<div className="relative aspect-[0.72] max-w-[220px] overflow-hidden border border-[color:var(--editorial-border)] bg-[color:var(--editorial-beige)]">
									<Image
										src={product.images[0] ?? "/yns-cover.jpg"}
										alt={product.name}
										fill
										className="object-cover"
										sizes="220px"
									/>
								</div>
								<h3 className="mt-6 text-2xl font-bold tracking-[-0.03em]">{product.name}</h3>
								<p className="mt-3 text-sm leading-7 text-[color:var(--editorial-muted)]">
									{product.summary ??
										(index === 0 ? "Poesia / erotismo / urbano" : "Publicacao futura do selo")}
								</p>
								<YnsLink
									href={`/product/${product.slug}`}
									className="mt-6 inline-flex h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--editorial-paper)]"
								>
									{index === 0 ? "Ver livro" : "Avisar lancamento"}
								</YnsLink>
							</EditorialPanel>
						</li>
					))}
				</ul>
			</section>
		</EditorialSection>
	);
}
