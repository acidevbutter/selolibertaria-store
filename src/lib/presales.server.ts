import "server-only";

import { cache } from "react";
import { env } from "@/env.mjs";
import type { PresalePublic, PresaleStatus } from "@/lib/presales";

const PRESALE_READ_TIMEOUT_MS = 1800;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	try {
		return await Promise.race([
			promise,
			new Promise<T>((_, reject) => {
				timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
			}),
		]);
	} finally {
		if (timeoutId) clearTimeout(timeoutId);
	}
}

type FastApiPresalePublic = {
	product_id: string;
	variant_id: string;
	launch_at: string;
	presale_price: number | string;
	full_price: number | string;
	status: PresaleStatus;
	modal_enabled: boolean;
	modal_interval_hours: number;
	modal_title: string;
	modal_body: string;
};

/** Lê a pré-venda pública de um produto direto do backend real
 * (`app/presales/`), falhando fechado (`null`) em qualquer erro/timeout —
 * mesmo padrão de `getSettingsDoc()` em `settings-store.ts`. */
export const getPublicPresaleByProduct = cache(async (productId: string): Promise<PresalePublic | null> => {
	try {
		const response = await withTimeout(
			fetch(`${env.FASTAPI_API_URL}/presales/public/product/${encodeURIComponent(productId)}`, {
				cache: "no-store",
			}),
			PRESALE_READ_TIMEOUT_MS,
			"FastAPI presale read",
		);
		if (!response.ok) return null;
		const body = (await response.json()) as FastApiPresalePublic | null;
		if (!body) return null;
		return {
			productId: body.product_id,
			variantId: body.variant_id,
			launchAt: body.launch_at,
			presalePrice: Number(body.presale_price),
			fullPrice: Number(body.full_price),
			status: body.status,
			modalEnabled: body.modal_enabled,
			modalIntervalHours: body.modal_interval_hours,
			modalTitle: body.modal_title,
			modalBody: body.modal_body,
		};
	} catch (error) {
		console.warn("[presales.server] FastAPI unavailable; failing closed:", error);
		return null;
	}
});
