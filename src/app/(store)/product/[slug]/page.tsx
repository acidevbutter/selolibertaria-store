import type { Metadata } from "next/types";
import { ProductImageGallery } from "@/app/(store)/product/[slug]/product-image-gallery.client";
import { SlAddToCart } from "@/components/sl-add-to-cart.client";
import { publicUrl } from "@/env.mjs";
import { getLocale, getTranslations } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { canBuyOnSelolibertaria } from "@/lib/authz";
import { commerce } from "@/lib/commerce";
import type { YnsProduct } from "@/lib/commerce-types";
import { getRequestPreferredCurrency } from "@/lib/currency-preference";
import { getEditorialProductPage } from "@/lib/editorial-content-store";
import { isFavorite } from "@/lib/favorites";
import { buildSlProductRows } from "@/lib/sl-catalog";
import { deslugify, formatMoney, formatProductName, slugify } from "@/lib/utils";
import { FavoriteToggle } from "@/ui/favorites/favorite-toggle.client";
import { JsonLd, mappedProductToJsonLd } from "@/ui/json-ld";
import { Markdown } from "@/ui/markdown";
import { SlButton } from "@/ui/sl/sl-button";
import { SlPriceTag } from "@/ui/sl/sl-price-tag";
import { SlProductCard } from "@/ui/sl/sl-product-card.client";
import { SlSectionHead } from "@/ui/sl/sl-section-head";
import { YnsLink } from "@/ui/yns-link";

export const generateMetadata = async (props: { params: Promise<{ slug: string }> }): Promise<Metadata> => {
	const params = await props.params;
	const pageContent = await getEditorialProductPage();
	const product = await commerce.product.get({
		slug: params.slug,
		currency: await getRequestPreferredCurrency(),
	});

	if (!product) {
		return {
			title: `${pageContent.notFound?.title || "Produto não encontrado"} · Selo Libertária`,
			description:
				pageContent.notFound?.body ||
				"Este título não está disponível agora. Continue pelo catálogo ou fale com o selo.",
		};
	}

	return {
		title: `${product.name} · Selo Libertária`,
		description: product.summary ?? "Produto do catálogo do Selo Libertária.",
		alternates: { canonical: `${publicUrl}/product/${product.slug}` },
	};
};

export default async function SingleProductPage(props: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ variant?: string }>;
}) {
	const params = await props.params;
	const searchParams = await props.searchParams;
	const currency = await getRequestPreferredCurrency();
	const [product, t, locale, pageContent, session] = await Promise.all([
		commerce.product.get({ slug: params.slug, currency }),
		getTranslations("/product.page"),
		getLocale(),
		getEditorialProductPage(),
		auth(),
	]);

	if (!product) {
		return (
			<div className="sl-scope" style={{ background: "var(--sl-surface-invert)" }}>
				<div className="mx-auto grid min-h-[60vh] w-full max-w-[var(--sl-w-narrow)] gap-6 px-4 py-20 text-[color:var(--sl-text-on-ink)] sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-12">
					<div className="flex flex-col gap-5">
						<p className="sl-eyebrow m-0 text-[color:var(--sl-text-on-ink-label)]">Catálogo</p>
						<h1 className="sl-head m-0 text-[clamp(40px,7vw,var(--sl-size-hero-md))] leading-[0.92]">
							{pageContent.notFound?.title || "Produto não encontrado"}
						</h1>
						<p className="m-0 max-w-2xl text-[16px] leading-[1.8] text-[color:var(--sl-text-on-ink-muted)]">
							{pageContent.notFound?.body ||
								"Este título não está disponível agora. Continue pelo catálogo ou fale com o selo."}
						</p>
					</div>
					<div className="flex flex-wrap gap-3 lg:justify-end">
						<SlButton href={pageContent.notFound?.primaryCtaHref || "/products"} variant="buy">
							{pageContent.notFound?.primaryCtaLabel || "Ver a loja"}
						</SlButton>
						<SlButton href="/contact" variant="secondary" onInk>
							Falar com o selo
						</SlButton>
					</div>
				</div>
			</div>
		);
	}

	const ynsProduct = product as YnsProduct;
	const variants = ynsProduct.variants ?? [];
	const variantParam = searchParams.variant?.toLowerCase();
	const selectedVariant =
		variants.find((variant) => {
			if (!variantParam) return false;
			const identifiers = [variant.slug, variant.id, variant.label]
				.filter((value): value is string => Boolean(value))
				.map((value) => value.toLowerCase());
			if (variant.label) identifiers.push(slugify(variant.label).toLowerCase());
			return identifiers.includes(variantParam);
		}) ?? variants[0];

	const category = ynsProduct.category?.slug;
	const categoryName = ynsProduct.category?.name ?? (category ? deslugify(category) : "Produto");
	const images =
		selectedVariant?.images && selectedVariant.images.length > 0 ? selectedVariant.images : product.images;
	const description = selectedVariant?.description ?? product.summary ?? "";
	const displayPrice = selectedVariant?.price ?? product.price;
	const displayBasePrice = selectedVariant?.pricing?.basePrice ?? displayPrice;
	const displayCurrency = selectedVariant?.currency ?? product.currency;
	const displayStock = typeof selectedVariant?.stock === "number" ? selectedVariant.stock : product.stock;
	const isOutOfStock = displayStock === 0;
	const selectedVariantId = selectedVariant?.id ?? ynsProduct.variants?.[0]?.id ?? product.id;
	const displayName = selectedVariant?.label
		? formatProductName(product.name, selectedVariant.label)
		: product.name;

	const priceLabel = formatMoney({ amount: displayPrice, currency: displayCurrency, locale });
	// Only pitch installments when 6x lands above ~R$25 each.
	const installmentLabel =
		displayPrice >= 15000
			? `ou 6x de ${formatMoney({
					amount: Math.round(displayPrice / 6),
					currency: displayCurrency,
					locale,
				})} sem juros`
			: undefined;

	const canPurchase = canBuyOnSelolibertaria(session?.user.role);
	const favoriteActive = session
		? await isFavorite({ userId: session.user.id, productSlug: product.slug, variantId: selectedVariantId })
		: false;

	const relatedRows = buildSlProductRows(
		(await commerce.product.browse({ first: 5, currency })).data
			.filter((candidate) => candidate.slug !== product.slug)
			.slice(0, 4),
		{ locale, canPurchase },
	);

	const trust = [
		"Envio em até 2 dias úteis após a confirmação, com rastreio pelo Melhor Envio.",
		"Troca ou devolução em até 7 dias após o recebimento.",
		"Pagamento processado pelo Mercado Pago — não guardamos dados de cartão.",
	];

	return (
		<div className="sl-scope" style={{ background: "var(--sl-surface-page)" }}>
			<div className="mx-auto flex w-full max-w-[var(--sl-w-narrow)] flex-col gap-7 px-4 py-8 sm:px-8 lg:px-10 lg:py-12">
				<p className="m-0 text-[12px] uppercase tracking-[0.18em] text-[color:var(--sl-text-soft)]">
					<YnsLink href="/products" className="sl-link">
						Loja
					</YnsLink>{" "}
					/ {categoryName} / <span className="text-[color:var(--sl-accent)]">{product.name}</span>
				</p>

				<div className="grid items-start gap-10 lg:grid-cols-[1fr_420px]">
					<div className="flex flex-col gap-5">
						<div
							className="overflow-hidden p-3"
							style={{ border: "1px solid var(--sl-ink)", background: "var(--sl-sand)" }}
						>
							<ProductImageGallery images={images} alt={displayName} />
						</div>
						{description ? (
							<div className="flex flex-col gap-3 border-t border-[color:var(--sl-line-hairline)] pt-6">
								<h2 className="sl-price m-0 text-[30px]">Sobre a edição</h2>
								<div className="max-w-[60ch] text-[16px] leading-[1.8] text-[color:var(--sl-text-muted)]">
									<Markdown source={description} />
								</div>
							</div>
						) : null}
					</div>

					<div className="flex flex-col gap-4">
						<div
							className="flex flex-col gap-5 p-7"
							style={{ background: "var(--sl-surface-invert)", color: "var(--sl-text-on-ink)" }}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex flex-col gap-2">
									<span className="text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--sl-text-on-ink-label)]">
										{categoryName}
									</span>
									<h1
										className="sl-head m-0 text-[clamp(30px,5vw,var(--sl-size-hero-sm))] leading-[0.98]"
										style={{ letterSpacing: "var(--sl-track-head)" }}
									>
										{displayName}
									</h1>
								</div>
								<FavoriteToggle
									productSlug={product.slug}
									variantId={selectedVariantId}
									initialActive={favoriteActive}
								/>
							</div>

							<SlPriceTag value={priceLabel} aside={installmentLabel} size="lg" onInk />
							{displayBasePrice > displayPrice ? (
								<span className="text-[13px] text-[color:var(--sl-text-on-ink-soft)] line-through">
									{formatMoney({ amount: displayBasePrice, currency: displayCurrency, locale })}
								</span>
							) : null}

							{variants.length > 1 ? (
								<div className="flex flex-col gap-2">
									<span className="text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--sl-text-on-ink-label)]">
										Formato
									</span>
									<div className="flex flex-wrap gap-2">
										{variants.map((variant) => {
											const currentSlug =
												variant.slug ?? (variant.label ? slugify(variant.label) : variant.id);
											const isActive = selectedVariant?.id === variant.id;
											return (
												<YnsLink
													key={variant.id}
													href={`?variant=${currentSlug}`}
													scroll={false}
													className="inline-flex h-12 items-center px-[18px] text-[12px] font-black uppercase tracking-[0.18em]"
													style={
														isActive
															? { background: "var(--sl-paper)", color: "var(--sl-ink)" }
															: {
																	border: "1px solid var(--sl-line-on-ink-mid)",
																	color: "var(--sl-text-on-ink)",
																}
													}
												>
													{variant.label ? deslugify(variant.label) : deslugify(currentSlug)}
												</YnsLink>
											);
										})}
									</div>
								</div>
							) : null}

							<div className="flex flex-col gap-2">
								<span className="text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--sl-text-on-ink-label)]">
									Entrega
								</span>
								<p className="m-0 text-[14px] leading-[1.6] text-[color:var(--sl-text-on-ink-soft)]">
									Frete calculado no carrinho pelo CEP — o valor final não muda no checkout.
								</p>
							</div>

							<div className="flex flex-col gap-2.5">
								{canPurchase ? (
									<>
										<SlAddToCart
											variantId={selectedVariantId}
											productInfo={{
												id: product.id,
												name: displayName,
												images,
												summary: product.summary ?? null,
											}}
											redirectTo="/checkout"
											variant="buy"
											disabled={isOutOfStock}
											className="w-full"
										>
											{isOutOfStock ? t("outOfStock") : "Comprar agora"}
										</SlAddToCart>
										<SlAddToCart
											variantId={selectedVariantId}
											productInfo={{
												id: product.id,
												name: displayName,
												images,
												summary: product.summary ?? null,
											}}
											variant="secondary"
											onInk
											disabled={isOutOfStock}
											className="w-full"
										>
											{t("addToCart")}
										</SlAddToCart>
									</>
								) : (
									<SlButton href="/contact" variant="secondary" onInk fullWidth>
										Falar com o selo
									</SlButton>
								)}
							</div>
						</div>

						<div
							className="flex flex-col gap-3 p-5"
							style={{ border: "1px solid var(--sl-line)", background: "var(--sl-surface-card)" }}
						>
							{trust.map((line) => (
								<div key={line} className="flex items-baseline gap-3">
									<span className="font-black text-[color:var(--sl-accent)]">✓</span>
									<p className="m-0 text-[14px] leading-[1.6]">{line}</p>
								</div>
							))}
						</div>
					</div>
				</div>

				{relatedRows.length > 0 ? (
					<div className="flex flex-col gap-6 border-t border-[color:var(--sl-line-hairline)] pt-8">
						<SlSectionHead
							title="Quem levou também levou"
							action={
								<SlButton href="/products" variant="secondary">
									Ver a loja
								</SlButton>
							}
						/>
						<div className="grid grid-cols-2 gap-[var(--sl-grid-gap-sm)] md:gap-[var(--sl-grid-gap)] lg:grid-cols-4">
							{relatedRows.map((row) => (
								<SlProductCard key={row.id} row={row} />
							))}
						</div>
					</div>
				) : null}
			</div>

			<JsonLd jsonLd={mappedProductToJsonLd(product)} />
		</div>
	);
}
