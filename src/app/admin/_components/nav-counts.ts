import { cookies } from "next/headers";
import { env } from "@/env.mjs";

/**
 * Counts shown on the right of the rail items, in mono. Each one degrades to
 * "no count" on failure: a rail that cannot load a number still navigates, and
 * the panel never shows a broken screen because a count was unavailable.
 */
export async function fetchMediaCount(): Promise<number | undefined> {
	try {
		const response = await fetch(`${env.FASTAPI_API_URL}/media/internal/admin?page=1&page_size=1`, {
			headers: { "x-internal-api-key": env.FASTAPI_INTERNAL_API_KEY },
			cache: "no-store",
		});
		if (!response.ok) return undefined;
		const page = (await response.json()) as { total?: number };
		return typeof page.total === "number" ? page.total : undefined;
	} catch {
		return undefined;
	}
}

export async function fetchOrdersCount(): Promise<number | undefined> {
	try {
		const token = (await cookies()).get("session")?.value;
		if (!token) return undefined;
		const response = await fetch(`${env.FASTAPI_API_URL}/orders/?page=1&page_size=1`, {
			headers: { authorization: `Bearer ${token}` },
			cache: "no-store",
		});
		if (!response.ok) return undefined;
		const page = (await response.json()) as { total?: number };
		return typeof page.total === "number" ? page.total : undefined;
	} catch {
		return undefined;
	}
}
