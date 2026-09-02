import type { Product, ProductInfo } from "@/lib/commerce-types";
import { capitalize, deslugify, formatMoney, slugify } from "@/lib/utils";

export type SlBadgeTone = "buy" | "ink" | "paper";

/** Fully-serialisable row consumed by the SL client grid. */
export interface SlProductRow {
	id: string;
	slug: string;
	href: string;
	name: string;
	imageUrl: string | null;
	imageAlt: string;
	category: string;
	categoryKey: string;
	blurb: string;
	priceLabel: string;
	compareAtLabel: string | null;
	note: string;
	badge: string | null;
	badgeTone: SlBadgeTone;
	soldOut: boolean;
	actionLabel: string;
	variantId: string | null;
	canPurchase: boolean;
	productInfo: ProductInfo;
}

export interface SlCategoryFacet {
	key: string;
	label: string;
	count: number;
}

const DEFAULT_BLURB =
	"Uma edição do catálogo do Selo Libertária — livro, som, zine ou objeto, na mesma mesa de curadoria.";

function resolveCategory(product: Product): { label: string; key: string } {
	const fromCategory = product.category?.name?.trim();
	if (fromCategory) {
		return { label: fromCategory, key: product.category?.slug?.trim() || slugify(fromCategory) };
	}
	const fromType = product.productType?.trim();
	if (fromType) {
		return { label: capitalize(deslugify(fromType)), key: slugify(fromType) };
	}
	return { label: "Outros", key: "outros" };
}

function resolveNote(product: Product, stock: number | null, soldOut: boolean): string {
	if (soldOut) return "Esgotado";
	const format = (product.format ?? product.variants?.[0]?.format ?? "").toLowerCase();
	const type = (product.productType ?? "").toLowerCase();
	if (/digital|son|audio|áudio|ebook|e-book/.test(`${format} ${type}`)) return "Entrega digital";
	if (typeof stock === "number" && stock > 0 && stock <= 8) return `${stock} restantes`;
	return "Em estoque";
}

function resolveAction(categoryKey: string, soldOut: boolean): string {
	if (soldOut) return "Avise-me";
	if (/ingresso|ticket/.test(categoryKey)) return "Garantir ingresso";
	if (/laborat|workshop|curso|oficina/.test(categoryKey)) return "Inscrever";
	return "Adicionar";
}

/** Map the commerce `Product[]` to SL grid rows. `locale` comes from the server. */
export function buildSlProductRows(
	products: Product[],
	{ locale, canPurchase }: { locale: string; canPurchase: boolean },
): SlProductRow[] {
	return products.map((product) => {
		const variants = product.variants ?? [];
		const preferred = variants.find((v) => (v.stock ?? 1) > 0) ?? variants[0] ?? null;

		const priceEntries =
			variants.length > 0
				? variants.map((v) => ({
						base: v.pricing?.basePrice ?? v.price ?? 0,
						effective: v.pricing?.effectivePrice ?? v.price ?? 0,
					}))
				: [
						{
							base: product.pricing?.basePrice ?? product.price,
							effective: product.pricing?.effectivePrice ?? product.price,
						},
					];
		const lowestBase = Math.min(...priceEntries.map((e) => e.base));
		const lowestEffective = Math.min(...priceEntries.map((e) => e.effective));

		const priceLabel = formatMoney({ amount: lowestEffective, currency: product.currency, locale });
		const compareAtLabel =
			lowestBase !== lowestEffective
				? formatMoney({ amount: lowestBase, currency: product.currency, locale })
				: null;

		const stock =
			typeof preferred?.stock === "number"
				? preferred.stock
				: typeof product.stock === "number"
					? product.stock
					: null;
		const soldOut = stock !== null && stock <= 0;

		const { label: category, key: categoryKey } = resolveCategory(product);
		const promotionLabel = preferred?.pricing?.promotionLabel ?? product.pricing?.promotionLabel ?? null;

		let badge: string | null = null;
		let badgeTone: SlBadgeTone = "ink";
		if (soldOut) {
			badge = "Esgotado";
			badgeTone = "paper";
		} else if (promotionLabel) {
			badge = promotionLabel;
			badgeTone = "buy";
		}

		return {
			id: product.id,
			slug: product.slug,
			href: `/product/${product.slug}`,
			name: product.name,
			imageUrl: product.images[0] ?? null,
			imageAlt: product.name,
			category,
			categoryKey,
			blurb: product.summary?.trim() || DEFAULT_BLURB,
			priceLabel,
			compareAtLabel,
			note: resolveNote(product, stock, soldOut),
			badge,
			badgeTone,
			soldOut,
			actionLabel: resolveAction(categoryKey, soldOut),
			variantId: preferred?.id ?? variants[0]?.id ?? null,
			canPurchase: canPurchase && !soldOut,
			productInfo: {
				id: product.id,
				name: product.name,
				images: product.images,
				summary: product.summary ?? null,
			},
		} satisfies SlProductRow;
	});
}

/** Derive the category bar facets straight from the rows (client-side truth). */
export function deriveSlCategories(rows: SlProductRow[]): SlCategoryFacet[] {
	const map = new Map<string, SlCategoryFacet>();
	for (const row of rows) {
		const existing = map.get(row.categoryKey);
		if (existing) {
			existing.count += 1;
		} else {
			map.set(row.categoryKey, { key: row.categoryKey, label: row.category, count: 1 });
		}
	}
	const facets = [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
	return [{ key: "all", label: "Tudo", count: rows.length }, ...facets];
}
