import "server-only";

import { env } from "@/env.mjs";

async function request(path: string, body?: unknown) {
	const response = await fetch(`${env.FASTAPI_API_URL}${path}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY,
		},
		body: body === undefined ? undefined : JSON.stringify(body),
		cache: "no-store",
	});
	const payload = (await response.json().catch(() => null)) as Record<string, number> | null;
	if (!response.ok || !payload) throw new Error("Não foi possível processar os alertas no FastAPI.");
	return payload;
}

export async function queueFavoriteDiscountNotificationsForPromotion(promotionId: string) {
	return request(`/promotions/internal/admin/${encodeURIComponent(promotionId)}/favorite-alerts/queue`);
}

export async function dispatchPendingFavoriteDiscountNotifications(limit = 25) {
	return request(`/promotions/internal/admin/favorite-alerts/dispatch?limit=${encodeURIComponent(limit)}`);
}
