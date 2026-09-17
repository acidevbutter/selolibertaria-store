import "server-only";

import { cookies } from "next/headers";
import { env } from "@/env.mjs";

export type OrderAuditAction =
	| "order_fulfillment_updated"
	| "order_payment_status_webhook_updated"
	| "order_payment_admin_operation";
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

async function authorization() {
	const token = (await cookies()).get("session")?.value;
	if (!token) throw new Error("Autenticação obrigatória");
	return { authorization: `Bearer ${token}` };
}

export async function listOrderAuditEntries(orderId: string, limit = 20): Promise<OrderAuditEntry[]> {
	const target = new URL(`${env.FASTAPI_API_URL}/orders/${encodeURIComponent(orderId)}/audit`);
	target.searchParams.set("limit", String(limit));
	const response = await fetch(target, { headers: await authorization(), cache: "no-store" });
	if (!response.ok) return [];
	const items = (await response.json()) as Array<{
		order_id: string;
		action: OrderAuditAction;
		actor: string | null;
		payload: Record<string, unknown> | null;
		created_at: string;
	}>;
	return items.map((item) => ({
		orderId: item.order_id,
		action: item.action,
		actorId: item.actor ?? "system",
		actorRole: "system",
		details: item.payload,
		createdAt: new Date(item.created_at),
	}));
}
