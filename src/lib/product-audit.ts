import "server-only";

import { getDb } from "@/lib/mongodb";

export type ProductAuditAction =
	| "product_group_created"
	| "product_group_updated"
	| "product_variant_created"
	| "product_variant_updated"
	| "product_variant_archived";

export interface ProductAuditEntry {
	slug: string;
	action: ProductAuditAction;
	actorId: string;
	actorRole: "admin" | "vendor" | "customer";
	actorEmail?: string | null;
	productId?: string | null;
	details?: Record<string, unknown> | null;
	createdAt: Date;
}

export async function recordProductAuditEntry(entry: ProductAuditEntry) {
	const db = await getDb();
	await db.collection<ProductAuditEntry>("productAuditLogs").insertOne(entry);
}

export async function listProductAuditEntries(slug: string, limit = 20) {
	const db = await getDb();
	return await db
		.collection<ProductAuditEntry>("productAuditLogs")
		.find({ slug })
		.sort({ createdAt: -1 })
		.limit(limit)
		.toArray();
}
