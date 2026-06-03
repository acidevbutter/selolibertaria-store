import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import { notifyOrderStatusChange } from "./notify-order-status";
import { matchesOrderIdentifier } from "./order-identity";

interface PurchaseNotifications {
	orderReceivedEmailSentAt?: Date | string | null;
}

interface PurchaseDoc {
	id: string;
	fulfillment?: { status?: "received" | "producing" | "shipped"; trackingNumber?: string | null } | null;
	notifications?: PurchaseNotifications | null;
	relatedIds?: {
		sessionId?: string;
		paymentIntentId?: string;
	} | null;
}

export async function ensureOrderReceivedEmail(userId: string, purchaseIdentifier: string) {
	const db = await getDb();
	const users = db.collection("users");
	const userObjectId = new ObjectId(userId);
	const user = await users.findOne<{ purchases?: PurchaseDoc[] }>(
		{ _id: userObjectId },
		{ projection: { purchases: 1 } },
	);

	const purchase = user?.purchases?.find((entry) => matchesOrderIdentifier(entry, purchaseIdentifier));
	if (!purchase) return false;

	const purchaseId = purchase.id;
	const alreadySent = Boolean(purchase.notifications?.orderReceivedEmailSentAt);

	if (!purchase.fulfillment?.status) {
		await users.updateOne(
			{ _id: userObjectId, "purchases.id": purchaseId },
			{
				$set: {
					"purchases.$.fulfillment.status": "received",
					updatedAt: new Date(),
				},
			},
		);
	}

	if (alreadySent) return false;

	const sent = await notifyOrderStatusChange(userId, purchaseId, "received");
	if (!sent) return false;

	await users.updateOne(
		{ _id: userObjectId, "purchases.id": purchaseId },
		{
			$set: {
				"purchases.$.notifications.orderReceivedEmailSentAt": new Date(),
			},
		},
	);

	return true;
}
