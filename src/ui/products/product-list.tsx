import { getLocale, getTranslations } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { canBuyOnSelolibertaria } from "@/lib/authz";
import type { Product } from "@/lib/commerce-types";
import { buildFavoriteKey, listFavoriteKeysForUser } from "@/lib/favorites";
import { deslugify, formatMoney } from "@/lib/utils";
import { EditorialEyebrow, EditorialPanel } from "@/ui/editorial/editorial-primitives";
import { JsonLd, mappedProductsToJsonLd } from "@/ui/json-ld";
import { Reveal } from "@/ui/motion/reveal";
import { ProductCard } from "@/ui/products/product-card.client";

export const ProductList = async ({ products }: { products: Product[] }) => {
	const [locale, t, session] = await Promise.all([getLocale(), getTranslations("Global.products"), auth()]);
	const favoriteKeys = session ? await listFavoriteKeysForUser(session.user.id) : new Set<string>();
	const canPurchase = canBuyOnSelolibertaria(session?.user.role);

	return (
		<>
			<section className="space-y-6">
				<Reveal>
					<EditorialPanel className="grid gap-5 sm:grid-cols-3">
						<div>
							<EditorialEyebrow className="text-[color:var(--editorial-accent)]">Catálogo</EditorialEyebrow>
							<p className="editorial-serif mt-3 text-2xl font-semibold sm:text-3xl">
								Poucos ruídos, capas em destaque e saída clara para compra.
							</p>
						</div>
						<p className="text-sm leading-7 text-[color:var(--editorial-muted)]">
							A vitrine privilegia leitura rápida, capa protagonista e passagem simples para a página do
							livro.
						</p>
						<p className="text-sm leading-7 text-[color:var(--editorial-muted)]">
							Quando houver variantes, a escolha continua disponível na grade para manter o fluxo de compra
							leve.
						</p>
					</EditorialPanel>
				</Reveal>

				<ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{products.map((product, idx) => {
						const defaultVariant = product.variants?.[0];
						const preferredVariant =
							product.variants?.find((variant) => (variant.stock ?? 1) > 0) ?? defaultVariant ?? null;
						const priceEntries =
							product.variants && product.variants.length > 0
								? product.variants.map((variant) => ({
										base: variant.pricing?.basePrice ?? variant.price ?? 0,
										effective: variant.pricing?.effectivePrice ?? variant.price ?? 0,
									}))
								: [
										{
											base: product.pricing?.basePrice ?? product.price,
											effective: product.pricing?.effectivePrice ?? product.price,
										},
									];
						const min = Math.min(...priceEntries.map((entry) => entry.effective));
						const max = Math.max(...priceEntries.map((entry) => entry.effective));
						const minBase = Math.min(...priceEntries.map((entry) => entry.base));
						const maxBase = Math.max(...priceEntries.map((entry) => entry.base));
						const priceLabel =
							min === max
								? formatMoney({ amount: min, currency: product.currency, locale })
								: `${formatMoney({ amount: min, currency: product.currency, locale })} - ${formatMoney({ amount: max, currency: product.currency, locale })}`;
						const compareAtLabel =
							min !== minBase || max !== maxBase
								? minBase === maxBase
									? formatMoney({
											amount: minBase,
											currency: product.currency,
											locale,
										})
									: `${formatMoney({ amount: minBase, currency: product.currency, locale })} - ${formatMoney({ amount: maxBase, currency: product.currency, locale })}`
								: null;
						const variantOptions =
							product.variants?.map((variant, index) => {
								const label = variant.label ? deslugify(variant.label) : t("option", { index: index + 1 });
								const effectivePrice = variant.pricing?.effectivePrice ?? variant.price ?? 0;
								const basePrice = variant.pricing?.basePrice ?? variant.price ?? 0;

								return {
									id: variant.id,
									label,
									inStock: (variant.stock ?? 1) > 0,
									priceLabel: formatMoney({
										amount: effectivePrice,
										currency: product.currency,
										locale,
									}),
									compareAtLabel:
										effectivePrice !== basePrice
											? formatMoney({
													amount: basePrice,
													currency: product.currency,
													locale,
												})
											: null,
									promotionLabel: variant.pricing?.promotionLabel ?? null,
								};
							}) ?? [];
						const favoriteKey = buildFavoriteKey(product.slug, defaultVariant?.id ?? null);
						const quickAddDisabled =
							(typeof preferredVariant?.stock === "number" && preferredVariant.stock <= 0) ||
							(!preferredVariant && typeof product.stock === "number" && product.stock <= 0);
						const selectedVariantPriceLabel = preferredVariant
							? formatMoney({
									amount: preferredVariant.pricing?.effectivePrice ?? preferredVariant.price ?? 0,
									currency: product.currency,
									locale,
								})
							: priceLabel;
						const selectedVariantCompareAtLabel = preferredVariant
							? (preferredVariant.pricing?.effectivePrice ?? preferredVariant.price ?? 0) !==
								(preferredVariant.pricing?.basePrice ?? preferredVariant.price ?? 0)
								? formatMoney({
										amount: preferredVariant.pricing?.basePrice ?? preferredVariant.price ?? 0,
										currency: product.currency,
										locale,
									})
								: null
							: compareAtLabel;

						return (
							<li key={product.id} className="relative h-full">
								<Reveal delay={0.04 * idx}>
									<ProductCard
										href={`/product/${product.slug}`}
										name={product.name}
										imageUrl={product.images[0] ?? null}
										imageAlt={product.name}
										productSlug={product.slug}
										variantId={preferredVariant?.id ?? defaultVariant?.id ?? null}
										favoriteActive={favoriteKeys.has(favoriteKey)}
										priceLabel={selectedVariantPriceLabel}
										compareAtLabel={selectedVariantCompareAtLabel}
										promotionLabel={
											preferredVariant
												? (preferredVariant.pricing?.promotionLabel ?? null)
												: (product.pricing?.promotionLabel ?? null)
										}
										canPurchase={canPurchase}
										quickAddDisabled={quickAddDisabled}
										variantOptions={variantOptions}
										productInfo={{
											id: product.id,
											name: product.name,
											images: product.images,
											summary: product.summary ?? null,
										}}
										loading={idx < 3 ? "eager" : "lazy"}
										priority={idx < 3}
									/>
								</Reveal>
							</li>
						);
					})}
				</ul>
			</section>
			<JsonLd jsonLd={mappedProductsToJsonLd(products)} />
		</>
	);
};
