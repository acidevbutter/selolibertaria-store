import "server-only";

import { getDb } from "@/lib/mongodb";

export type OrderAuditAction = "order_fulfillment_updated" | "order_payment_status_webhook_updated";
export type OrderAuditActorRole = "admin" | "vendor" | "customer" | "system";

export interface OrderAuditEntry {
	orderId: string;
	action: OrderAuditAction;
	actorId: string;
	actorRole: OrderAuditActorRole;
	actorEmail?: string | null;
	details?: Record<string, unknown> | null;
	createdAt: Date;
}

export async function recordOrderAuditEntry(entry: OrderAuditEntry) {
	const db = await getDb();
	await db.collection<OrderAuditEntry>("orderAuditLogs").insertOne(entry);
}

export async function listOrderAuditEntries(orderId: string, limit = 20) {
	const db = await getDb();
	return await db
		.collection<OrderAuditEntry>("orderAuditLogs")
		.find({ orderId })
		.sort({ createdAt: -1 })
		.limit(limit)
		.toArray();
}
