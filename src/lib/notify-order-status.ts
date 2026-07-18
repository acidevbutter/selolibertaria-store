import { ObjectId } from "mongodb";
import { getCatalogProductById } from "./catalog";
import { sendEmail } from "./email";
import { orderStatusEmailHtml } from "./email-templates/order-status";
import { getDb } from "./mongodb";
import { getCustomerOrderStatusContent } from "./order-status-notification";

interface NotifyItem {
	name: string | null;
	quantity: number;
	unitAmount?: number | null;
	image?: string | null;
}
interface NotifyPurchase {
	id: string;
	amountTotal?: number;
	currency?: string;
	items?: NotifyItem[];
	fulfillment?: { status?: "received" | "producing" | "shipped" } | null;
}

interface RawPurchaseItem {
	name?: string | null;
	quantity?: number;
	unitAmount?: number | null;
	priceId?: string | null;
	productId?: string | null;
	image?: string | null;
}
interface RawPurchase {
	id: string;
	amountTotal?: number;
	currency?: string;
	items?: RawPurchaseItem[];
	fulfillment?: {
		status?: "received" | "producing" | "shipped";
		trackingNumber?: string | null;
	} | null;
}

export async function notifyOrderStatusChange(userId: string, purchaseId: string, status: string) {
	const db = await getDb();
	const users = db.collection("users");
	const user = await users.findOne(
		{ _id: new ObjectId(userId) },
		{ projection: { email: 1, name: 1, purchases: 1 } },
	);
	if (!user || !user.email) return false;
	const purchases = (user.purchases || []) as NotifyPurchase[];
	const purchase = purchases.find((p) => p.id === purchaseId) as NotifyPurchase | undefined;

	const enrichedItems = await Promise.all(
		(purchase?.items || []).map(async (it) => {
			const raw = it as RawPurchaseItem;
			const catalogProduct = raw.productId
				? await getCatalogProductById(raw.productId).catch(() => null)
				: null;
			return {
				name: raw.name || catalogProduct?.name || "",
				qty: raw.quantity || 0,
				unitAmount: raw.unitAmount ?? null,
				image: raw.image || catalogProduct?.images?.[0] || null,
			};
		}),
	);

	const rawPurchase = purchase as RawPurchase | undefined;
	const currency = (rawPurchase?.currency || "BRL") as string;
	const totalCents = rawPurchase?.amountTotal ?? 0;
	const emailContent = getCustomerOrderStatusContent({
		status,
		trackingNumber: rawPurchase?.fulfillment?.trackingNumber ?? null,
	});
	if (!emailContent) return false;

	// fetch admin settings to include supportEmail
	const settingsCol = db.collection("settings");
	const settings = await settingsCol.findOne();

	const html = orderStatusEmailHtml({
		name: (user as unknown as { name?: string }).name,
		orderId: purchaseId,
		content: emailContent,
		currency,
		fulfillment: rawPurchase?.fulfillment ?? null,
		items: enrichedItems,
		totalCents,
		supportEmail: settings?.current?.supportEmail ?? undefined,
	});
	try {
		const result = await sendEmail({
			to: (user as unknown as { email: string }).email,
			subject: `${emailContent.subject} - pedido #${purchaseId}`,
			html,
			log: {
				kind: "order_status",
				source: "lib/notify-order-status",
				userId,
				purchaseId,
				orderStatus: status,
				template: emailContent.key,
			},
		});
		if (!result.sent) {
			console.error("Failed to notify user of order status change", result.error);
			return false;
		}
		await users.updateOne(
			{ _id: new ObjectId(userId), "purchases.id": purchaseId },
			{
				$set: {
					"purchases.$.notifications.lastStatusEmailKey": emailContent.key,
					"purchases.$.notifications.lastStatusEmailStatus": status,
					"purchases.$.notifications.lastStatusEmailKind": emailContent.kind,
					"purchases.$.notifications.lastStatusEmailSentAt": new Date(),
				},
			},
		);
		return true;
	} catch (err) {
		console.error("Failed to notify user of order status change", err);
		return false;
	}
}
