"use server";

import { revalidatePath } from "next/cache";
import { env } from "@/env.mjs";
import { requireCapability } from "@/lib/api-auth";
import {
	dispatchPendingFavoriteDiscountNotifications,
	queueFavoriteDiscountNotificationsForPromotion,
} from "@/lib/favorite-discount-alerts";
import {
	createPromotionRecord,
	listActiveAutomaticPromotions,
	type PromotionBenefitType,
	type PromotionKind,
	type PromotionScope,
	type PromotionStackingMode,
	type PromotionStatus,
	updatePromotionRecord,
	updatePromotionStatus,
} from "@/lib/promotions";
import { getStripeAmountFromDecimal } from "@/lib/utils";

function parseStringList(raw: FormDataEntryValue | null) {
	return String(raw ?? "")
		.split(/[,\n]/)
		.map((value) => value.trim())
		.filter(Boolean);
}

function parseOptionalDate(raw: FormDataEntryValue | null) {
	const value = String(raw ?? "").trim();
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

function parseOptionalPositiveInteger(raw: FormDataEntryValue | null) {
	const value = String(raw ?? "").trim();
	if (!value) return null;
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		throw new Error("Enter a positive whole number.");
	}
	return parsed;
}

function parseBenefitValue(args: {
	raw: FormDataEntryValue | null;
	benefitType: PromotionBenefitType;
	currency: string;
}) {
	const parsed = Number.parseFloat(
		String(args.raw ?? "")
			.trim()
			.replace(",", "."),
	);
	if (!Number.isFinite(parsed) || parsed < 0) {
		throw new Error("Enter a valid discount value.");
	}
	if (args.benefitType === "percentage_off") {
		return Math.round(parsed);
	}
	return getStripeAmountFromDecimal({ amount: parsed, currency: args.currency });
}

function parsePromotionFormInput(formData: FormData) {
	const kind = String(formData.get("kind") ?? "automatic") as PromotionKind;
	const scope = String(formData.get("scope") ?? "item") as PromotionScope;
	const benefitType = String(formData.get("benefitType") ?? "percentage_off") as PromotionBenefitType;
	const rawStackingMode = String(formData.get("stackingMode") ?? "").trim();
	const stackingMode =
		kind === "coupon" && rawStackingMode
			? (rawStackingMode as PromotionStackingMode)
			: (null as PromotionStackingMode | null);
	const status = String(formData.get("status") ?? "active") as PromotionStatus;
	const currency = String(formData.get("currency") ?? env.STRIPE_CURRENCY ?? "BRL")
		.trim()
		.toUpperCase();
	if (kind === "coupon" && !String(formData.get("code") ?? "").trim()) {
		throw new Error("Coupons require a code.");
	}

	return {
		kind,
		scope,
		benefitType,
		stackingMode,
		status,
		payload: {
			name: String(formData.get("name") ?? "").trim(),
			label: String(formData.get("label") ?? "").trim() || null,
			description: String(formData.get("description") ?? "").trim() || null,
			kind,
			scope,
			benefitType,
			benefitValue: parseBenefitValue({
				raw: formData.get("benefitValue"),
				benefitType,
				currency,
			}),
			currency,
			status,
			productSlugs: parseStringList(formData.get("productSlugs")),
			categorySlugs: parseStringList(formData.get("categorySlugs")),
			variantIds: parseStringList(formData.get("variantIds")),
			code: String(formData.get("code") ?? "").trim() || null,
			minSubtotal: (() => {
				const raw = String(formData.get("minSubtotal") ?? "").trim();
				if (!raw) return null;
				const decimal = Number.parseFloat(raw.replace(",", "."));
				return Number.isFinite(decimal) ? getStripeAmountFromDecimal({ amount: decimal, currency }) : null;
			})(),
			firstPurchaseOnly: formData.get("firstPurchaseOnly") === "on",
			requireVerifiedEmail: formData.get("requireVerifiedEmail") === "on",
			couponGlobalLimit: parseOptionalPositiveInteger(formData.get("couponGlobalLimit")),
			couponPerCustomerLimit: parseOptionalPositiveInteger(formData.get("couponPerCustomerLimit")),
			priority: (() => {
				const raw = Number.parseInt(String(formData.get("priority") ?? "0"), 10);
				return Number.isFinite(raw) ? raw : 0;
			})(),
			startsAt: parseOptionalDate(formData.get("startsAt")),
			endsAt: parseOptionalDate(formData.get("endsAt")),
			couponStartsAt: parseOptionalDate(formData.get("couponStartsAt")),
			couponEndsAt: parseOptionalDate(formData.get("couponEndsAt")),
			stackingMode,
			notifyFavorites: formData.get("notifyFavorites") === "on",
		},
	};
}

export async function createPromotionAction(formData: FormData) {
	const auth = await requireCapability("promotions.write");
	if ("error" in auth) {
		throw new Error("Unauthorized.");
	}

	const parsed = parsePromotionFormInput(formData);
	const record = await createPromotionRecord({
		...parsed.payload,
		userId: auth.session.sub as string,
	});

	if (record.promotion.kind === "automatic" && parsed.status === "active") {
		await queueFavoriteDiscountNotificationsForPromotion(record.promotion._id!.toString());
		await dispatchPendingFavoriteDiscountNotifications(20);
	}

	revalidatePath("/admin/promotions");
}

export async function updatePromotionAction(formData: FormData) {
	const auth = await requireCapability("promotions.write");
	if ("error" in auth) {
		throw new Error("Unauthorized.");
	}

	const promotionId = String(formData.get("promotionId") ?? "").trim();
	if (!promotionId) {
		throw new Error("Promotion ID is required.");
	}

	const parsed = parsePromotionFormInput(formData);
	const record = await updatePromotionRecord({
		promotionId,
		...parsed.payload,
		userId: auth.session.sub as string,
	});

	if (
		record.promotion.kind === "automatic" &&
		record.promotion.status === "active" &&
		record.promotion.notifyFavorites
	) {
		await queueFavoriteDiscountNotificationsForPromotion(record.promotion._id!.toString());
		await dispatchPendingFavoriteDiscountNotifications(20);
	}

	revalidatePath("/admin/promotions");
}

export async function changePromotionStatusAction(formData: FormData) {
	const auth = await requireCapability("promotions.write");
	if ("error" in auth) {
		throw new Error("Unauthorized.");
	}

	const promotionId = String(formData.get("promotionId") ?? "").trim();
	const status = String(formData.get("status") ?? "paused") as PromotionStatus;
	if (!promotionId) {
		throw new Error("Promotion ID is required.");
	}

	const promotion = await updatePromotionStatus({
		promotionId,
		status,
		userId: auth.session.sub as string,
	});

	if (promotion.kind === "automatic" && status === "active") {
		await queueFavoriteDiscountNotificationsForPromotion(promotionId);
		await dispatchPendingFavoriteDiscountNotifications(20);
	}

	revalidatePath("/admin/promotions");
}

export async function processFavoriteDiscountAlertsAction() {
	const auth = await requireCapability("promotions.write");
	if ("error" in auth) {
		throw new Error("Unauthorized.");
	}
	const activePromotions = await listActiveAutomaticPromotions();
	for (const promotion of activePromotions) {
		if (promotion._id) {
			await queueFavoriteDiscountNotificationsForPromotion(promotion._id.toString());
		}
	}
	await dispatchPendingFavoriteDiscountNotifications(50);
	revalidatePath("/admin/promotions");
}
