import "server-only";

import { env } from "@/env.mjs";
import type { AppliedPromotion, CartItem, Product, YnsProduct } from "@/lib/commerce-types";
import type {
	PromotionBenefitType,
	PromotionKind,
	PromotionScope,
	PromotionStackingMode,
	PromotionStatus,
} from "@/lib/promotions-types";
import { slugify } from "@/lib/utils";

export type {
	PromotionBenefitType,
	PromotionKind,
	PromotionScope,
	PromotionStackingMode,
	PromotionStatus,
} from "@/lib/promotions-types";

export interface PromotionTargets {
	productSlugs?: string[];
	variantIds?: string[];
	categorySlugs?: string[];
	excludeProductSlugs?: string[];
	excludeVariantIds?: string[];
	excludeCategorySlugs?: string[];
}

export interface PromotionEligibility {
	minSubtotal?: number | null;
	firstPurchaseOnly?: boolean;
	requireVerifiedEmail?: boolean;
}

export interface PromotionDoc {
	_id?: string;
	name: string;
	label?: string | null;
	description?: string | null;
	status: PromotionStatus;
	kind: PromotionKind;
	scope: PromotionScope;
	benefitType: PromotionBenefitType;
	benefitValue: number;
	currency?: string | null;
	stackingMode?: PromotionStackingMode;
	targets?: PromotionTargets;
	eligibility?: PromotionEligibility;
	schedule?: { startsAt?: Date | null; endsAt?: Date | null };
	priority?: number;
	usageLimits?: { global?: number | null; perCustomer?: number | null };
	notifyFavorites?: boolean;
	createdAt: Date;
	updatedAt: Date;
	version: number;
}

export interface PromotionCodeDoc {
	_id?: string;
	promotionId: string;
	code: string;
	codeNormalized: string;
	status: "active" | "paused" | "archived";
	globalLimit?: number | null;
	perCustomerLimit?: number | null;
	startsAt?: Date | null;
	endsAt?: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface ResolvedCartPricingLine {
	item: CartItem;
	productSlug: string;
	categorySlug?: string | null;
	baseUnitAmount: number;
	effectiveUnitAmount: number;
	currency: string;
}

export interface CartPricingResult {
	items: CartItem[];
	currency: string;
	subtotal: number;
	discountTotal: number;
	total: number;
	couponCode: string | null;
	couponError: string | null;
	appliedPromotions: AppliedPromotion[];
}

type FastApiPromotion = {
	id: string;
	name: string;
	label?: string | null;
	description?: string | null;
	status: PromotionStatus;
	kind: PromotionKind;
	scope: PromotionScope;
	benefit_type: PromotionBenefitType;
	benefit_value: number;
	currency?: string | null;
	stacking_mode?: PromotionStackingMode | null;
	targets?: PromotionTargets | null;
	eligibility?: PromotionEligibility | null;
	schedule?: { startsAt?: string | null; endsAt?: string | null } | null;
	usage_limits?: { global?: number | null; perCustomer?: number | null } | null;
	priority?: number;
	notify_favorites?: boolean;
	version: number;
	created_at: string;
	updated_at: string;
	codes?: Array<{
		id: string;
		code: string;
		status: "active" | "paused" | "archived";
		globalLimit?: number | null;
		perCustomerLimit?: number | null;
		startsAt?: string | null;
		endsAt?: string | null;
	}>;
};

function mapPromotion(value: FastApiPromotion): PromotionDoc {
	return {
		_id: value.id,
		name: value.name,
		label: value.label ?? null,
		description: value.description ?? null,
		status: value.status,
		kind: value.kind,
		scope: value.scope,
		benefitType: value.benefit_type,
		benefitValue: Number(value.benefit_value),
		currency: value.currency ?? null,
		stackingMode: value.stacking_mode ?? undefined,
		targets: value.targets ?? undefined,
		eligibility: value.eligibility ?? undefined,
		schedule: value.schedule
			? {
					startsAt: value.schedule.startsAt ? new Date(value.schedule.startsAt) : null,
					endsAt: value.schedule.endsAt ? new Date(value.schedule.endsAt) : null,
				}
			: undefined,
		usageLimits: value.usage_limits ?? undefined,
		priority: value.priority ?? 0,
		notifyFavorites: value.notify_favorites ?? true,
		createdAt: new Date(value.created_at),
		updatedAt: new Date(value.updated_at),
		version: value.version,
	};
}

async function promotionRequest(path: string, init?: RequestInit) {
	const response = await fetch(`${env.FASTAPI_API_URL}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			"X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY,
			...(init?.headers ?? {}),
		},
		cache: "no-store",
	});
	const payload = (await response.json().catch(() => null)) as FastApiPromotion | { detail?: string } | null;
	if (!response.ok || !payload) {
		const detail =
			payload && "detail" in payload && typeof payload.detail === "string" ? payload.detail : null;
		throw new Error(detail ?? "FastAPI promotions unavailable");
	}
	return payload;
}

export function normalizeCouponCode(code: string | null | undefined) {
	return String(code ?? "")
		.trim()
		.toUpperCase();
}

export async function listActiveAutomaticPromotions() {
	try {
		const payload = (await promotionRequest("/promotions/active")) as FastApiPromotion[];
		return payload.map(mapPromotion);
	} catch (error) {
		console.warn(`[promotions] Falling back to base pricing: ${String((error as Error)?.message ?? error)}`);
		return [];
	}
}

export async function resolveCouponByCode(code: string, _now = new Date()) {
	const normalized = normalizeCouponCode(code);
	if (!normalized) return null;
	const value = (await promotionRequest(
		`/promotions/coupon/${encodeURIComponent(normalized)}`,
	)) as FastApiPromotion | null;
	if (!value) return null;
	const promotion = mapPromotion(value);
	const source = value.codes?.[0];
	if (!source) return null;
	return {
		promotion,
		code: {
			_id: source.id,
			promotionId: value.id,
			code: source.code,
			codeNormalized: source.code.toUpperCase(),
			status: source.status,
			globalLimit: source.globalLimit ?? null,
			perCustomerLimit: source.perCustomerLimit ?? null,
			startsAt: source.startsAt ? new Date(source.startsAt) : null,
			endsAt: source.endsAt ? new Date(source.endsAt) : null,
			createdAt: new Date(value.created_at),
			updatedAt: new Date(value.updated_at),
		} satisfies PromotionCodeDoc,
	};
}

function buildAppliedPromotion(
	promotion: PromotionDoc,
	currency: string,
	discountAmount: number,
): AppliedPromotion {
	return {
		promotionId: promotion._id ?? null,
		label: promotion.label?.trim() || promotion.name.trim(),
		kind: promotion.kind,
		discountAmount,
		currency,
	};
}

function matchesTargets(
	promotion: PromotionDoc,
	productSlug: string,
	variantId: string,
	categorySlug?: string | null,
) {
	const targets = promotion.targets;
	if (!targets) return true;
	if (targets.excludeProductSlugs?.map(slugify).includes(productSlug)) return false;
	if (targets.excludeCategorySlugs?.map(slugify).includes(categorySlug ?? "")) return false;
	if (targets.excludeVariantIds?.includes(variantId)) return false;
	const includes = [
		...(targets.productSlugs ?? []).map(slugify),
		...(targets.categorySlugs ?? []).map(slugify),
		...(targets.variantIds ?? []),
	];
	return (
		includes.length === 0 ||
		includes.includes(productSlug) ||
		includes.includes(categorySlug ?? "") ||
		includes.includes(variantId)
	);
}

function discountAmount(promotion: PromotionDoc, amount: number) {
	if (promotion.benefitType === "percentage_off")
		return Math.min(amount, Math.round((amount * promotion.benefitValue) / 100));
	if (promotion.benefitType === "fixed_price")
		return Math.max(0, amount - Math.round(promotion.benefitValue));
	return Math.min(amount, Math.round(promotion.benefitValue));
}

export function applyAutomaticPromotionsToProduct(product: Product, promotions: PromotionDoc[]): YnsProduct {
	const next = {
		...(product as YnsProduct),
		variants: [...(product.variants ?? [])],
		images: [...product.images],
	};
	next.variants = next.variants?.map((variant) => {
		const basePrice = variant.pricing?.basePrice ?? variant.price;
		const candidate = promotions
			.filter((promotion) =>
				matchesTargets(
					promotion,
					slugify(product.slug),
					variant.id,
					product.category?.slug ? slugify(product.category.slug) : null,
				),
			)
			.map((promotion) => ({ promotion, discount: discountAmount(promotion, basePrice) }))
			.sort(
				(left, right) =>
					right.discount - left.discount || (right.promotion.priority ?? 0) - (left.promotion.priority ?? 0),
			)[0];
		if (!candidate || candidate.discount <= 0) {
			return {
				...variant,
				pricing: { basePrice, effectivePrice: basePrice, discountAmount: 0, compareAtPrice: null },
				appliedPromotions: [],
			};
		}
		const applied = buildAppliedPromotion(candidate.promotion, variant.currency, candidate.discount);
		return {
			...variant,
			price: basePrice - candidate.discount,
			pricing: {
				basePrice,
				effectivePrice: basePrice - candidate.discount,
				discountAmount: candidate.discount,
				compareAtPrice: basePrice,
				promotionLabel: applied.label,
				promotionId: applied.promotionId,
			},
			appliedPromotions: [applied],
		};
	});
	const primary = next.variants?.[0];
	if (primary) {
		next.price = primary.price;
		next.currency = primary.currency;
		next.pricing = primary.pricing;
		next.appliedPromotions = primary.appliedPromotions;
	}
	return next;
}

export async function applyAutomaticPromotionsToProducts<T extends Product>(products: T[]) {
	const promotions = await listActiveAutomaticPromotions();
	return products.map((product) => applyAutomaticPromotionsToProduct(product, promotions) as T);
}

export async function priceCartLines(args: {
	lines: ResolvedCartPricingLine[];
	couponCode?: string | null;
	userId?: string | null;
	strictCoupon?: boolean;
}): Promise<CartPricingResult> {
	const payload = (await promotionRequest("/promotions/price-cart", {
		method: "POST",
		body: JSON.stringify({
			lines: args.lines.map((line) => ({
				product_slug: line.productSlug,
				category_slug: line.categorySlug ?? null,
				variant_id: line.item.variantId,
				quantity: line.item.quantity,
				unit_amount: Math.round(line.baseUnitAmount),
				currency: line.currency,
			})),
			coupon_code: args.couponCode ?? null,
			user_id: args.userId ?? null,
			strict_coupon: args.strictCoupon ?? false,
		}),
	})) as {
		items: Array<{
			base_unit_amount: number;
			effective_unit_amount: number;
			line_base_total: number;
			line_discount_total: number;
			line_final_total: number;
			applied_promotions: AppliedPromotion[];
		}>;
		currency: string;
		subtotal: number;
		discount_total: number;
		total: number;
		coupon_code: string | null;
		coupon_error: string | null;
		applied_promotions: AppliedPromotion[];
	};
	if (payload.coupon_error && args.strictCoupon) throw new Error(payload.coupon_error);
	const items = args.lines.map((line, index) => {
		const priced = payload.items[index];
		if (!priced) throw new Error("Resposta de precificação incompleta do FastAPI");
		return {
			...line.item,
			price: priced.effective_unit_amount,
			basePrice: priced.base_unit_amount,
			finalPrice: priced.effective_unit_amount,
			lineBaseTotal: priced.line_base_total,
			lineDiscountTotal: priced.line_discount_total,
			lineFinalTotal: priced.line_final_total,
			appliedPromotions: priced.applied_promotions,
		};
	});
	return {
		items,
		currency: payload.currency,
		subtotal: payload.subtotal,
		discountTotal: payload.discount_total,
		total: payload.total,
		couponCode: payload.coupon_code,
		couponError: payload.coupon_error,
		appliedPromotions: payload.applied_promotions,
	};
}

export function formatPromotionTargets(targets?: PromotionTargets | null) {
	if (!targets) return "Toda a loja";
	const parts: string[] = [];
	if (targets.productSlugs?.length) parts.push(`Produtos: ${targets.productSlugs.join(", ")}`);
	if (targets.categorySlugs?.length) parts.push(`Categorias: ${targets.categorySlugs.join(", ")}`);
	if (targets.variantIds?.length) parts.push(`Variantes: ${targets.variantIds.join(", ")}`);
	return parts.length ? parts.join(" | ") : "Toda a loja";
}

export async function listPromotionsForAdmin() {
	const payload = (await promotionRequest("/promotions/internal/admin")) as FastApiPromotion[];
	return payload.map((promotion) => ({
		...mapPromotion(promotion),
		codes: (promotion.codes ?? []).map((code) => ({
			_id: code.id,
			promotionId: promotion.id,
			code: code.code,
			codeNormalized: code.code.toUpperCase(),
			status: code.status,
			globalLimit: code.globalLimit ?? null,
			perCustomerLimit: code.perCustomerLimit ?? null,
			startsAt: code.startsAt ? new Date(code.startsAt) : null,
			endsAt: code.endsAt ? new Date(code.endsAt) : null,
			createdAt: new Date(promotion.created_at),
			updatedAt: new Date(promotion.updated_at),
		})),
		pendingNotifications: 0,
	}));
}

type PromotionWriteArgs = {
	name: string;
	label?: string | null;
	description?: string | null;
	kind: PromotionKind;
	scope: PromotionScope;
	benefitType: PromotionBenefitType;
	benefitValue: number;
	currency?: string | null;
	status: PromotionStatus;
	productSlugs?: string[];
	categorySlugs?: string[];
	variantIds?: string[];
	code?: string | null;
	minSubtotal?: number | null;
	firstPurchaseOnly?: boolean;
	requireVerifiedEmail?: boolean;
	priority?: number | null;
	startsAt?: Date | null;
	endsAt?: Date | null;
	couponStartsAt?: Date | null;
	couponEndsAt?: Date | null;
	couponGlobalLimit?: number | null;
	couponPerCustomerLimit?: number | null;
	stackingMode?: PromotionStackingMode | null;
	notifyFavorites?: boolean;
	userId?: string | null;
	promotionId?: string;
};

function promotionWritePayload(args: PromotionWriteArgs) {
	return {
		name: args.name,
		label: args.label ?? null,
		description: args.description ?? null,
		kind: args.kind,
		scope: args.scope,
		benefit_type: args.benefitType,
		benefit_value: args.benefitValue,
		currency: args.currency ?? null,
		status: args.status,
		product_slugs: (args.productSlugs ?? []).map(slugify),
		category_slugs: (args.categorySlugs ?? []).map(slugify),
		variant_ids: args.variantIds ?? [],
		code: args.code ?? null,
		min_subtotal: args.minSubtotal ?? null,
		first_purchase_only: args.firstPurchaseOnly ?? false,
		require_verified_email: args.requireVerifiedEmail ?? false,
		priority: args.priority ?? 0,
		starts_at: args.startsAt?.toISOString() ?? null,
		ends_at: args.endsAt?.toISOString() ?? null,
		coupon_starts_at: args.couponStartsAt?.toISOString() ?? null,
		coupon_ends_at: args.couponEndsAt?.toISOString() ?? null,
		coupon_global_limit: args.couponGlobalLimit ?? null,
		coupon_per_customer_limit: args.couponPerCustomerLimit ?? null,
		stacking_mode: args.stackingMode ?? null,
		notify_favorites: args.notifyFavorites ?? true,
	};
}

async function mutatePromotion(path: string, method: string, args: PromotionWriteArgs) {
	const payload = (await promotionRequest(path, {
		method,
		body: JSON.stringify(promotionWritePayload(args)),
	})) as FastApiPromotion;
	return { promotion: mapPromotion(payload), code: null };
}

export async function createPromotionRecord(args: PromotionWriteArgs) {
	return mutatePromotion("/promotions/internal/admin", "POST", args);
}

export async function updatePromotionRecord(args: PromotionWriteArgs & { promotionId: string }) {
	return mutatePromotion(`/promotions/internal/admin/${encodeURIComponent(args.promotionId)}`, "PUT", args);
}

export async function updatePromotionStatus(args: {
	promotionId: string;
	status: PromotionStatus;
	userId?: string | null;
}) {
	const payload = (await promotionRequest(
		`/promotions/internal/admin/${encodeURIComponent(args.promotionId)}/status`,
		{ method: "PATCH", body: JSON.stringify({ status: args.status }) },
	)) as FastApiPromotion;
	return mapPromotion(payload);
}

export async function recordPromotionRedemption(args: {
	promotionId: string;
	promotionCodeId: string;
	userId: string;
	purchaseId: string;
	orderDraftId?: string | null;
}) {
	await promotionRequest("/promotions/redemptions", {
		method: "POST",
		body: JSON.stringify({
			promotion_id: args.promotionId,
			promotion_code_id: args.promotionCodeId,
			user_id: args.userId,
			purchase_id: args.purchaseId,
			order_draft_id: args.orderDraftId ?? null,
		}),
	});
}
