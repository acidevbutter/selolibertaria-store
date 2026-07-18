import { getLocale, getTranslations } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { canBuyOnSelolibertaria } from "@/lib/authz";
import type { Product } from "@/lib/commerce-types";
import { buildFavoriteKey, listFavoriteKeysForUser } from "@/lib/favorites";
import { deslugify, formatMoney } from "@/lib/utils";
import { EditorialEyebrow } from "@/ui/editorial/editorial-primitives";
import { EditorialRichText } from "@/ui/editorial/editorial-rich-text";
import { JsonLd, mappedProductsToJsonLd } from "@/ui/json-ld";
import { Reveal } from "@/ui/motion/reveal";
import { ProductCard } from "@/ui/products/product-card.client";

type ProductListProps = {
	products: Product[];
	anchorId?: string;
	eyebrow?: string;
	title?: string;
	description?: string;
};

export const ProductList = async ({
	products,
	anchorId,
	eyebrow = "Catálogo",
	title = "Poucos ruídos, capas em destaque e saída clara para compra.",
	description = "A página de produtos deve preservar a operação de loja enquanto apresenta cada item como objeto editorial.",
}: ProductListProps) => {
	const [locale, t, session] = await Promise.all([getLocale(), getTranslations("Global.products"), auth()]);
	const favoriteKeys = session ? await listFavoriteKeysForUser(session.user.id) : new Set<string>();
	const canPurchase = canBuyOnSelolibertaria(session?.user.role);

	const productsWithDisplayData = products.map((product) => {
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

		const lowestBase = Math.min(...priceEntries.map((entry) => entry.base));
		const lowestEffective = Math.min(...priceEntries.map((entry) => entry.effective));
		const priceLabel = formatMoney({
			amount: lowestEffective,
			currency: product.currency,
			locale,
		});
		const compareAtLabel =
			lowestBase !== lowestEffective
				? formatMoney({
						amount: lowestBase,
						currency: product.currency,
						locale,
					})
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

		return {
			product,
			favoriteActive: favoriteKeys.has(favoriteKey),
			variantId: preferredVariant?.id ?? defaultVariant?.id ?? null,
			priceLabel: selectedVariantPriceLabel,
			compareAtLabel: selectedVariantCompareAtLabel,
			promotionLabel: preferredVariant
				? (preferredVariant.pricing?.promotionLabel ?? null)
				: (product.pricing?.promotionLabel ?? null),
			quickAddDisabled,
			variantOptions,
		};
	});

	const header = (
		<Reveal>
			<div className="space-y-5">
				<div className="space-y-3">
					<EditorialEyebrow className="text-[color:var(--editorial-accent)]">{eyebrow}</EditorialEyebrow>
					<h2 className="max-w-[14ch] text-3xl leading-[0.95] font-black tracking-[-0.04em] text-[color:var(--editorial-ink)] sm:text-5xl">
						{title}
					</h2>
				</div>
				<EditorialRichText
					source={description}
					className="max-w-[34rem] text-sm leading-7 text-[color:var(--editorial-muted)] sm:text-base"
				/>
			</div>
		</Reveal>
	);

	const singleEntry = productsWithDisplayData[0];

	return (
		<>
			<section
				id={anchorId}
				className="space-y-8 scroll-mt-28 border-t border-[color:var(--editorial-border)] pt-8"
			>
				{productsWithDisplayData.length === 1 && singleEntry ? (
					<div className="grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_320px] xl:items-start">
						{header}
						<div className="w-full max-w-[20rem] xl:justify-self-end">
							<Reveal delay={0.06}>
								<ProductCard
									href={`/product/${singleEntry.product.slug}`}
									name={singleEntry.product.name}
									imageUrl={singleEntry.product.images[0] ?? null}
									imageAlt={singleEntry.product.name}
									productSlug={singleEntry.product.slug}
									variantId={singleEntry.variantId}
									favoriteActive={singleEntry.favoriteActive}
									priceLabel={singleEntry.priceLabel}
									compareAtLabel={singleEntry.compareAtLabel}
									promotionLabel={singleEntry.promotionLabel}
									canPurchase={canPurchase}
									quickAddDisabled={singleEntry.quickAddDisabled}
									variantOptions={singleEntry.variantOptions}
									productInfo={{
										id: singleEntry.product.id,
										name: singleEntry.product.name,
										images: singleEntry.product.images,
										summary: singleEntry.product.summary ?? null,
									}}
									loading="eager"
									priority
								/>
							</Reveal>
						</div>
					</div>
				) : (
					<>
						<div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(280px,0.9fr)] lg:items-start">
							{header}
						</div>
						<ul
							className={`grid justify-items-center gap-8 ${
								productsWithDisplayData.length === 2
									? "grid-cols-1 md:grid-cols-2"
									: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
							}`}
						>
							{productsWithDisplayData.map((entry, idx) => (
								<li key={entry.product.id} className="relative w-full max-w-[20rem]">
									<Reveal delay={0.04 * idx}>
										<ProductCard
											href={`/product/${entry.product.slug}`}
											name={entry.product.name}
											imageUrl={entry.product.images[0] ?? null}
											imageAlt={entry.product.name}
											productSlug={entry.product.slug}
											variantId={entry.variantId}
											favoriteActive={entry.favoriteActive}
											priceLabel={entry.priceLabel}
											compareAtLabel={entry.compareAtLabel}
											promotionLabel={entry.promotionLabel}
											canPurchase={canPurchase}
											quickAddDisabled={entry.quickAddDisabled}
											variantOptions={entry.variantOptions}
											productInfo={{
												id: entry.product.id,
												name: entry.product.name,
												images: entry.product.images,
												summary: entry.product.summary ?? null,
											}}
											loading={idx < 3 ? "eager" : "lazy"}
											priority={idx < 3}
										/>
									</Reveal>
								</li>
							))}
						</ul>
					</>
				)}
			</section>
			<JsonLd jsonLd={mappedProductsToJsonLd(products)} />
		</>
	);
};
