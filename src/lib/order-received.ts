import { ObjectId } from "mongodb";
import { publicUrl } from "@/env.mjs";
import { issueAccountAccessToken, issuePasswordSetupToken } from "./account-access";
import { sendEmail } from "./email";
import { purchaseCompletedEmailHtml } from "./email-templates/purchase-completed";
import { getDb } from "./mongodb";
import { matchesOrderIdentifier } from "./order-identity";

interface PurchaseNotifications {
	orderReceivedEmailSentAt?: Date | string | null;
}

interface PurchaseDoc {
	id: string;
	amountTotal?: number;
	currency?: string;
	buyer?: {
		fullName?: string | null;
		email?: string | null;
	} | null;
	items?: Array<{
		name?: string | null;
		quantity?: number;
		unitAmount?: number | null;
	}>;
	fulfillment?: {
		status?: "received" | "producing" | "shipped";
		trackingNumber?: string | null;
	} | null;
	notifications?: PurchaseNotifications | null;
}

function formatMoney(amountCents?: number | null, currency?: string | null) {
	try {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: currency || "BRL",
		}).format((amountCents ?? 0) / 100);
	} catch {
		return `${currency || "BRL"} ${((amountCents ?? 0) / 100).toFixed(2)}`;
	}
}

export async function ensureOrderReceivedEmail(userId: string, purchaseIdentifier: string) {
	const db = await getDb();
	const users = db.collection("users");
	const userObjectId = new ObjectId(userId);
	const user = await users.findOne<{
		email?: string;
		name?: string;
		passwordHash?: string;
		purchases?: PurchaseDoc[];
	}>({ _id: userObjectId }, { projection: { email: 1, name: 1, passwordHash: 1, purchases: 1 } });

	const purchase = user?.purchases?.find((entry) => matchesOrderIdentifier(entry, purchaseIdentifier));
	if (!user?.email || !purchase) {
		return false;
	}

	const purchaseId = purchase.id;
	if (purchase.notifications?.orderReceivedEmailSentAt || !purchase.fulfillment?.status) {
		return false;
	}

	try {
		const { token: accountToken } = await issueAccountAccessToken({
			userId,
			orderId: purchaseId,
		});
		const accountUrl = `${publicUrl.replace(/\/$/, "")}/account/access?token=${encodeURIComponent(accountToken)}`;
		const passwordSetupUrl = !user.passwordHash
			? `${publicUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(
					(await issuePasswordSetupToken(userId)).token,
				)}`
			: undefined;
		const total = formatMoney(purchase.amountTotal, purchase.currency);
		const items = (purchase.items || []).map((item) => ({
			name: item.name || "Item",
			quantity: item.quantity || 0,
			price:
				typeof item.unitAmount === "number"
					? formatMoney((item.unitAmount ?? 0) * (item.quantity || 0), purchase.currency)
					: undefined,
		}));
		const buyerName = purchase.buyer?.fullName || user.name || null;
		const html = purchaseCompletedEmailHtml({
			name: buyerName,
			orderId: purchaseId,
			accountUrl,
			passwordSetupUrl,
			items,
			total,
			baseUrl: publicUrl,
		});

		const textParts = [
			`${buyerName ? `Olá, ${buyerName}. ` : ""}Sua compra foi confirmada.`,
			`Acesse sua conta: ${accountUrl}`,
			passwordSetupUrl ? `Crie ou defina sua senha: ${passwordSetupUrl}` : null,
		].filter(Boolean);

		await sendEmail({
			to: user.email,
			subject: "Compra concluída — Selo Libertária",
			html,
			text: textParts.join("\n"),
			log: {
				kind: "purchase_completed",
				source: "order-received",
				userId,
				purchaseId,
				template: "purchase-completed",
			},
		});

		await users.updateOne(
			{ _id: userObjectId, "purchases.id": purchaseId },
			{
				$set: {
					"purchases.$.notifications.orderReceivedEmailSentAt": new Date(),
				},
			},
		);

		return true;
	} catch (error) {
		console.error("Failed send purchase completed email", error);
		return false;
	}
}
