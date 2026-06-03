import { matchesOrderIdentifier } from "@/lib/order-identity";

export interface StripeWebhookPurchaseLike {
	id: string;
	events?: Array<{
		eventId: string;
	}>;
	relatedIds?: {
		sessionId?: string;
		paymentIntentId?: string;
		chargeIds?: string[];
		invoiceId?: string;
		subscriptionId?: string;
		refundIds?: string[];
	};
}

export function matchesStripeWebhookPurchase(purchase: StripeWebhookPurchaseLike, rootId: string) {
	return (
		matchesOrderIdentifier(purchase, rootId) ||
		purchase.relatedIds?.invoiceId === rootId ||
		purchase.relatedIds?.subscriptionId === rootId ||
		purchase.relatedIds?.chargeIds?.includes(rootId) === true ||
		purchase.relatedIds?.refundIds?.includes(rootId) === true
	);
}

export function hasStripeWebhookEvent(purchase: StripeWebhookPurchaseLike, eventId: string) {
	return purchase.events?.some((event) => event.eventId === eventId) === true;
}
