export type FulfillmentStatus = "received" | "producing" | "shipped";

export type CustomerOrderStatusKey =
	| "payment_action_required"
	| "payment_processing"
	| "payment_confirmed"
	| "payment_disputed"
	| "payment_dispute_resolved"
	| "payment_dispute_lost"
	| "payment_failed"
	| "payment_canceled"
	| "payment_refunded"
	| "fulfillment_received"
	| "fulfillment_producing"
	| "fulfillment_shipped";

export type CustomerOrderStatusContent = {
	key: CustomerOrderStatusKey;
	kind: "payment" | "fulfillment";
	subject: string;
	heading: string;
	intro: string;
	statusLabel: string;
	details?: string;
};

const FULFILLMENT_STATUS_SET = new Set<FulfillmentStatus>(["received", "producing", "shipped"]);

function normalizeStatus(status?: string | null) {
	return status?.trim().toLowerCase() ?? "";
}

export function isFulfillmentStatus(status?: string | null): status is FulfillmentStatus {
	return FULFILLMENT_STATUS_SET.has(normalizeStatus(status) as FulfillmentStatus);
}

export function getCustomerOrderStatusKey(status?: string | null): CustomerOrderStatusKey | null {
	const normalized = normalizeStatus(status);
	if (!normalized) return null;

	if (isFulfillmentStatus(normalized)) {
		if (normalized === "received") return "fulfillment_received";
		if (normalized === "producing") return "fulfillment_producing";
		return "fulfillment_shipped";
	}

	switch (normalized) {
		case "paid":
		case "succeeded":
		case "no_payment_required":
			return "payment_confirmed";
		case "disputed":
			return "payment_disputed";
		case "won":
			return "payment_dispute_resolved";
		case "lost":
			return "payment_dispute_lost";
		case "processing":
		case "pending":
		case "unpaid":
		case "open":
			return "payment_processing";
		case "requires_action":
		case "requires_capture":
		case "requires_confirmation":
		case "requires_payment_method":
			return "payment_action_required";
		case "failed":
			return "payment_failed";
		case "canceled":
		case "cancel":
		case "expired":
		case "voided":
		case "uncollectible":
			return "payment_canceled";
		case "refunded":
		case "refund_updated":
			return "payment_refunded";
		default:
			return null;
	}
}

export function shouldNotifyCustomerOrderStatusChange(
	previousStatus?: string | null,
	nextStatus?: string | null,
) {
	const nextKey = getCustomerOrderStatusKey(nextStatus);
	if (!nextKey) return false;
	const previousKey = getCustomerOrderStatusKey(previousStatus);
	return previousKey !== nextKey;
}

export function getCustomerOrderStatusContent({
	status,
	trackingNumber,
}: {
	status?: string | null;
	trackingNumber?: string | null;
}): CustomerOrderStatusContent | null {
	const key = getCustomerOrderStatusKey(status);
	if (!key) return null;

	switch (key) {
		case "payment_action_required":
			return {
				key,
				kind: "payment",
				subject: "Your order is waiting for a payment action",
				heading: "Payment action required",
				intro:
					"We received your order, but the payment still needs extra confirmation or a new payment method.",
				statusLabel: "Payment action required",
				details: "If needed, try again at checkout to complete your purchase.",
			};
		case "payment_processing":
			return {
				key,
				kind: "payment",
				subject: "We received your order and the payment is under review",
				heading: "Payment under review",
				intro: "Your order was received and the payment is being reviewed by the financial institution.",
				statusLabel: "Payment under review",
				details: "As soon as confirmation arrives, we will notify you by email.",
			};
		case "payment_confirmed":
			return {
				key,
				kind: "payment",
				subject: "Payment confirmed",
				heading: "Payment confirmed",
				intro: "Your order payment was approved and is already moving through our internal flow.",
				statusLabel: "Payment approved",
				details: "We will continue with the next steps and send more updates as the order progresses.",
			};
		case "payment_disputed":
			return {
				key,
				kind: "payment",
				subject: "Your payment is under dispute review",
				heading: "Payment under dispute review",
				intro:
					"A dispute was opened for this payment and our team is reviewing it with the payment provider.",
				statusLabel: "Payment under dispute",
				details: "We will contact you if we need anything else while the dispute is being reviewed.",
			};
		case "payment_dispute_resolved":
			return {
				key,
				kind: "payment",
				subject: "Your payment dispute was resolved",
				heading: "Dispute resolved",
				intro: "The dispute related to this payment was resolved and the order timeline has been updated.",
				statusLabel: "Dispute resolved",
				details: "If you still need help with this order, please contact our support team.",
			};
		case "payment_dispute_lost":
			return {
				key,
				kind: "payment",
				subject: "Your payment dispute was closed",
				heading: "Dispute closed",
				intro: "The dispute related to this payment was closed by the payment provider.",
				statusLabel: "Dispute closed",
				details: "If you have questions about the result, please contact our support team.",
			};
		case "payment_failed":
			return {
				key,
				kind: "payment",
				subject: "We could not approve the payment",
				heading: "Payment not approved",
				intro: "We could not confirm your order payment.",
				statusLabel: "Payment declined",
				details: "You can try again with another payment method or review the submitted details.",
			};
		case "payment_canceled":
			return {
				key,
				kind: "payment",
				subject: "Payment canceled",
				heading: "Payment canceled",
				intro: "Your order payment was canceled or expired before confirmation.",
				statusLabel: "Payment canceled",
				details: "If you still want to complete the purchase, you will need to start a new payment.",
			};
		case "payment_refunded":
			return {
				key,
				kind: "payment",
				subject: "Refund processed",
				heading: "Refund update",
				intro: "We recorded a refund update for your order.",
				statusLabel: "Refund processed",
				details: "If you need help tracking the refund, please contact our support team.",
			};
		case "fulfillment_received":
			return {
				key,
				kind: "fulfillment",
				subject: "Your order was received by our team",
				heading: "Order received",
				intro: "Your order was received by our team and has entered the preparation queue.",
				statusLabel: "Order received",
				details: "We will let you know when it moves to the next step.",
			};
		case "fulfillment_producing":
			return {
				key,
				kind: "fulfillment",
				subject: "Your order is in production",
				heading: "Order in production",
				intro: "Your order is currently in production/preparation.",
				statusLabel: "In production",
				details: "As soon as it ships, you will receive another update.",
			};
		case "fulfillment_shipped":
			return {
				key,
				kind: "fulfillment",
				subject: "Your order has shipped",
				heading: "Order shipped",
				intro: "Your order has been dispatched and is on the way.",
				statusLabel: "Order shipped",
				details: trackingNumber
					? `Tracking code: ${trackingNumber}`
					: "If tracking is available, it will appear in this update.",
			};
	}
}
