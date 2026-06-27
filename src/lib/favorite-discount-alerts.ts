import "server-only";

import { ObjectId } from "mongodb";
import { publicUrl } from "@/env.mjs";
import { commerce } from "@/lib/commerce-stripe";
import { sendEmail } from "@/lib/email";
import { favoriteDiscountEmailHtml } from "@/lib/email-templates/favorite-discount";
import type { FavoriteDoc } from "@/lib/favorites";
import { ensureIndexes, getDb } from "@/lib/mongodb";
import type { PromotionNotificationDoc } from "@/lib/promotions";
import { getPromotionById, isPromotionActive } from "@/lib/promotions";

function formatCurrency(amount: number, currency: string) {
	try {
		return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(amount / 100);
	} catch {
		return `${currency} ${(amount / 100).toFixed(2)}`;
	}
}

export async function queueFavoriteDiscountNotificationsForPromotion(promotionId: string) {
	await ensureIndexes();
	const db = await getDb();
	const promotion = await getPromotionById(promotionId);
	if (
		!promotion ||
		promotion.kind !== "automatic" ||
		!promotion.notifyFavorites ||
		!isPromotionActive(promotion)
	) {
		return { queued: 0, skipped: 0 };
	}

	const favoritesFilter: Record<string, unknown> = {};
	if (promotion.targets?.productSlugs?.length) {
		favoritesFilter.productSlug = { $in: promotion.targets.productSlugs };
	}

	const favorites = await db.collection<FavoriteDoc>("favorites").find(favoritesFilter).toArray();
	if (favorites.length === 0) {
		return { queued: 0, skipped: 0 };
	}

	const notifications = db.collection<PromotionNotificationDoc>("promotionNotifications");
	const productCache = new Map<string, Awaited<ReturnType<typeof commerce.product.get>>>();

	let queued = 0;
	let skipped = 0;

	for (const favorite of favorites) {
		const cachedProduct = productCache.has(favorite.productSlug)
			? (productCache.get(favorite.productSlug) ?? null)
			: await commerce.product.get({ slug: favorite.productSlug }).catch(() => null);
		if (!productCache.has(favorite.productSlug)) {
			productCache.set(favorite.productSlug, cachedProduct);
		}
		const product = cachedProduct;
		if (!product) {
			skipped += 1;
			continue;
		}

		const selectedVariant =
			product.variants?.find((variant) => variant.id === (favorite.variantId ?? undefined)) ??
			product.variants?.[0];
		const appliedPromotion = selectedVariant?.appliedPromotions?.find(
			(entry) => entry.promotionId === promotion._id?.toString(),
		);
		if (!selectedVariant || !appliedPromotion || !selectedVariant.pricing?.discountAmount) {
			skipped += 1;
			continue;
		}

		try {
			await notifications.updateOne(
				{
					promotionId: promotion._id,
					userId: favorite.userId,
					productSlug: favorite.productSlug,
					variantId: favorite.variantId ?? null,
					effectivePrice: selectedVariant.pricing.effectivePrice,
				},
				{
					$setOnInsert: {
						promotionId: promotion._id,
						userId: favorite.userId,
						productSlug: favorite.productSlug,
						variantId: favorite.variantId ?? null,
						currency: selectedVariant.currency || product.currency || "BRL",
						basePrice: selectedVariant.pricing.basePrice,
						effectivePrice: selectedVariant.pricing.effectivePrice,
						status: "pending",
						communicationId: null,
						reason: null,
						productName: product.name,
						productUrl: `${publicUrl}/product/${product.slug}${favorite.variantId ? `?variant=${encodeURIComponent(favorite.variantId)}` : ""}`,
						productImage: selectedVariant.images?.[0] || product.images[0] || null,
						variantLabel: selectedVariant.label ?? null,
						createdAt: new Date(),
						sentAt: null,
					},
				},
				{ upsert: true },
			);
			queued += 1;
		} catch (error) {
			skipped += 1;
			console.error("[favorite discount queue]", error);
		}
	}

	return { queued, skipped };
}

export async function dispatchPendingFavoriteDiscountNotifications(limit = 25) {
	await ensureIndexes();
	const db = await getDb();
	const notifications = await db
		.collection<PromotionNotificationDoc>("promotionNotifications")
		.find({ status: "pending" })
		.sort({ createdAt: 1 })
		.limit(limit)
		.toArray();

	let sent = 0;
	let failed = 0;
	let skipped = 0;

	for (const notification of notifications) {
		const user = await db.collection("users").findOne<{
			email?: string;
			name?: string;
			verified?: boolean;
			marketing?: { email?: { optIn?: boolean } };
		}>(
			{ _id: new ObjectId(notification.userId) },
			{ projection: { email: 1, name: 1, verified: 1, marketing: 1 } },
		);

		if (!user?.email || user.verified === false || !user.marketing?.email?.optIn) {
			await db.collection("promotionNotifications").updateOne(
				{ _id: notification._id },
				{
					$set: {
						status: "skipped",
						reason: "missing_opt_in_or_verified_email",
						sentAt: new Date(),
					},
				},
			);
			skipped += 1;
			continue;
		}

		const html = favoriteDiscountEmailHtml({
			name: user.name ?? null,
			productName: notification.productName,
			variantLabel: notification.variantLabel ?? null,
			productUrl: notification.productUrl,
			basePrice: formatCurrency(notification.basePrice, notification.currency || "BRL"),
			effectivePrice: formatCurrency(notification.effectivePrice, notification.currency || "BRL"),
			promotionLabel: "Desconto ativo",
		});

		const result = await sendEmail({
			to: user.email,
			subject: `${notification.productName} está com desconto`,
			html,
			text: `${notification.productName} está com desconto. Veja agora: ${notification.productUrl}`,
			log: {
				kind: "marketing",
				source: "promotion_notifications",
				userId: notification.userId,
				template: "favorite-discount-alert",
			},
		});

		await db.collection("promotionNotifications").updateOne(
			{ _id: notification._id },
			{
				$set: {
					status: result.sent ? "sent" : "failed",
					reason: result.error ?? null,
					communicationId: result.communicationIds?.[0] ?? null,
					sentAt: new Date(),
				},
			},
		);

		if (result.sent) sent += 1;
		else failed += 1;
	}

	return { sent, failed, skipped };
}
