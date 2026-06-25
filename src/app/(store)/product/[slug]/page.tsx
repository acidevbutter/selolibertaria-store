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
import { LiftOnHover, Reveal } from "@/ui/motion/reveal";
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
	const synopsis = description.trim();
	const excerpt = buildEditorialExcerpt(synopsis);
	const excerptHref = excerpt ? "#trecho" : "#sinopse";
	const details = [
		category ? { label: "Categoria", value: deslugify(category) } : null,
		selectedVariant?.label
			? {
					label: "Formato",
					value: deslugify(selectedVariant.label),
				}
			: null,
		{
			label: "Selo / editora",
			value: "Selo Libertária",
		},
		typeof displayStock === "number"
			? {
					label: "Disponibilidade",
					value: displayStock > 0 ? "Disponível" : "Fora de estoque",
				}
			: null,
	].filter(Boolean) as Array<{ label: string; value: string }>;
	const continuityLinks = [
		{ href: "/sarau-safado", label: "Ver Sarau Safado" },
		{ href: "/projects", label: "Ver projetos" },
		{ href: "/products", label: "Ver catálogo" },
	];

	return (
		<article>
			<div className="flex flex-col">
				<section className="bg-[color:var(--editorial-paper)]">
					<EditorialShell className="grid gap-10 py-12 lg:grid-cols-[430px_minmax(0,1fr)] lg:items-start lg:gap-20 lg:py-16">
						<Reveal>
							<div className="max-w-[430px]">
								<h2 className="sr-only">{t("imagesTitle")}</h2>
								<div className="border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-beige)] p-3">
									<ProductImageGallery images={images} alt={product.name} />
								</div>
							</div>
						</Reveal>

						<Reveal delay={0.08}>
							<div className="space-y-8 pt-2">
								<div className="flex items-start justify-between gap-4">
									<div className="space-y-5">
										<EditorialEyebrow className="text-[color:var(--editorial-accent)]">
											{category ? deslugify(category) : "Livro"}
										</EditorialEyebrow>
										<h1 className="display-font max-w-[12ch] text-[3.4rem] leading-[0.9] font-black tracking-[-0.07em] sm:text-[4.5rem] xl:text-[4.9rem]">
											{selectedVariant?.label
												? formatProductName(product.name, selectedVariant.label)
												: product.name}
										</h1>
										{taxonomy.length > 0 ? (
											<p className="text-lg text-[color:var(--editorial-muted)]">{taxonomy.join(" / ")}</p>
										) : null}
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
												className={`${isOutOfStock ? "cursor-not-allowed opacity-50" : ""} inline-flex h-12 items-center justify-center rounded-none bg-[color:var(--editorial-ink)] px-6 text-xs font-black uppercase tracking-[0.18em] text-[color:var(--editorial-paper)] transition-colors duration-300 hover:bg-[color:var(--editorial-accent)]`}
											>
												{isOutOfStock ? t("outOfStock") : "Comprar"}
											</AddToCart>
											<YnsLink
												href={excerptHref}
												className="inline-flex h-12 items-center justify-center border border-[color:var(--editorial-ink)] px-6 text-xs font-black uppercase tracking-[0.18em] text-[color:var(--editorial-ink)] transition-colors duration-300 hover:bg-[color:var(--editorial-beige)]"
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
										{typeof displayStock === "number" ? (
											<p className="text-sm text-[color:var(--editorial-muted)]">
												{displayStock > 0 ? "Disponível para compra" : t("outOfStock")}
											</p>
										) : null}
									</div>
									<FavoriteToggle
										productSlug={product.slug}
										variantId={selectedVariantId}
										initialActive={favoriteActive}
									/>
								</div>

								<div className="border-t border-[color:var(--editorial-border)] pt-8" id="sinopse">
									<EditorialEyebrow className="text-[color:var(--editorial-accent)]">
										Sinopse
									</EditorialEyebrow>
									<div className="mt-6 max-w-3xl text-xl leading-[1.55] text-[color:var(--editorial-muted)] sm:text-2xl">
										<Markdown source={description} />
									</div>
								</div>
							</div>
						</Reveal>
					</EditorialShell>
				</section>

				{excerpt ? (
					<Reveal>
						<section
							className="bg-[color:var(--editorial-ink)] text-[color:var(--editorial-paper)]"
							id="trecho"
						>
							<EditorialShell className="grid gap-6 px-8 py-12 lg:grid-cols-[1.4fr_0.6fr] lg:items-end lg:py-16">
								<div className="border-l-[10px] border-[color:var(--editorial-accent)] pl-6">
									<h2 className="display-font max-w-3xl text-5xl leading-[0.95] font-black tracking-[-0.06em]">
										{excerpt}
									</h2>
								</div>
								<p className="max-w-sm text-xl leading-8 text-[color:rgba(247,244,239,0.72)]">
									Trecho retirado da própria sinopse para sustentar desejo de leitura sem inventar texto
									persistido.
								</p>
							</EditorialShell>
						</section>
					</Reveal>
				) : null}

				<EditorialShell className="grid gap-10 py-12 lg:grid-cols-[1fr_0.95fr] lg:py-16">
					<Reveal>
						<div>
							<EditorialEyebrow className="text-[color:var(--editorial-accent)]">
								Ficha técnica
							</EditorialEyebrow>
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
					</Reveal>

					<Reveal delay={0.08}>
						<div>
							<EditorialEyebrow className="text-[color:var(--editorial-accent)]">
								Outros livros
							</EditorialEyebrow>
							<div className="mt-10 grid gap-8 sm:grid-cols-2">
								{relatedProducts.map((related) => (
									<RelatedBookCard key={related.id} product={related} viewBookLabel="Ver livro" />
								))}
							</div>
						</div>
					</Reveal>
				</EditorialShell>

				<Reveal>
					<section className="bg-[color:var(--editorial-beige)]">
						<EditorialShell className="grid gap-6 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
							<div className="max-w-3xl">
								<h2 className="text-3xl leading-[0.95] font-black sm:text-4xl">
									Um livro pode levar ao Sarau, aos projetos e de volta ao catálogo.
								</h2>
							</div>
							<div className="space-y-4 text-sm leading-7 text-[color:var(--editorial-ink)]">
								<p>
									A PDP continua orientada à compra, mas ganha saídas editoriais claras para ampliar leitura,
									contexto e continuidade cultural.
								</p>
								<div className="flex flex-wrap gap-3">
									{continuityLinks.map((link, index) => (
										<YnsLink
											key={link.href}
											href={link.href}
											className={
												index === 0
													? "inline-flex min-h-11 items-center justify-center bg-[color:var(--editorial-ink)] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-paper)] transition-colors duration-300 hover:bg-[color:var(--editorial-accent)]"
													: "inline-flex min-h-11 items-center justify-center border border-[color:var(--editorial-border)] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-ink)] transition-colors duration-300 hover:bg-white/45"
											}
										>
											{link.label}
										</YnsLink>
									))}
								</div>
							</div>
						</EditorialShell>
					</section>
				</Reveal>

				<JsonLd jsonLd={mappedProductToJsonLd(product)} />
			</div>
		</article>
	);
}

function RelatedBookCard({ product, viewBookLabel }: { product: Product; viewBookLabel: string }) {
	return (
		<LiftOnHover>
			<YnsLink href={`/product/${product.slug}`} className="group block h-full">
				<div className="border border-[color:var(--editorial-ink)] bg-[color:var(--editorial-beige)] p-3">
					<div className="aspect-[0.72] overflow-hidden border border-[color:var(--editorial-border)] bg-[color:var(--editorial-paper)]">
						{product.images[0] ? (
							<Image
								src={product.images[0]}
								alt={product.name}
								width={420}
								height={580}
								className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
								sizes="220px"
								{...getProductImageOptimizationProps(product.images[0])}
							/>
						) : null}
					</div>
				</div>
				<h3 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-[color:var(--editorial-ink)] transition-colors duration-300 group-hover:text-[color:var(--editorial-accent)]">
					{product.name}
				</h3>
				<p className="mt-2 text-sm leading-7 text-[color:var(--editorial-muted)]">
					{product.summary ?? "Novo título em breve"}
				</p>
				<span className="mt-4 inline-flex min-h-11 items-center justify-center border border-[color:var(--editorial-border)] px-4 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--editorial-ink)] transition-colors duration-300 group-hover:border-[color:var(--editorial-accent)] group-hover:bg-[color:rgba(216,208,196,0.24)]">
					{viewBookLabel}
				</span>
			</YnsLink>
		</LiftOnHover>
	);
}

function buildEditorialExcerpt(source: string) {
	const plain = source
		.replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
		.replace(/\[[^\]]+\]\([^)]+\)/g, " ")
		.replace(/[*_`>#-]/g, " ")
		.replace(/\s+/g, " ")
		.trim();

	if (!plain) return null;

	const sentences = plain
		.split(/(?<=[.!?])\s+/)
		.map((sentence) => sentence.trim())
		.filter(Boolean);
	const excerpt = sentences.find((sentence) => sentence.length >= 48) ?? sentences[0] ?? null;
	if (!excerpt) return null;
	return `“${excerpt}”`;
}
