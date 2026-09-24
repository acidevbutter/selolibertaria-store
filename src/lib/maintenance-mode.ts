import "server-only";

import { cache } from "react";
import { env } from "@/env.mjs";

const SITE_ACTIVATION_READ_TIMEOUT_MS = 1800;

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

/**
 * Fail-closed by construction: a `false` here means either "the backend says
 * the site isn't activated yet" or "we couldn't find out" — both cases must
 * put the storefront in maintenance, so they're not distinguished.
 */
const getSiteActivated = cache(async (): Promise<boolean> => {
	try {
		const response = await withTimeout(
			fetch(`${env.FASTAPI_API_URL}/site-activation/public`, { cache: "no-store" }),
			SITE_ACTIVATION_READ_TIMEOUT_MS,
			"FastAPI site-activation read",
		);
		if (!response.ok) return false;
		const payload = (await response.json()) as { activated?: boolean };
		return payload.activated === true;
	} catch (error) {
		console.warn("[maintenance-mode] FastAPI unavailable; failing closed to maintenance:", error);
		return false;
	}
});

export async function isMaintenanceModeEnabled() {
	return !(await getSiteActivated());
}
