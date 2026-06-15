import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next/types";
import { ProductImageGallery } from "@/app/(store)/product/[slug]/product-image-gallery.client";
import { AddToCart } from "@/components/add-to-cart";
import { publicUrl } from "@/env.mjs";
import { getLocale, getTranslations } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { commerce } from "@/lib/commerce-stripe";
import type { Product, YnsProduct } from "@/lib/commerce-types";
import { getRequestPreferredCurrency } from "@/lib/currency-preference";
import { isFavorite } from "@/lib/favorites";
import { getProductImageOptimizationProps } from "@/lib/product-image-utils";
import { deslugify, formatMoney, formatProductName, slugify } from "@/lib/utils";
import { EditorialEyebrow, EditorialShell } from "@/ui/editorial/editorial-primitives";
import { FavoriteToggle } from "@/ui/favorites/favorite-toggle.client";
import { JsonLd, mappedProductToJsonLd } from "@/ui/json-ld";
import { Markdown } from "@/ui/markdown";
import { Badge } from "@/ui/shadcn/badge";
import { YnsLink } from "@/ui/yns-link";

export const generateMetadata = async (props: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ variant?: string }>;
}): Promise<Metadata> => {
	const params = await props.params;
	const searchParams = await props.searchParams;
	const product = await commerce.product.get({
		slug: params.slug,
		currency: await getRequestPreferredCurrency(),
	});

	if (!product) {
		return notFound();
	}

	const t = await getTranslations("/product.metadata");
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

	const productName = formatProductName(product.name, selectedVariant?.label ?? undefined);
	const description = selectedVariant?.description ?? product.summary ?? undefined;
	const canonical = new URL(`${publicUrl}/product/${params.slug}`);
	const variantSlug = selectedVariant?.slug;
	if (variantSlug) {
		canonical.searchParams.set("variant", variantSlug);
	}

	return {
		title: t("title", { productName }),
		description,
		alternates: { canonical },
	} satisfies Metadata;
};

export default async function SingleProductPage(props: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ variant?: string; image?: string }>;
}) {
	const params = await props.params;
	const searchParams = await props.searchParams;
	const product = await commerce.product.get({
		slug: params.slug,
		currency: await getRequestPreferredCurrency(),
	});
	if (!product) {
		return notFound();
	}

	const t = await getTranslations("/product.page");
	const locale = await getLocale();

	// Cast to YnsProduct to access YNS-specific fields
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
	const images =
		selectedVariant?.images && selectedVariant.images.length > 0 ? selectedVariant.images : product.images;
	const description = selectedVariant?.description ?? product.summary ?? "";
	const displayPrice = selectedVariant?.price ?? product.price;
	const displayBasePrice = selectedVariant?.pricing?.basePrice ?? displayPrice;
	const displayCurrency = selectedVariant?.currency ?? product.currency;
	const displayStock = typeof selectedVariant?.stock === "number" ? selectedVariant?.stock : product.stock;
	const isOutOfStock = displayStock === 0;
	const selectedVariantId = selectedVariant?.id ?? ynsProduct.variants[0]?.id ?? product.id;
	const relatedProducts = (
		await commerce.product.browse({
			first: 3,
			currency: await getRequestPreferredCurrency(),
		})
	).data
		.filter((candidate) => candidate.slug !== product.slug)
		.slice(0, 2);
	const session = await auth();
	const favoriteActive = session
		? await isFavorite({ userId: session.user.id, productSlug: product.slug, variantId: selectedVariantId })
		: false;
	const taxonomy = [
		category ? deslugify(category) : null,
		selectedVariant?.label ? deslugify(selectedVariant.label) : null,
		"Poesia",
		"Corpo",
	]
		.filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index)
		.slice(0, 4);
	const details = [
		{
			label: "Formato impresso",
			value: selectedVariant?.label ? deslugify(selectedVariant.label) : "Edicao impressa",
		},
		{ label: "ISBN", value: "Em atualizacao" },
		{ label: "Ano de publicacao", value: "Edicao atual do selo" },
		{ label: "Editora / selo", value: "Selo Libertaria" },
		{ label: "Envio para todo o Brasil", value: "Disponivel" },
	];

	return (
		<article className="pb-12">
			<EditorialShell className="space-y-10">
				<section className="grid gap-10 lg:grid-cols-[420px_minmax(0,1fr)] lg:items-start">
					<div className="max-w-[420px]">
						<h2 className="sr-only">{t("imagesTitle")}</h2>
						<div className="border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-beige)] p-3">
							<ProductImageGallery images={images} alt={product.name} />
						</div>
					</div>

					<div className="space-y-8 pt-2">
						<div className="flex items-start justify-between gap-4">
							<div className="space-y-5">
								<EditorialEyebrow className="text-[color:var(--editorial-accent)]">
									{category ? deslugify(category) : "Livro"}
								</EditorialEyebrow>
								<h1 className="text-5xl leading-[0.92] font-black tracking-[-0.06em] sm:text-6xl">
									{selectedVariant?.label
										? formatProductName(product.name, selectedVariant.label)
										: product.name}
								</h1>
								<p className="text-lg text-[color:var(--editorial-muted)]">{taxonomy.join(" / ")}</p>
								<p className="price-font text-4xl font-black text-[color:var(--editorial-ink)]">
									{formatMoney({
										amount: displayPrice,
										currency: displayCurrency,
										locale,
									})}
								</p>
								{displayBasePrice > displayPrice ? (
									<p className="text-base text-[color:var(--editorial-muted)] line-through">
										{formatMoney({
											amount: displayBasePrice,
											currency: displayCurrency,
											locale,
										})}
									</p>
								) : null}
								<div className="flex flex-wrap gap-4">
									<AddToCart
										variantId={selectedVariantId}
										className={`${isOutOfStock ? "cursor-not-allowed opacity-50" : ""} inline-flex h-11 items-center justify-center rounded-none bg-[color:var(--editorial-ink)] px-6 text-xs font-black uppercase tracking-[0.18em] text-[color:var(--editorial-paper)] hover:bg-[color:var(--editorial-accent)]`}
									>
										{isOutOfStock ? t("outOfStock") : "Comprar"}
									</AddToCart>
									<YnsLink
										href="#sinopse"
										className="inline-flex h-11 items-center justify-center border border-[color:var(--editorial-ink)] px-6 text-xs font-black uppercase tracking-[0.18em] text-[color:var(--editorial-ink)]"
									>
										Ler trecho
									</YnsLink>
								</div>
								{variants.length > 1 ? (
									<div className="flex flex-wrap gap-2">
										{variants.map((variant) => {
											const currentSlug =
												variant.slug ?? (variant.label ? slugify(variant.label) : variant.id);
											const isActive = selectedVariant?.id === variant.id;
											const href = currentSlug ? `?variant=${currentSlug}` : `?variant=${variant.id}`;
											const label = variant.label ? deslugify(variant.label) : deslugify(currentSlug);
											return (
												<YnsLink key={variant.id} href={href} scroll={false}>
													<Badge
														className={
															isActive
																? "rounded-none bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)] hover:bg-[color:var(--editorial-ink)]"
																: "rounded-none border-[color:var(--editorial-border)] bg-transparent text-[color:var(--editorial-muted)]"
														}
														variant={isActive ? "default" : "outline"}
													>
														{label}
													</Badge>
												</YnsLink>
											);
										})}
									</div>
								) : null}
								{isOutOfStock ? (
									<p className="text-sm text-[color:var(--editorial-muted)]">{t("outOfStock")}</p>
								) : null}
							</div>
							<FavoriteToggle
								productSlug={product.slug}
								variantId={selectedVariantId}
								initialActive={favoriteActive}
							/>
						</div>

						<div className="border-t border-[color:var(--editorial-border)] pt-8" id="sinopse">
							<EditorialEyebrow className="text-[color:var(--editorial-accent)]">Sinopse</EditorialEyebrow>
							<div className="mt-6 max-w-3xl text-2xl leading-[1.45] text-[color:var(--editorial-muted)]">
								<Markdown source={description} />
							</div>
						</div>
					</div>
				</section>

				<section className="grid gap-6 bg-[color:var(--editorial-ink)] px-8 py-12 text-[color:var(--editorial-paper)] lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
					<h2 className="max-w-3xl text-5xl leading-[0.95] font-black tracking-[-0.06em]">
						“Se te começo,
						<br />
						logo me despeço.”
					</h2>
					<p className="max-w-sm text-xl leading-8 text-[color:rgba(247,244,239,0.72)]">
						Trecho visual do livro para criar desejo de leitura.
					</p>
				</section>

				<section className="grid gap-10 lg:grid-cols-[1fr_0.95fr]">
					<div>
						<EditorialEyebrow className="text-[color:var(--editorial-accent)]">Detalhes</EditorialEyebrow>
						<ul className="mt-10 border-t border-[color:var(--editorial-border)]">
							{details.map((detail) => (
								<li
									key={detail.label}
									className="flex flex-col gap-3 border-b border-[color:var(--editorial-border)] py-5 sm:flex-row sm:items-center sm:justify-between"
								>
									<span className="text-2xl leading-tight text-[color:var(--editorial-ink)]">
										{detail.label}
									</span>
									<span className="text-sm uppercase tracking-[0.16em] text-[color:var(--editorial-muted)]">
										{detail.value}
									</span>
								</li>
							))}
						</ul>
					</div>

					<div>
						<EditorialEyebrow className="text-[color:var(--editorial-accent)]">
							Outros livros
						</EditorialEyebrow>
						<div className="mt-10 grid gap-8 sm:grid-cols-2">
							{relatedProducts.map((related) => (
								<RelatedBookCard key={related.id} product={related} />
							))}
						</div>
					</div>
				</section>

				<JsonLd jsonLd={mappedProductToJsonLd(product)} />
			</EditorialShell>
		</article>
	);
}

function RelatedBookCard({ product }: { product: Product }) {
	return (
		<YnsLink href={`/product/${product.slug}`} className="group block">
			<div className="border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-beige)] p-3">
				<div className="aspect-[0.72] overflow-hidden border border-[color:var(--editorial-border)] bg-[color:var(--editorial-paper)]">
					{product.images[0] ? (
						<Image
							src={product.images[0]}
							alt={product.name}
							width={420}
							height={580}
							className="h-full w-full object-cover"
							sizes="220px"
							{...getProductImageOptimizationProps(product.images[0])}
						/>
					) : null}
				</div>
			</div>
			<h3 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-[color:var(--editorial-ink)] group-hover:text-[color:var(--editorial-accent)]">
				{product.name}
			</h3>
			<p className="mt-2 text-sm leading-7 text-[color:var(--editorial-muted)]">
				{product.summary ?? "Novo titulo em breve"}
			</p>
		</YnsLink>
	);
}
