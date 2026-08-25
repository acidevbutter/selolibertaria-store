import "server-only";

import { ObjectId } from "mongodb";
import { env } from "@/env.mjs";
import type { AppliedPromotion, CartItem, Product, ProductVariant, YnsProduct } from "@/lib/commerce-types";
import { ensureIndexes, getDb } from "@/lib/mongodb";
import { slugify } from "@/lib/utils";

export type PromotionStatus = "draft" | "scheduled" | "active" | "paused" | "expired" | "archived";
export type PromotionKind = "automatic" | "coupon";
export type PromotionScope = "item" | "order";
export type PromotionBenefitType = "percentage_off" | "fixed_amount_off" | "fixed_price";
export type PromotionStackingMode = "exclusive" | "combine_with_automatic" | "combine_with_coupon";

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
	_id?: ObjectId | string;
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
	schedule?: {
		startsAt?: Date | null;
		endsAt?: Date | null;
	};
	priority?: number;
	maxDiscountAmount?: number | null;
	usageLimits?: {
		global?: number | null;
		perCustomer?: number | null;
	};
	notifyFavorites?: boolean;
	createdBy?: string | null;
	updatedBy?: string | null;
	createdAt: Date;
	updatedAt: Date;
	version: number;
}

export interface PromotionCodeDoc {
	_id?: ObjectId | string;
	promotionId: ObjectId | string;
	code: string;
	codeNormalized: string;
	status: "active" | "paused" | "archived";
	singleUse?: boolean;
	startsAt?: Date | null;
	endsAt?: Date | null;
	globalLimit?: number | null;
	perCustomerLimit?: number | null;
	currentRedemptions?: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface PromotionRedemptionDoc {
	_id?: ObjectId;
	promotionId: ObjectId | string;
	promotionCodeId: ObjectId | string;
	userId: string;
	orderDraftId?: string | null;
	purchaseId: string;
	status: "consumed";
	consumedAt: Date;
	createdAt: Date;
}

export interface PromotionNotificationDoc {
	_id?: ObjectId;
	promotionId: ObjectId;
	userId: string;
	productSlug: string;
	variantId?: string | null;
	currency?: string | null;
	basePrice: number;
	effectivePrice: number;
	status: "pending" | "sent" | "skipped" | "failed";
	communicationId?: string | null;
	reason?: string | null;
	productName: string;
	productUrl: string;
	productImage?: string | null;
	variantLabel?: string | null;
	createdAt: Date;
	sentAt?: Date | null;
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

interface CouponResolution {
	promotion: PromotionDoc;
	code: PromotionCodeDoc;
}

interface PromotionTargetContext {
	productSlug: string;
	variantId: string;
	categorySlug?: string | null;
}

interface PromotionCustomerContext {
	userId?: string | null;
	purchaseCount?: number;
	verifiedEmail?: boolean;
}

const defaultAutomaticPromotionList: PromotionDoc[] = [];
let didWarnAboutPromotionFallback = false;

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
	}>;
};

function mapFastApiPromotion(value: FastApiPromotion): PromotionDoc {
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
		usageLimits: value.usage_limits
			? { global: value.usage_limits.global ?? null, perCustomer: value.usage_limits.perCustomer ?? null }
			: undefined,
		priority: value.priority ?? 0,
		notifyFavorites: value.notify_favorites ?? true,
		createdAt: new Date(value.created_at),
		updatedAt: new Date(value.updated_at),
		version: value.version,
	};
}

async function fetchPromotionApi(path: string) {
	const response = await fetch(`${env.FASTAPI_API_URL}${path}`, {
		headers: { "X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY },
		cache: "no-store",
	});
	if (!response.ok) throw new Error("FastAPI promotions unavailable");
	return response;
}

function normalizeArray(values?: string[] | null) {
	return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

function normalizeSlugArray(values?: string[] | null) {
	return normalizeArray(values).map((value) => slugify(value));
}

export function normalizeCouponCode(code: string | null | undefined) {
	return String(code ?? "")
		.trim()
		.toUpperCase();
}

function promotionLabel(promotion: PromotionDoc) {
	return promotion.label?.trim() || promotion.name.trim();
}

function isWithinRange(now: Date, startsAt?: Date | null, endsAt?: Date | null) {
	if (startsAt && startsAt.getTime() > now.getTime()) return false;
	if (endsAt && endsAt.getTime() < now.getTime()) return false;
	return true;
}

export function isPromotionActive(promotion: PromotionDoc, now = new Date()) {
	if (promotion.status === "paused" || promotion.status === "archived" || promotion.status === "draft")
		return false;
	if (promotion.status === "expired") return false;
	return isWithinRange(now, promotion.schedule?.startsAt ?? null, promotion.schedule?.endsAt ?? null);
}

function hasExplicitTargets(targets?: PromotionTargets | null) {
	if (!targets) return false;
	return [
		targets.productSlugs,
		targets.variantIds,
		targets.categorySlugs,
		targets.excludeProductSlugs,
		targets.excludeVariantIds,
		targets.excludeCategorySlugs,
	].some((values) => Array.isArray(values) && values.length > 0);
}

function matchesPromotionTargets(promotion: PromotionDoc, context: PromotionTargetContext) {
	const targets = promotion.targets;
	if (!targets || !hasExplicitTargets(targets)) return true;

	const productSlugs = new Set(normalizeSlugArray(targets.productSlugs));
	const categorySlugs = new Set(normalizeSlugArray(targets.categorySlugs));
	const variantIds = new Set(normalizeArray(targets.variantIds));
	const excludeProductSlugs = new Set(normalizeSlugArray(targets.excludeProductSlugs));
	const excludeCategorySlugs = new Set(normalizeSlugArray(targets.excludeCategorySlugs));
	const excludeVariantIds = new Set(normalizeArray(targets.excludeVariantIds));

	if (excludeProductSlugs.has(context.productSlug)) return false;
	if (context.categorySlug && excludeCategorySlugs.has(context.categorySlug)) return false;
	if (excludeVariantIds.has(context.variantId)) return false;

	const hasInclusiveTargets = productSlugs.size > 0 || categorySlugs.size > 0 || variantIds.size > 0;
	if (!hasInclusiveTargets) return true;

	if (productSlugs.has(context.productSlug)) return true;
	if (context.categorySlug && categorySlugs.has(context.categorySlug)) return true;
	if (variantIds.has(context.variantId)) return true;
	return false;
}

function passesEligibility(
	promotion: PromotionDoc,
	args: {
		subtotal: number;
		customer: PromotionCustomerContext;
	},
) {
	const eligibility = promotion.eligibility;
	if (!eligibility) return true;
	if (typeof eligibility.minSubtotal === "number" && args.subtotal < eligibility.minSubtotal) return false;
	if (eligibility.firstPurchaseOnly && (args.customer.purchaseCount ?? 0) > 0) return false;
	if (eligibility.requireVerifiedEmail && args.customer.verifiedEmail === false) return false;
	return true;
}

function calculateDiscountAmount({ baseAmount, promotion }: { baseAmount: number; promotion: PromotionDoc }) {
	if (baseAmount <= 0) return 0;

	let discount = 0;

	switch (promotion.benefitType) {
		case "percentage_off": {
			discount = Math.round((baseAmount * promotion.benefitValue) / 100);
			break;
		}
		case "fixed_amount_off": {
			discount = Math.round(promotion.benefitValue);
			break;
		}
		case "fixed_price": {
			discount = baseAmount - Math.round(promotion.benefitValue);
			break;
		}
	}

	if (typeof promotion.maxDiscountAmount === "number" && promotion.maxDiscountAmount > 0) {
		discount = Math.min(discount, Math.round(promotion.maxDiscountAmount));
	}

	return Math.max(0, Math.min(baseAmount, discount));
}

function buildAppliedPromotion(
	promotion: PromotionDoc,
	currency: string,
	discountAmount: number,
): AppliedPromotion {
	return {
		promotionId: promotion._id?.toString() ?? null,
		label: promotionLabel(promotion),
		kind: promotion.kind,
		discountAmount,
		currency,
	};
}

function pickBestAutomaticPromotion(args: {
	promotions: PromotionDoc[];
	context: PromotionTargetContext;
	baseAmount: number;
	currency: string;
	subtotal: number;
	customer: PromotionCustomerContext;
}) {
	const applicable = args.promotions
		.filter((promotion) => matchesPromotionTargets(promotion, args.context))
		.filter((promotion) => passesEligibility(promotion, { subtotal: args.subtotal, customer: args.customer }))
		.map((promotion) => {
			const discountAmount = calculateDiscountAmount({
				baseAmount: args.baseAmount,
				promotion,
			});
			return {
				promotion,
				discountAmount,
				effectiveAmount: args.baseAmount - discountAmount,
			};
		})
		.filter((candidate) => candidate.discountAmount > 0)
		.sort((a, b) => {
			if (a.effectiveAmount !== b.effectiveAmount) return a.effectiveAmount - b.effectiveAmount;
			return (b.promotion.priority ?? 0) - (a.promotion.priority ?? 0);
		});

	return applicable[0] ?? null;
}

async function getPromotionCustomerContext(userId?: string | null): Promise<PromotionCustomerContext> {
	if (!userId) return {};
	try {
		const db = await getDb();
		const user = await db
			.collection("users")
			.findOne<{ purchases?: unknown[]; verified?: boolean }>(
				{ _id: new ObjectId(userId) },
				{ projection: { purchases: 1, verified: 1 } },
			);
		return {
			userId,
			purchaseCount: Array.isArray(user?.purchases) ? user.purchases.length : 0,
			verifiedEmail: user?.verified,
		};
	} catch {
		return { userId };
	}
}

export async function listActiveAutomaticPromotions(now = new Date()) {
	try {
		void now;
		const response = await fetchPromotionApi("/promotions/active");
		const payload = (await response.json()) as FastApiPromotion[];
		return payload.map(mapFastApiPromotion);
	} catch (error) {
		if (!didWarnAboutPromotionFallback) {
			didWarnAboutPromotionFallback = true;
			console.warn(
				`[promotions] Falling back to base pricing: ${String((error as Error)?.message ?? error)}`,
			);
		}
		return defaultAutomaticPromotionList;
	}
}

function cloneVariantWithAutomaticPromotion(
	product: Product,
	variant: ProductVariant,
	promotions: PromotionDoc[],
	customer: PromotionCustomerContext,
) {
	const basePrice = variant.pricing?.basePrice ?? variant.price;
	const categorySlug = product.category?.slug ? slugify(product.category.slug) : null;
	const productSlug = slugify(product.slug);
	const bestPromotion = pickBestAutomaticPromotion({
		promotions,
		context: {
			productSlug,
			variantId: variant.id,
			categorySlug,
		},
		baseAmount: basePrice,
		currency: variant.currency,
		subtotal: basePrice,
		customer,
	});

	const nextVariant: ProductVariant = { ...variant };

	if (!bestPromotion) {
		nextVariant.pricing = {
			basePrice,
			effectivePrice: basePrice,
			discountAmount: 0,
			compareAtPrice: null,
		};
		nextVariant.appliedPromotions = [];
		return nextVariant;
	}

	const appliedPromotion = buildAppliedPromotion(
		bestPromotion.promotion,
		variant.currency,
		bestPromotion.discountAmount,
	);
	nextVariant.price = bestPromotion.effectiveAmount;
	nextVariant.pricing = {
		basePrice,
		effectivePrice: bestPromotion.effectiveAmount,
		discountAmount: bestPromotion.discountAmount,
		compareAtPrice: basePrice,
		promotionLabel: appliedPromotion.label,
		promotionId: appliedPromotion.promotionId,
	};
	nextVariant.appliedPromotions = [appliedPromotion];
	return nextVariant;
}

export function applyAutomaticPromotionsToProduct(
	product: Product,
	promotions: PromotionDoc[],
	customer: PromotionCustomerContext = {},
): YnsProduct {
	const nextProduct: YnsProduct = {
		...(product as YnsProduct),
		variants: [...((product as YnsProduct).variants ?? [])],
		images: [...product.images],
	};

	if (!nextProduct.variants || nextProduct.variants.length === 0) {
		return nextProduct;
	}

	nextProduct.variants = nextProduct.variants.map((variant) =>
		cloneVariantWithAutomaticPromotion(nextProduct, variant, promotions, customer),
	);

	const primary = nextProduct.variants[0];
	if (primary) {
		nextProduct.price = primary.price;
		nextProduct.currency = primary.currency;
		nextProduct.pricing = primary.pricing;
		nextProduct.appliedPromotions = primary.appliedPromotions;
	}

	return nextProduct;
}

export async function applyAutomaticPromotionsToProducts<T extends Product>(
	products: T[],
	args?: { userId?: string | null },
): Promise<T[]> {
	if (products.length === 0) return products;
	const [promotions, customer] = await Promise.all([
		listActiveAutomaticPromotions(),
		getPromotionCustomerContext(args?.userId),
	]);
	if (promotions.length === 0) {
		return products.map((product) => {
			const next = { ...product } as T;
			if (product.variants) {
				next.variants = product.variants.map((variant) => ({
					...variant,
					pricing: {
						basePrice: variant.pricing?.basePrice ?? variant.price,
						effectivePrice: variant.price,
						discountAmount: 0,
						compareAtPrice: null,
					},
					appliedPromotions: [],
				}));
			}
			next.pricing =
				next.variants?.[0]?.pricing ??
				(product.pricing || {
					basePrice: product.price,
					effectivePrice: product.price,
					discountAmount: 0,
					compareAtPrice: null,
				});
			next.appliedPromotions = next.variants?.[0]?.appliedPromotions ?? [];
			return next;
		});
	}
	return products.map((product) => applyAutomaticPromotionsToProduct(product, promotions, customer) as T);
}

export async function resolveCouponByCode(code: string, now = new Date()): Promise<CouponResolution | null> {
	const normalizedCode = normalizeCouponCode(code);
	if (!normalizedCode) return null;
	void now;
	const response = await fetchPromotionApi(`/promotions/coupon/${encodeURIComponent(normalizedCode)}`);
	const value = (await response.json()) as FastApiPromotion | null;
	if (!value) return null;
	const codeValue = value.codes?.[0];
	if (!codeValue) return null;
	return {
		promotion: mapFastApiPromotion(value),
		code: {
			_id: codeValue.id,
			promotionId: value.id,
			code: codeValue.code,
			codeNormalized: codeValue.code.toUpperCase(),
			status: codeValue.status,
			globalLimit: codeValue.globalLimit ?? null,
			perCustomerLimit: codeValue.perCustomerLimit ?? null,
			createdAt: new Date(value.created_at),
			updatedAt: new Date(value.updated_at),
		},
	};
}

async function validateCouponLimits(args: {
	code: PromotionCodeDoc;
	promotion: PromotionDoc;
	userId?: string | null;
}) {
	const db = await getDb();
	const redemptions = db.collection<PromotionRedemptionDoc>("promotionRedemptions");
	const consumedCount = await redemptions.countDocuments({
		promotionCodeId: args.code._id,
		status: "consumed",
	});
	const perCustomerCount = args.userId
		? await redemptions.countDocuments({
				promotionCodeId: args.code._id,
				userId: args.userId,
				status: "consumed",
			})
		: 0;

	const globalLimit = args.code.globalLimit ?? args.promotion.usageLimits?.global ?? null;
	const perCustomerLimit =
		args.code.perCustomerLimit ?? args.promotion.usageLimits?.perCustomer ?? (args.code.singleUse ? 1 : null);

	if (typeof globalLimit === "number" && consumedCount >= globalLimit) {
		return { ok: false as const, error: "This coupon has already reached its total usage limit." };
	}
	if (typeof perCustomerLimit === "number" && perCustomerCount >= perCustomerLimit) {
		return { ok: false as const, error: "You have already used this coupon the maximum number of times." };
	}
	return { ok: true as const };
}

function buildCouponAppliedPromotion(
	promotion: PromotionDoc,
	code: PromotionCodeDoc,
	currency: string,
	discountAmount: number,
): AppliedPromotion {
	return {
		...buildAppliedPromotion(promotion, currency, discountAmount),
		code: code.code,
	};
}

function allocateOrderDiscount(lineTotals: number[], totalDiscount: number) {
	if (lineTotals.length === 0 || totalDiscount <= 0) return lineTotals.map(() => 0);
	const subtotal = lineTotals.reduce((sum, amount) => sum + amount, 0);
	if (subtotal <= 0) return lineTotals.map(() => 0);

	let remainingDiscount = totalDiscount;
	let remainingSubtotal = subtotal;

	return lineTotals.map((lineTotal, index) => {
		if (index === lineTotals.length - 1) {
			return Math.max(0, Math.min(lineTotal, remainingDiscount));
		}
		const nextDiscount = Math.max(
			0,
			Math.min(lineTotal, Math.round((remainingDiscount * lineTotal) / Math.max(1, remainingSubtotal))),
		);
		remainingDiscount -= nextDiscount;
		remainingSubtotal -= lineTotal;
		return nextDiscount;
	});
}

export async function priceCartLines(args: {
	lines: ResolvedCartPricingLine[];
	couponCode?: string | null;
	userId?: string | null;
	strictCoupon?: boolean;
}): Promise<CartPricingResult> {
	const response = await fetch(`${env.FASTAPI_API_URL}/promotions/price-cart`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY,
		},
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
		cache: "no-store",
	});
	const payload = (await response.json().catch(() => null)) as {
		items?: Array<{
			index: number;
			base_unit_amount: number;
			effective_unit_amount: number;
			line_base_total: number;
			line_discount_total: number;
			line_final_total: number;
			applied_promotions: AppliedPromotion[];
		}>;
		subtotal?: number;
		discount_total?: number;
		total?: number;
		currency?: string;
		coupon_code?: string | null;
		coupon_error?: string | null;
		applied_promotions?: AppliedPromotion[];
	} | null;
	if (!response.ok || !payload) {
		throw new Error("Não foi possível calcular os descontos no FastAPI");
	}
	if (payload.coupon_error && args.strictCoupon) throw new Error(payload.coupon_error);
	const remoteItems = payload.items ?? [];
	const items = args.lines.map((line, index) => {
		const priced = remoteItems[index];
		const basePrice = priced?.base_unit_amount ?? line.baseUnitAmount;
		const finalPrice = priced?.effective_unit_amount ?? line.effectiveUnitAmount;
		return {
			...line.item,
			price: finalPrice,
			basePrice,
			finalPrice,
			lineBaseTotal: priced?.line_base_total ?? basePrice * line.item.quantity,
			lineDiscountTotal: priced?.line_discount_total ?? 0,
			lineFinalTotal: priced?.line_final_total ?? finalPrice * line.item.quantity,
			appliedPromotions: priced?.applied_promotions ?? [],
		};
	});
	return {
		items,
		currency: payload.currency ?? args.lines[0]?.currency ?? "BRL",
		subtotal: payload.subtotal ?? items.reduce((sum, item) => sum + (item.lineBaseTotal ?? 0), 0),
		discountTotal:
			payload.discount_total ?? items.reduce((sum, item) => sum + (item.lineDiscountTotal ?? 0), 0),
		total: payload.total ?? items.reduce((sum, item) => sum + (item.lineFinalTotal ?? 0), 0),
		couponCode: payload.coupon_code ?? null,
		couponError: payload.coupon_error ?? null,
		appliedPromotions: payload.applied_promotions ?? items.flatMap((item) => item.appliedPromotions ?? []),
	};
}

async function priceCartLinesLegacy(args: {
	lines: ResolvedCartPricingLine[];
	couponCode?: string | null;
	userId?: string | null;
	strictCoupon?: boolean;
}): Promise<CartPricingResult> {
	const lines = args.lines.map((line) => ({
		...line,
		item: {
			...line.item,
			basePrice: line.baseUnitAmount,
			finalPrice: line.effectiveUnitAmount,
			lineBaseTotal: line.baseUnitAmount * line.item.quantity,
			lineFinalTotal: line.effectiveUnitAmount * line.item.quantity,
			lineDiscountTotal: (line.baseUnitAmount - line.effectiveUnitAmount) * line.item.quantity,
			appliedPromotions: [...(line.item.appliedPromotions ?? [])],
		},
	}));
	const customer = await getPromotionCustomerContext(args.userId);

	const subtotal = lines.reduce((sum, line) => sum + (line.item.lineBaseTotal ?? 0), 0);
	const subtotalAfterAutomatic = lines.reduce((sum, line) => sum + (line.item.lineFinalTotal ?? 0), 0);
	let discountTotal = lines.reduce((sum, line) => sum + (line.item.lineDiscountTotal ?? 0), 0);
	const appliedPromotions = lines.flatMap((line) => line.item.appliedPromotions ?? []);
	let couponCode = normalizeCouponCode(args.couponCode);
	let couponError: string | null = null;

	if (couponCode) {
		const couponResolution = await resolveCouponByCode(couponCode);
		if (!couponResolution) {
			couponError = "Coupon code not found or no longer valid.";
		} else {
			const { promotion, code } = couponResolution;
			const limits = await validateCouponLimits({ code, promotion, userId: args.userId });
			if (!limits.ok) {
				couponError = limits.error;
			} else if (!passesEligibility(promotion, { subtotal: subtotalAfterAutomatic, customer })) {
				couponError = "This coupon does not meet the current cart requirements.";
			} else {
				const eligibleLineIndexes = lines
					.map((line, index) => ({
						index,
						matches:
							matchesPromotionTargets(promotion, {
								productSlug: line.productSlug,
								variantId: line.item.variantId,
								categorySlug: line.categorySlug,
							}) &&
							(promotion.stackingMode !== "exclusive" || (line.item.appliedPromotions?.length ?? 0) === 0),
					}))
					.filter((entry) => entry.matches)
					.map((entry) => entry.index);

				if (eligibleLineIndexes.length === 0) {
					couponError =
						promotion.stackingMode === "exclusive"
							? "This coupon cannot be combined with the automatic discounts already applied."
							: "This coupon does not apply to the items in your cart.";
				} else {
					const eligibleTotals = eligibleLineIndexes.map((index) => lines[index]?.item.lineFinalTotal ?? 0);
					const eligibleSubtotal = eligibleTotals.reduce((sum, amount) => sum + amount, 0);
					let totalCouponDiscount = 0;

					if (promotion.scope === "item") {
						for (const index of eligibleLineIndexes) {
							const line = lines[index];
							if (!line) continue;
							const unitDiscount = calculateDiscountAmount({
								baseAmount: line.effectiveUnitAmount,
								promotion,
							});
							const lineDiscount = unitDiscount * line.item.quantity;
							if (lineDiscount <= 0) continue;
							const appliedPromotion = buildCouponAppliedPromotion(
								promotion,
								code,
								line.currency,
								lineDiscount,
							);
							line.item.finalPrice = Math.max(0, line.effectiveUnitAmount - unitDiscount);
							line.item.price = line.item.finalPrice;
							line.item.lineDiscountTotal = (line.item.lineDiscountTotal ?? 0) + lineDiscount;
							line.item.lineFinalTotal = (line.item.lineFinalTotal ?? 0) - lineDiscount;
							line.item.appliedPromotions = [...(line.item.appliedPromotions ?? []), appliedPromotion];
							totalCouponDiscount += lineDiscount;
							appliedPromotions.push(appliedPromotion);
						}
					} else {
						totalCouponDiscount = calculateDiscountAmount({
							baseAmount: eligibleSubtotal,
							promotion,
						});
						const allocations = allocateOrderDiscount(eligibleTotals, totalCouponDiscount);
						allocations.forEach((allocation, offset) => {
							if (allocation <= 0) return;
							const lineIndex = eligibleLineIndexes[offset];
							const line = lineIndex != null ? lines[lineIndex] : null;
							if (!line) return;
							const lineQuantity = Math.max(1, line.item.quantity);
							line.item.lineDiscountTotal = (line.item.lineDiscountTotal ?? 0) + allocation;
							line.item.lineFinalTotal = (line.item.lineFinalTotal ?? 0) - allocation;
							line.item.finalPrice = Math.max(0, Math.round((line.item.lineFinalTotal ?? 0) / lineQuantity));
							line.item.price = line.item.finalPrice;
							const appliedPromotion = buildCouponAppliedPromotion(
								promotion,
								code,
								line.currency,
								allocation,
							);
							line.item.appliedPromotions = [...(line.item.appliedPromotions ?? []), appliedPromotion];
							appliedPromotions.push(appliedPromotion);
						});
					}

					if (totalCouponDiscount <= 0) {
						couponError = "This coupon does not generate a discount for the current cart.";
					} else {
						discountTotal += totalCouponDiscount;
					}
				}
			}
		}
	}

	if (couponError && args.strictCoupon) {
		throw new Error(couponError);
	}

	const pricedItems = lines.map((line) => ({
		...line.item,
		price: line.item.finalPrice ?? line.item.price,
	}));

	return {
		items: pricedItems,
		currency: lines[0]?.currency ?? "USD",
		subtotal,
		discountTotal,
		total: pricedItems.reduce((sum, item) => sum + (item.lineFinalTotal ?? item.price * item.quantity), 0),
		couponCode: couponError ? null : couponCode || null,
		couponError,
		appliedPromotions,
	};
}

export function formatPromotionTargets(targets?: PromotionTargets | null) {
	if (!targets) return "Toda a loja";
	const parts: string[] = [];
	if (targets.productSlugs?.length) parts.push(`Produtos: ${targets.productSlugs.join(", ")}`);
	if (targets.categorySlugs?.length) parts.push(`Categorias: ${targets.categorySlugs.join(", ")}`);
	if (targets.variantIds?.length) parts.push(`Variantes: ${targets.variantIds.join(", ")}`);
	if (parts.length === 0) return "Toda a loja";
	return parts.join(" | ");
}

export async function listPromotionsForAdmin() {
	await ensureIndexes();
	const db = await getDb();
	const [promotions, codes, pendingNotifications] = await Promise.all([
		db.collection<PromotionDoc>("promotions").find({}).sort({ updatedAt: -1, createdAt: -1 }).toArray(),
		db.collection<PromotionCodeDoc>("promotionCodes").find({}).toArray(),
		db
			.collection<PromotionNotificationDoc>("promotionNotifications")
			.aggregate<{ _id: ObjectId; pending: number }>([
				{ $match: { status: "pending" } },
				{ $group: { _id: "$promotionId", pending: { $sum: 1 } } },
			])
			.toArray(),
	]);

	const pendingMap = new Map(pendingNotifications.map((entry) => [String(entry._id), entry.pending]));
	const codeMap = new Map<string, PromotionCodeDoc[]>();
	for (const code of codes) {
		const key = String(code.promotionId);
		const current = codeMap.get(key) ?? [];
		current.push(code);
		codeMap.set(key, current);
	}

	return promotions.map((promotion) => ({
		...promotion,
		codes: codeMap.get(String(promotion._id)) ?? [],
		pendingNotifications: pendingMap.get(String(promotion._id)) ?? 0,
	}));
}

export async function createPromotionRecord(args: {
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
}) {
	await ensureIndexes();
	const db = await getDb();
	const now = new Date();
	const promotionId = new ObjectId();
	const promotion: PromotionDoc = {
		_id: promotionId,
		name: args.name.trim(),
		label: args.label?.trim() || null,
		description: args.description?.trim() || null,
		kind: args.kind,
		scope: args.scope,
		status: args.status,
		benefitType: args.benefitType,
		benefitValue: Math.round(args.benefitValue),
		currency: args.currency?.trim().toUpperCase() || null,
		stackingMode:
			args.stackingMode ?? (args.kind === "coupon" ? "combine_with_automatic" : "combine_with_coupon"),
		targets: {
			productSlugs: normalizeSlugArray(args.productSlugs),
			categorySlugs: normalizeSlugArray(args.categorySlugs),
			variantIds: normalizeArray(args.variantIds),
		},
		eligibility: {
			...(typeof args.minSubtotal === "number" && args.minSubtotal > 0
				? { minSubtotal: Math.round(args.minSubtotal) }
				: {}),
			...(args.firstPurchaseOnly ? { firstPurchaseOnly: true } : {}),
			...(args.requireVerifiedEmail ? { requireVerifiedEmail: true } : {}),
		},
		schedule: {
			startsAt: args.startsAt ?? null,
			endsAt: args.endsAt ?? null,
		},
		usageLimits:
			args.kind === "coupon" &&
			(typeof args.couponGlobalLimit === "number" || typeof args.couponPerCustomerLimit === "number")
				? {
						...(typeof args.couponGlobalLimit === "number" ? { global: args.couponGlobalLimit } : {}),
						...(typeof args.couponPerCustomerLimit === "number"
							? { perCustomer: args.couponPerCustomerLimit }
							: {}),
					}
				: undefined,
		priority: typeof args.priority === "number" ? args.priority : 0,
		notifyFavorites: args.notifyFavorites ?? true,
		createdBy: args.userId ?? null,
		updatedBy: args.userId ?? null,
		createdAt: now,
		updatedAt: now,
		version: 1,
	};

	await db.collection<PromotionDoc>("promotions").insertOne(promotion);

	let codeRecord: PromotionCodeDoc | null = null;
	if (args.kind === "coupon" && args.code) {
		const code = normalizeCouponCode(args.code);
		if (!code) {
			throw new Error("Coupon code cannot be empty.");
		}
		codeRecord = {
			promotionId,
			code,
			codeNormalized: code,
			status: promotion.status === "archived" ? "archived" : "active",
			createdAt: now,
			updatedAt: now,
			singleUse: args.couponPerCustomerLimit === 1,
			startsAt: args.couponStartsAt ?? args.startsAt ?? null,
			endsAt: args.couponEndsAt ?? args.endsAt ?? null,
			globalLimit: typeof args.couponGlobalLimit === "number" ? args.couponGlobalLimit : null,
			perCustomerLimit: typeof args.couponPerCustomerLimit === "number" ? args.couponPerCustomerLimit : null,
			currentRedemptions: 0,
		};
		await db.collection<PromotionCodeDoc>("promotionCodes").insertOne(codeRecord);
	}

	return { promotion, code: codeRecord };
}

export async function updatePromotionRecord(args: {
	promotionId: string;
	kind: PromotionKind;
	name: string;
	label?: string | null;
	description?: string | null;
	scope: PromotionScope;
	benefitType: PromotionBenefitType;
	benefitValue: number;
	currency?: string | null;
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
}) {
	await ensureIndexes();
	const db = await getDb();
	const now = new Date();
	const promotionObjectId = new ObjectId(args.promotionId);
	const existing = await db.collection<PromotionDoc>("promotions").findOne({ _id: promotionObjectId });
	if (!existing) {
		throw new Error("Promotion not found.");
	}
	if (existing.kind !== args.kind) {
		throw new Error("The promotion type cannot be changed.");
	}

	const nextUsageLimits =
		args.kind === "coupon" &&
		(typeof args.couponGlobalLimit === "number" || typeof args.couponPerCustomerLimit === "number")
			? {
					...(typeof args.couponGlobalLimit === "number" ? { global: args.couponGlobalLimit } : {}),
					...(typeof args.couponPerCustomerLimit === "number"
						? { perCustomer: args.couponPerCustomerLimit }
						: {}),
				}
			: null;

	const updateDocument: {
		$set: Partial<PromotionDoc>;
		$inc: { version: number };
		$unset?: Record<string, "" | 1>;
	} = {
		$set: {
			name: args.name.trim(),
			label: args.label?.trim() || null,
			description: args.description?.trim() || null,
			scope: args.scope,
			benefitType: args.benefitType,
			benefitValue: Math.round(args.benefitValue),
			currency: args.currency?.trim().toUpperCase() || null,
			stackingMode:
				args.stackingMode ?? (existing.kind === "coupon" ? "combine_with_automatic" : "combine_with_coupon"),
			targets: {
				productSlugs: normalizeSlugArray(args.productSlugs),
				categorySlugs: normalizeSlugArray(args.categorySlugs),
				variantIds: normalizeArray(args.variantIds),
			},
			eligibility: {
				...(typeof args.minSubtotal === "number" && args.minSubtotal > 0
					? { minSubtotal: Math.round(args.minSubtotal) }
					: {}),
				...(args.firstPurchaseOnly ? { firstPurchaseOnly: true } : {}),
				...(args.requireVerifiedEmail ? { requireVerifiedEmail: true } : {}),
			},
			schedule: {
				startsAt: args.startsAt ?? null,
				endsAt: args.endsAt ?? null,
			},
			priority: typeof args.priority === "number" ? args.priority : 0,
			notifyFavorites: args.notifyFavorites ?? true,
			updatedAt: now,
			updatedBy: args.userId ?? null,
		},
		$inc: { version: 1 },
	};

	if (nextUsageLimits) {
		updateDocument.$set.usageLimits = nextUsageLimits;
	} else {
		updateDocument.$unset = { usageLimits: "" };
	}

	await db.collection<PromotionDoc>("promotions").updateOne({ _id: promotionObjectId }, updateDocument);

	let codeRecord: PromotionCodeDoc | null = null;
	if (existing.kind === "coupon") {
		const code = normalizeCouponCode(args.code);
		if (!code) {
			throw new Error("Coupons require a code.");
		}

		const existingCode = await db
			.collection<PromotionCodeDoc>("promotionCodes")
			.findOne({ promotionId: promotionObjectId }, { sort: { createdAt: 1 } });
		const nextCodeStatus: PromotionCodeDoc["status"] =
			existing.status === "archived" ? "archived" : existing.status === "paused" ? "paused" : "active";
		const nextCodeDocument: Pick<
			PromotionCodeDoc,
			| "code"
			| "codeNormalized"
			| "status"
			| "singleUse"
			| "startsAt"
			| "endsAt"
			| "globalLimit"
			| "perCustomerLimit"
			| "updatedAt"
		> = {
			code,
			codeNormalized: code,
			status: nextCodeStatus,
			singleUse: args.couponPerCustomerLimit === 1,
			startsAt: args.couponStartsAt ?? args.startsAt ?? null,
			endsAt: args.couponEndsAt ?? args.endsAt ?? null,
			globalLimit: typeof args.couponGlobalLimit === "number" ? args.couponGlobalLimit : null,
			perCustomerLimit: typeof args.couponPerCustomerLimit === "number" ? args.couponPerCustomerLimit : null,
			updatedAt: now,
		};

		try {
			if (existingCode?._id) {
				await db.collection<PromotionCodeDoc>("promotionCodes").updateOne(
					{ _id: existingCode._id },
					{
						$set: nextCodeDocument,
					},
				);
				codeRecord = { ...existingCode, ...nextCodeDocument };
			} else {
				const newCodeRecord: PromotionCodeDoc = {
					promotionId: promotionObjectId,
					code,
					codeNormalized: code,
					status: nextCodeStatus,
					singleUse: nextCodeDocument.singleUse,
					startsAt: nextCodeDocument.startsAt,
					endsAt: nextCodeDocument.endsAt,
					globalLimit: nextCodeDocument.globalLimit,
					perCustomerLimit: nextCodeDocument.perCustomerLimit,
					currentRedemptions: 0,
					createdAt: now,
					updatedAt: now,
				};
				await db.collection<PromotionCodeDoc>("promotionCodes").insertOne(newCodeRecord);
				codeRecord = newCodeRecord;
			}
		} catch (error) {
			if (typeof error === "object" && error && "code" in error && error.code === 11000) {
				throw new Error("Another coupon already uses this code.");
			}
			throw error;
		}
	}

	const latest = await db.collection<PromotionDoc>("promotions").findOne({ _id: promotionObjectId });
	if (!latest) {
		throw new Error("Promotion not found.");
	}

	return { promotion: latest, code: codeRecord };
}

export async function updatePromotionStatus(args: {
	promotionId: string;
	status: PromotionStatus;
	userId?: string | null;
}) {
	await ensureIndexes();
	const db = await getDb();
	const objectId = new ObjectId(args.promotionId);
	await db.collection<PromotionDoc>("promotions").updateOne(
		{ _id: objectId },
		{
			$set: {
				status: args.status,
				updatedAt: new Date(),
				updatedBy: args.userId ?? null,
			},
			$inc: { version: 1 },
		},
	);
	const latest = await db.collection<PromotionDoc>("promotions").findOne({ _id: objectId });
	if (!latest) {
		throw new Error("Promotion not found.");
	}
	if (latest.kind === "coupon") {
		await db.collection<PromotionCodeDoc>("promotionCodes").updateMany(
			{ promotionId: objectId },
			{
				$set: {
					status: args.status === "archived" ? "archived" : args.status === "paused" ? "paused" : "active",
					updatedAt: new Date(),
				},
			},
		);
	}
	return latest;
}

export async function recordPromotionRedemption(args: {
	promotionId: string;
	promotionCodeId: string;
	userId: string;
	purchaseId: string;
	orderDraftId?: string | null;
}) {
	const response = await fetch(`${env.FASTAPI_API_URL}/promotions/redemptions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY,
		},
		body: JSON.stringify({
			promotion_id: args.promotionId,
			promotion_code_id: args.promotionCodeId,
			user_id: args.userId,
			purchase_id: args.purchaseId,
			order_draft_id: args.orderDraftId ?? null,
		}),
		cache: "no-store",
	});
	if (!response.ok) throw new Error("Não foi possível registrar o uso do cupom no FastAPI");
}

export async function getPromotionById(promotionId: string) {
	await ensureIndexes();
	const db = await getDb();
	return await db.collection<PromotionDoc>("promotions").findOne({ _id: new ObjectId(promotionId) });
}
