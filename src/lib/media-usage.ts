import "server-only";

import { env } from "@/env.mjs";

/**
 * Tells the media library which content is currently displaying an image, so
 * deleting it can be blocked (409) instead of silently breaking a page. Best
 * effort: a failure here must never block the actual content save, since the
 * media domain not knowing about a reference yet is far less harmful than a
 * broken save.
 */
export async function syncMediaUsage({
	entityType,
	entityId,
	entityLabel = "",
	field,
	imageUrls,
}: {
	entityType: string;
	entityId: string;
	entityLabel?: string;
	field: string;
	imageUrls: string[];
}) {
	try {
		await fetch(`${env.FASTAPI_API_URL}/media/internal/admin/usage`, {
			method: "PUT",
			headers: { "content-type": "application/json", "x-internal-api-key": env.FASTAPI_INTERNAL_API_KEY },
			body: JSON.stringify({
				entity_type: entityType,
				entity_id: entityId,
				entity_label: entityLabel,
				field,
				image_urls: imageUrls,
			}),
			cache: "no-store",
		});
	} catch (error) {
		console.error("[media usage sync]", error);
	}
}

const IMAGE_URL_PATTERN = /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i;

/**
 * Walks an arbitrary content object (an editorial document, a nested block
 * tree, ...) and collects every string value that looks like an absolute
 * image URL. Used where content shapes vary too much per record type to hook
 * a specific field path -- one generic sweep covers all of them.
 */
export function extractImageUrls(value: unknown, out: string[] = []): string[] {
	if (typeof value === "string") {
		if (/^https?:\/\//.test(value) && IMAGE_URL_PATTERN.test(value)) out.push(value);
		return out;
	}
	if (Array.isArray(value)) {
		for (const item of value) extractImageUrls(item, out);
		return out;
	}
	if (value && typeof value === "object") {
		for (const item of Object.values(value)) extractImageUrls(item, out);
		return out;
	}
	return out;
}
