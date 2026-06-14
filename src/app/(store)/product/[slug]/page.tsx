import { notFound } from "next/navigation";
import type { Metadata } from "next/types";
import { Suspense } from "react";
import { ProductImageGallery } from "@/app/(store)/product/[slug]/product-image-gallery.client";
import { AddToCart } from "@/components/add-to-cart";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { publicUrl } from "@/env.mjs";
import { getLocale, getTranslations } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { commerce } from "@/lib/commerce-stripe";
import type { YnsProduct } from "@/lib/commerce-types";
import { getRequestPreferredCurrency } from "@/lib/currency-preference";
import { isFavorite } from "@/lib/favorites";
import { deslugify, formatMoney, formatProductName, slugify } from "@/lib/utils";
import { EditorialEyebrow, EditorialPanel, EditorialShell } from "@/ui/editorial/editorial-primitives";
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
	const seloT = await getTranslations("Selo");
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
	const session = await auth();
	const favoriteActive = session
		? await isFavorite({ userId: session.user.id, productSlug: product.slug, variantId: selectedVariantId })
		: false;

	return (
		<article className="pb-12">
			<EditorialShell className="space-y-6">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild className="inline-flex min-h-12 min-w-12 items-center justify-center">
								<YnsLink href="/products">{t("allProducts")}</YnsLink>
							</BreadcrumbLink>
						</BreadcrumbItem>
						{category && (
							<>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbLink
										className="inline-flex min-h-12 min-w-12 items-center justify-center"
										asChild
									>
										<YnsLink href={`/category/${category}`}>{deslugify(category)}</YnsLink>
									</BreadcrumbLink>
								</BreadcrumbItem>
							</>
						)}
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{product.name}</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className="mt-6 grid gap-6 lg:grid-cols-12">
					<EditorialPanel className="order-2 bg-[color:var(--editorial-beige)] lg:col-span-5 lg:col-start-8 lg:order-none lg:self-start">
						<div className="flex items-start justify-between gap-4">
							<div className="space-y-3">
								<p className="text-xs uppercase tracking-[0.28em] text-[color:var(--editorial-muted)]">
									{category ? deslugify(category) : seloT("product.categoryFallback")}
								</p>
								<h1 className="text-4xl leading-[0.92] font-black tracking-[-0.06em] uppercase sm:text-5xl">
									{selectedVariant?.label
										? formatProductName(product.name, selectedVariant.label)
										: product.name}
								</h1>
							</div>
							<FavoriteToggle
								productSlug={product.slug}
								variantId={selectedVariantId}
								initialActive={favoriteActive}
							/>
						</div>
						<div className="mt-5 space-y-1">
							<p className="text-xs uppercase tracking-[0.22em] text-[color:var(--editorial-muted)]">
								{t("addToCart")}
							</p>
							<p className="price-font text-2xl font-medium leading-none tracking-tight text-[color:var(--editorial-ink)]">
								{formatMoney({
									amount: displayPrice,
									currency: displayCurrency,
									locale,
								})}
							</p>
							{displayBasePrice > displayPrice ? (
								<p className="text-sm text-muted-foreground line-through">
									{formatMoney({
										amount: displayBasePrice,
										currency: displayCurrency,
										locale,
									})}
								</p>
							) : null}
							{selectedVariant?.pricing?.promotionLabel ? (
								<p className="text-xs font-medium uppercase tracking-[0.18em] text-[#d97957]">
									{selectedVariant.pricing.promotionLabel}
								</p>
							) : null}
						</div>
						<div className="mt-3">
							{isOutOfStock && (
								<div className="text-sm text-[color:var(--editorial-muted)]">{t("outOfStock")}</div>
							)}
						</div>
						{description ? (
							<p className="mt-5 max-w-xl text-sm leading-8 text-[color:var(--editorial-muted)]">
								{description.replace(/[#*_`>\n]/g, " ").slice(0, 220)}
								{description.length > 220 ? "..." : ""}
							</p>
						) : null}
					</EditorialPanel>

					<div className="lg:col-span-7 lg:row-span-3 lg:row-start-1">
						<h2 className="sr-only">{t("imagesTitle")}</h2>
						<ProductImageGallery images={images} alt={product.name} />
					</div>

					<div className="grid gap-8 lg:col-span-5">
						{variants.length > 1 && (
							<EditorialPanel className="p-5">
								<h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
									{t("variantTitle")}
								</h2>
								<div className="flex flex-wrap gap-2">
									{variants.map((variant) => {
										const currentSlug = variant.slug ?? (variant.label ? slugify(variant.label) : variant.id);
										const isActive = selectedVariant?.id === variant.id;
										const href = currentSlug ? `?variant=${currentSlug}` : `?variant=${variant.id}`;
										const label = variant.label ? deslugify(variant.label) : deslugify(currentSlug);
										return (
											<YnsLink key={variant.id} href={href} scroll={false}>
												<Badge
													className={
														isActive
															? "bg-red-600 text-black hover:bg-red-600"
															: "border-border text-muted-foreground hover:bg-muted/70"
													}
													variant={isActive ? "default" : "outline"}
												>
													{label}
												</Badge>
											</YnsLink>
										);
									})}
								</div>
							</EditorialPanel>
						)}
						<EditorialPanel className="p-5">
							<h2 className="sr-only">{t("descriptionTitle")}</h2>
							<div className="prose text-secondary-foreground">
								<Markdown source={description} />
							</div>
						</EditorialPanel>

						<AddToCart
							variantId={selectedVariantId}
							className={`${isOutOfStock ? "opacity-50 cursor-not-allowed" : ""} display-font`}
						>
							{isOutOfStock ? t("outOfStock") : t("addToCart")}
						</AddToCart>
					</div>
				</div>

				<div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
					<EditorialPanel className="border-l-[12px] border-l-[color:var(--editorial-accent)] bg-[color:var(--editorial-beige)] sm:p-8">
						<EditorialEyebrow>{seloT("product.editorialEyebrow")}</EditorialEyebrow>
						<h2 className="mt-3 max-w-3xl text-balance text-3xl leading-[0.95] font-black tracking-[-0.05em] uppercase sm:text-4xl">
							{seloT("product.editorialTitle")}
						</h2>
						<p className="mt-4 max-w-2xl text-sm leading-8 text-[color:var(--editorial-muted)] sm:text-base">
							{seloT("product.editorialBody")}
						</p>
					</EditorialPanel>

					<EditorialPanel className="sm:p-8">
						<EditorialEyebrow>{seloT("product.continueEyebrow")}</EditorialEyebrow>
						<div className="mt-5 grid gap-4">
							<YnsLink
								href="/events"
								className="border border-border/50 bg-background/70 px-4 py-4 transition-colors hover:bg-accent"
							>
								<span className="editorial-serif block text-2xl font-semibold">
									{seloT("product.eventsTitle")}
								</span>
								<span className="mt-1 block text-sm leading-7 text-muted-foreground">
									{seloT("product.eventsBody")}
								</span>
							</YnsLink>
							<YnsLink
								href="/projects"
								className="border border-border/50 bg-background/70 px-4 py-4 transition-colors hover:bg-accent"
							>
								<span className="editorial-serif block text-2xl font-semibold">
									{seloT("product.projectsTitle")}
								</span>
								<span className="mt-1 block text-sm leading-7 text-muted-foreground">
									{seloT("product.projectsBody")}
								</span>
							</YnsLink>
							<YnsLink
								href="/sarau-safado"
								className="border border-border/50 bg-background/70 px-4 py-4 transition-colors hover:bg-accent"
							>
								<span className="editorial-serif block text-2xl font-semibold">Sarau Safado</span>
								<span className="mt-1 block text-sm leading-7 text-muted-foreground">
									{seloT("product.sarauBody")}
								</span>
							</YnsLink>
						</div>
					</EditorialPanel>
				</div>

				<EditorialPanel className="mt-6 grid gap-6 sm:p-8 lg:grid-cols-[0.95fr_1.05fr]">
					<div>
						<EditorialEyebrow>Leitura da obra</EditorialEyebrow>
						<h2 className="editorial-serif mt-4 text-3xl font-semibold sm:text-4xl">
							A compra é direta, mas a leitura continua para além da ficha do produto.
						</h2>
					</div>
					<div className="grid gap-4 sm:grid-cols-3">
						<div className="border border-border/50 bg-card/60 p-4">
							<p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Livro</p>
							<p className="mt-3 text-sm leading-7 text-muted-foreground">
								Este título entra no catálogo como obra e como porta de entrada para o universo do selo.
							</p>
						</div>
						<div className="border border-border/50 bg-card/60 p-4">
							<p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Presença</p>
							<p className="mt-3 text-sm leading-7 text-muted-foreground">
								Leituras públicas, saraus e oficinas ampliam a experiência de leitura sem competir com a
								compra.
							</p>
						</div>
						<div className="border border-border/50 bg-card/60 p-4">
							<p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Continuidade</p>
							<p className="mt-3 text-sm leading-7 text-muted-foreground">
								O catálogo funciona melhor quando cada página convida a seguir para outras camadas do projeto.
							</p>
						</div>
					</div>
				</EditorialPanel>

				<Suspense>
					<SimilarProducts id={selectedVariant?.productId ?? product.id} />
				</Suspense>
				<JsonLd jsonLd={mappedProductToJsonLd(product)} />
			</EditorialShell>
		</article>
	);
}

async function SimilarProducts({ id }: { id: string }) {
	// TODO: Implement similar products functionality
	return null;
}
