import "server-only";

import { cookies } from "next/headers";
import { env } from "@/env.mjs";

export type ProductAuditAction =
	| "product_group_created"
	| "product_group_updated"
	| "product_variant_created"
	| "product_variant_updated"
	| "product_variant_archived";

export interface ProductAuditEntry {
	_id?: string;
	slug: string;
	action: ProductAuditAction;
	actorId: string;
	actorRole: "admin" | "vendor" | "customer";
	actorEmail?: string | null;
	productId?: string | null;
	details?: Record<string, unknown> | null;
	createdAt: Date;
}

async function authorization() {
	const token = (await cookies()).get("session")?.value;
	if (!token) throw new Error("Autenticação obrigatória");
	return { authorization: `Bearer ${token}` };
}

export async function recordProductAuditEntry(entry: ProductAuditEntry) {
	const response = await fetch(`${env.FASTAPI_API_URL}/catalog/${encodeURIComponent(entry.slug)}/audit`, {
		method: "POST",
		headers: { ...(await authorization()), "content-type": "application/json" },
		body: JSON.stringify({ product_id: entry.productId, action: entry.action, details: entry.details }),
		cache: "no-store",
	});
	if (!response.ok) throw new Error("Não foi possível registrar a auditoria do produto.");
}

export async function listProductAuditEntries(slug: string, limit = 20): Promise<ProductAuditEntry[]> {
	const target = new URL(`${env.FASTAPI_API_URL}/catalog/${encodeURIComponent(slug)}/audit`);
	target.searchParams.set("limit", String(limit));
	const response = await fetch(target, { headers: await authorization(), cache: "no-store" });
	if (!response.ok) return [];
	const items = (await response.json()) as Array<{
		id: string;
		slug: string;
		action: ProductAuditAction;
		actor_id: string;
		actor_role: "admin" | "vendor" | "customer";
		actor_email: string | null;
		product_id: string | null;
		details: Record<string, unknown> | null;
		created_at: string;
	}>;
	return items.map((item) => ({
		_id: item.id,
		slug: item.slug,
		action: item.action,
		actorId: item.actor_id,
		actorRole: item.actor_role,
		actorEmail: item.actor_email,
		productId: item.product_id,
		details: item.details,
		createdAt: new Date(item.created_at),
	}));
}
