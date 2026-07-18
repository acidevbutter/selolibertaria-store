import "server-only";

import { commerce } from "@/lib/commerce";
import type { Cart, CartItem } from "@/lib/commerce-types";
import type { SupportedCurrency } from "@/lib/currency";
import { priceCartLines, type ResolvedCartPricingLine, resolveCouponByCode } from "@/lib/promotions";
import { resolveShippingQuotesForUser, toShippingRate } from "@/lib/shipping";

interface MinimalItem {
	productId: string;
	variantId: string;
	quantity: number;
}

export interface ResolvedCheckoutPricingItem {
	id: string;
	productId: string;
	productSlug: string;
	categorySlug?: string | null;
	variantId: string;
	priceId: string;
	name: string;
	image: string | null;
	variantLabel?: string | null;
	productType?: string | null;
	format?: string | null;
	quantity: number;
	baseUnitAmount: number;
	unitAmount: number;
	lineBaseTotal: number;
	lineDiscountTotal: number;
	lineFinalTotal: number;
	appliedPromotions: NonNullable<CartItem["appliedPromotions"]>;
}

export interface PricedCartPayload {
	cart: Cart;
	checkoutItems: ResolvedCheckoutPricingItem[];
	couponContext: {
		promotionId: string;
		promotionCodeId: string;
		code: string;
	} | null;
}

export async function buildPricedCartPayload(args: {
	cartId: string;
	minimalItems: MinimalItem[];
	couponCode?: string | null;
	userId?: string | null;
	strictCoupon?: boolean;
	preferredCurrency?: SupportedCurrency | null;
}): Promise<PricedCartPayload> {
	async function resolveLines(preferredCurrency?: SupportedCurrency | null) {
		const resolvedLines: Array<
			ResolvedCartPricingLine & {
				variantLabel?: string | null;
				priceId?: string | null;
				productType?: string | null;
				format?: string | null;
			}
		> = [];
		let currency = "BRL";

		for (const minimal of args.minimalItems) {
			const resolved = await commerce.variant
				.resolve({ id: minimal.variantId, currency: preferredCurrency })
				.catch(async () =>
					commerce.variant.resolve({ id: minimal.productId, currency: preferredCurrency }).catch(() => null),
				);
			if (!resolved) continue;

			const { product, variant } = resolved;
			const effectiveUnitAmount = variant.pricing?.effectivePrice ?? variant.price ?? product.price ?? 0;
			const baseUnitAmount = variant.pricing?.basePrice ?? variant.price ?? product.price ?? 0;
			if (effectiveUnitAmount <= 0) continue;
			currency = (variant.currency || product.currency || currency).toUpperCase();
			resolvedLines.push({
				item: {
					id: variant.id,
					productId: product.id,
					variantId: variant.id,
					quantity: minimal.quantity,
					price: effectiveUnitAmount,
					product: { id: product.id, name: product.name, images: product.images, summary: product.summary },
					basePrice: baseUnitAmount,
					finalPrice: effectiveUnitAmount,
					appliedPromotions: [...(variant.appliedPromotions ?? [])],
				},
				productSlug: product.slug,
				categorySlug: product.category?.slug ?? null,
				baseUnitAmount,
				effectiveUnitAmount,
				currency,
				variantLabel: variant.label ?? null,
				priceId: variant.priceId ?? null,
				productType: variant.productType ?? product.productType ?? null,
				format: variant.format ?? product.format ?? null,
			});
		}

		return { resolvedLines, currencySet: new Set(resolvedLines.map((line) => line.currency.toUpperCase())) };
	}

	let { resolvedLines } = await resolveLines(args.preferredCurrency);
	const resolvedCurrencySet = new Set(resolvedLines.map((line) => line.currency.toUpperCase()));
	if (args.preferredCurrency && resolvedCurrencySet.size > 1) {
		({ resolvedLines } = await resolveLines(null));
	}

	const pricing = await priceCartLines({
		lines: resolvedLines,
		couponCode: args.couponCode,
		userId: args.userId,
		strictCoupon: args.strictCoupon,
	});

	const shippingResolution =
		args.userId && pricing.items.length > 0
			? await resolveShippingQuotesForUser({
					userId: args.userId,
					subtotal: pricing.subtotal,
					currency: resolvedLines[0]?.currency ?? "BRL",
					items: pricing.items.map((item, index) => ({
						productId: item.productId,
						variantId: item.variantId,
						quantity: item.quantity,
						price: item.price,
						productType: resolvedLines[index]?.productType ?? null,
						format: resolvedLines[index]?.format ?? null,
					})),
				}).catch((error) => ({
					quotes: [],
					selected: null,
					provider: null,
					error: error instanceof Error ? error.message : "No shipping quote available",
				}))
			: { quotes: [], selected: null, provider: null, error: null as string | null };
	const shippingRate = toShippingRate(shippingResolution.selected);
	const shippingAmount = shippingRate?.fixed_amount.amount ?? 0;

	const checkoutItems = pricing.items.map((item, index) => {
		const resolvedLine = resolvedLines[index];
		return {
			id: item.id,
			productId: item.productId,
			productSlug: resolvedLine?.productSlug ?? item.productId,
			categorySlug: resolvedLine?.categorySlug ?? null,
			variantId: item.variantId,
			priceId: resolvedLine?.priceId ?? item.variantId,
			name: item.product?.name ?? "Product",
			image: item.product?.images?.[0] || null,
			variantLabel: resolvedLine?.variantLabel ?? null,
			productType: resolvedLine?.productType ?? null,
			format: resolvedLine?.format ?? null,
			quantity: item.quantity,
			baseUnitAmount: item.basePrice ?? item.price,
			unitAmount: item.finalPrice ?? item.price,
			lineBaseTotal: item.lineBaseTotal ?? (item.basePrice ?? item.price) * item.quantity,
			lineDiscountTotal: item.lineDiscountTotal ?? 0,
			lineFinalTotal: item.lineFinalTotal ?? item.price * item.quantity,
			appliedPromotions: item.appliedPromotions ?? [],
		};
	});

	const couponResolution = pricing.couponCode ? await resolveCouponByCode(pricing.couponCode) : null;

	return {
		cart: {
			id: args.cartId,
			items: pricing.items,
			total: pricing.total + shippingAmount,
			currency: resolvedLines[0]?.currency ?? "BRL",
			subtotal: pricing.subtotal,
			discountTotal: pricing.discountTotal,
			couponCode: pricing.couponCode,
			couponError: pricing.couponError,
			appliedPromotions: pricing.appliedPromotions,
			shippingRate,
			shippingError: shippingResolution.error ?? null,
		},
		checkoutItems,
		couponContext:
			couponResolution?.promotion._id && couponResolution.code._id
				? {
						promotionId: couponResolution.promotion._id.toString(),
						promotionCodeId: couponResolution.code._id.toString(),
						code: couponResolution.code.code,
					}
				: null,
	};
}
