import type { NextRequest } from "next/server";
import { requireCapability } from "@/lib/api-auth";
import { getDb } from "@/lib/mongodb";
import { notifyOrderStatusChange } from "@/lib/notify-order-status";
import { recordOrderAuditEntry } from "@/lib/order-audit";
import { matchesOrderIdentifier, type OrderRelatedIds } from "@/lib/order-identity";
import { shouldNotifyCustomerOrderStatusChange } from "@/lib/order-status-notification";

type FulfillmentStatus = "received" | "producing" | "shipped";
const ORDER: FulfillmentStatus[] = ["received", "producing", "shipped"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireCapability("orders.update_status");
	if ("error" in auth) return auth.error;
	const session = auth.session;
	const { id } = await params;
	if (!id) {
		return Response.json(
			{ error: "Informe o ID do pedido.", code: "ADMIN_ORDER_FULFILLMENT_ID_REQUIRED" },
			{ status: 400 },
		);
	}

	const body = (await req.json().catch(() => ({}))) as {
		status?: FulfillmentStatus;
		trackingNumber?: string | null;
	};
	const nextStatus = body.status ?? undefined;
	const trackingNumber = body.trackingNumber ?? undefined;
	if (!nextStatus && trackingNumber === undefined) {
		return Response.json(
			{ error: "Nenhuma alteração foi informada.", code: "ADMIN_ORDER_FULFILLMENT_NO_CHANGES" },
			{ status: 400 },
		);
	}
	if (nextStatus && !ORDER.includes(nextStatus)) {
		return Response.json(
			{ error: "Situação de expedição inválida.", code: "ADMIN_ORDER_FULFILLMENT_INVALID_STATUS" },
			{ status: 400 },
		);
	}

	const db = await getDb();
	const users = db.collection("users");
	const foundList = await users
		.aggregate([
			{ $match: { purchases: { $exists: true, $ne: [] } } },
			{ $project: { purchases: 1 } },
			{ $unwind: "$purchases" },
			{
				$match: {
					$or: [
						{ "purchases.id": id },
						{ "purchases.relatedIds.mercadoPagoPaymentId": id },
						{ "purchases.relatedIds.mercadoPagoOrderId": id },
					],
				},
			},
			{ $limit: 1 },
		])
		.toArray();
	const found = foundList[0] as
		| {
				purchases: {
					id: string;
					relatedIds?: OrderRelatedIds;
					fulfillment?: { status?: FulfillmentStatus; trackingNumber?: string | null };
				};
		  }
		| undefined;
	if (!found) {
		return Response.json(
			{ error: "Pedido não encontrado.", code: "ADMIN_ORDER_FULFILLMENT_NOT_FOUND" },
			{ status: 404 },
		);
	}
	if (!matchesOrderIdentifier(found.purchases, id)) {
		return Response.json(
			{ error: "Pedido não encontrado.", code: "ADMIN_ORDER_FULFILLMENT_NOT_FOUND" },
			{ status: 404 },
		);
	}

	const orderId = found.purchases.id;

	const current = (found.purchases.fulfillment?.status as FulfillmentStatus | undefined) || undefined;
	const currentTrackingNumber = found.purchases.fulfillment?.trackingNumber ?? null;
	if (nextStatus && current) {
		const currIdx = ORDER.indexOf(current);
		const nextIdx = ORDER.indexOf(nextStatus);
		if (nextIdx < currIdx) {
			return Response.json(
				{
					error: "Não é possível voltar a expedição para uma etapa anterior.",
					code: "ADMIN_ORDER_FULFILLMENT_BACKWARD_TRANSITION",
				},
				{ status: 409 },
			);
		}
	}

	const set: Record<string, unknown> = {};
	if (nextStatus) set["purchases.$.fulfillment.status"] = nextStatus;
	if (trackingNumber !== undefined) set["purchases.$.fulfillment.trackingNumber"] = trackingNumber ?? null;
	const res = await users.updateOne({ "purchases.id": orderId }, { $set: set });
	if (res.modifiedCount && res.modifiedCount > 0) {
		await recordOrderAuditEntry({
			orderId,
			action: "order_fulfillment_updated",
			actorId: String(session.sub),
			actorRole: session.role,
			actorEmail: session.email ?? null,
			details: {
				previousStatus: current ?? null,
				nextStatus: nextStatus ?? current ?? null,
				previousTrackingNumber: currentTrackingNumber,
				nextTrackingNumber: trackingNumber !== undefined ? (trackingNumber ?? null) : currentTrackingNumber,
			},
			createdAt: new Date(),
		});
	}
	// Notify user about fulfillment status change if update applied and the status actually changed
	if (res.modifiedCount && res.modifiedCount > 0) {
		try {
			if (nextStatus && shouldNotifyCustomerOrderStatusChange(current, nextStatus)) {
				const foundUser = await users.findOne({ "purchases.id": orderId }, { projection: { _id: 1 } });
				if (foundUser?._id) {
					await notifyOrderStatusChange(String(foundUser._id), orderId, nextStatus);
				}
			}
		} catch (err) {
			console.error("notifyOrderStatusChange failed (admin fulfillment)", err);
		}
	}

	return Response.json({ ok: true });
}
