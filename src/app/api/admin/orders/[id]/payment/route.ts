import type { NextRequest } from "next/server";
import { requireCapability } from "@/lib/api-auth";
import { assertOrdersIntegrity, OrdersApiError } from "@/lib/mercado-pago-orders/contract";
import { createMercadoPagoOrdersClient } from "@/lib/mercado-pago-orders/server-client";
import { getDb } from "@/lib/mongodb";
import { notifyOrderStatusChange } from "@/lib/notify-order-status";
import { recordOrderAuditEntry } from "@/lib/order-audit";
import { matchesOrderIdentifier, type OrderRelatedIds } from "@/lib/order-identity";

type Operation = "cancel" | "refund";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireCapability("orders.update_status");
	if ("error" in auth) return auth.error;
	const { id } = await params;
	const body = (await req.json().catch(() => ({}))) as { operation?: Operation };
	if (!id || (body.operation !== "cancel" && body.operation !== "refund")) {
		return Response.json({ error: "Operação de pagamento inválida." }, { status: 400 });
	}

	const db = await getDb();
	const found = await db
		.collection("users")
		.aggregate([
			{ $match: { purchases: { $exists: true, $ne: [] } } },
			{ $project: { purchases: 1 } },
			{ $unwind: "$purchases" },
			{
				$match: {
					$or: [
						{ "purchases.id": id },
						{ "purchases.relatedIds.mercadoPagoOrderId": id },
						{ "purchases.relatedIds.mercadoPagoPaymentId": id },
					],
				},
			},
			{ $limit: 1 },
		])
		.toArray();
	const purchase = found[0]?.purchases as
		| { id: string; status: string; amountTotal: number; currency: string; relatedIds?: OrderRelatedIds }
		| undefined;
	if (!purchase || !matchesOrderIdentifier(purchase, id))
		return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
	const providerOrderId =
		purchase.relatedIds?.mercadoPagoOrderId || purchase.relatedIds?.mercadoPagoPaymentId;
	if (!providerOrderId)
		return Response.json({ error: "Order do Mercado Pago não encontrada." }, { status: 409 });

	try {
		const client = createMercadoPagoOrdersClient();
		const current = await client.getOrder(providerOrderId);
		assertOrdersIntegrity(current, {
			externalReference: purchase.id,
			amountInCents: purchase.amountTotal,
			currency: purchase.currency,
		});
		if (body.operation === "cancel" && current.status !== "pending") {
			return Response.json(
				{ error: "A order só pode ser cancelada enquanto estiver pendente." },
				{ status: 409 },
			);
		}
		if (body.operation === "refund" && current.status !== "approved") {
			return Response.json({ error: "O estorno só pode ser feito após aprovação." }, { status: 409 });
		}
		const result =
			body.operation === "cancel"
				? await client.cancelOrder({ providerOrderId, idempotencyKey: `admin:${providerOrderId}:cancel` })
				: await client.refundOrder({ providerOrderId, idempotencyKey: `admin:${providerOrderId}:refund` });
		const nextStatus = body.operation === "cancel" ? "canceled" : "refunded";
		const update: Record<string, unknown> = {
			"purchases.$.status": nextStatus,
			"purchases.$.relatedIds.mercadoPagoOrderId": providerOrderId,
			"purchases.$.updatedAt": new Date(),
		};
		if (body.operation === "refund") update["purchases.$.refundedAmount"] = purchase.amountTotal;
		await db.collection("users").updateOne({ "purchases.id": purchase.id }, { $set: update });
		await recordOrderAuditEntry({
			orderId: purchase.id,
			action: "order_payment_admin_operation",
			actorId: String(auth.session.sub),
			actorRole: auth.session.role,
			actorEmail: auth.session.email ?? null,
			details: {
				operation: body.operation,
				providerStatus: result.status,
				amountInCents: purchase.amountTotal,
				currency: purchase.currency,
			},
			createdAt: new Date(),
		});
		try {
			const userId = found[0]?._id?.toString();
			if (userId) await notifyOrderStatusChange(userId, purchase.id, nextStatus);
		} catch (error) {
			console.error("notifyOrderStatusChange failed (admin payment)", error);
		}
		return Response.json({ ok: true, status: nextStatus });
	} catch (error) {
		if (error instanceof OrdersApiError && error.code === "integrity_mismatch") {
			return Response.json({ error: "A order do provedor diverge do pedido local." }, { status: 409 });
		}
		console.error("[admin payment operation]", error);
		return Response.json(
			{ error: "Não foi possível confirmar a operação no Mercado Pago." },
			{ status: 502 },
		);
	}
}
