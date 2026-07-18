import type Stripe from "stripe";

export interface ExtractedStripeEventContext {
	userId: string | null;
	rootId: string | null;
	kind: string;
	related: {
		sessionId?: string;
		paymentIntentId?: string;
		invoiceId?: string;
		subscriptionId?: string;
		chargeId?: string;
		refundId?: string;
		disputeId?: string;
	};
}

export function deriveStripeEventStatus(rawObj: unknown, eventType: string): string {
	if (eventType === "checkout.session.completed") {
		const session = rawObj as { payment_status?: string; status?: string } | null;
		if (session?.payment_status === "paid" || session?.payment_status === "no_payment_required")
			return "paid";
		if (session?.payment_status === "unpaid") return "processing";
		return session?.status || "completed";
	}

	if (eventType.startsWith("charge.dispute.")) {
		const dispute = rawObj as { status?: string } | null;
		return normalizeDisputeStatus(dispute?.status);
	}

	const mappedStatus = mapStripeEventTypeToStatus(eventType);
	if (mappedStatus !== eventType) return mappedStatus;

	if (
		rawObj &&
		typeof rawObj === "object" &&
		("status" in rawObj || "payment_status" in rawObj) &&
		(typeof (rawObj as Record<string, unknown>).status === "string" ||
			typeof (rawObj as Record<string, unknown>).payment_status === "string")
	) {
		const record = rawObj as { status?: string; payment_status?: string };
		return record.status || record.payment_status || mappedStatus;
	}

	return mappedStatus;
}

export function mapStripeEventTypeToStatus(eventType: string): string {
	const map: Record<string, string> = {
		"checkout.session.completed": "paid",
		"checkout.session.async_payment_succeeded": "paid",
		"checkout.session.async_payment_failed": "failed",
		"checkout.session.expired": "expired",
		"payment_intent.succeeded": "succeeded",
		"payment_intent.payment_failed": "failed",
		"payment_intent.canceled": "canceled",
		"payment_intent.processing": "processing",
		"payment_intent.requires_action": "requires_action",
		"invoice.paid": "paid",
		"invoice.payment_failed": "failed",
		"invoice.finalized": "finalized",
		"invoice.voided": "voided",
		"invoice.marked_uncollectible": "uncollectible",
		"charge.succeeded": "succeeded",
		"charge.failed": "failed",
		"charge.refunded": "refunded",
		"refund.succeeded": "refunded",
		"refund.updated": "refund_updated",
		"customer.subscription.created": "created",
		"customer.subscription.updated": "updated",
		"customer.subscription.deleted": "canceled",
		"customer.subscription.pending_update_applied": "updated",
		"customer.subscription.pending_update_expired": "expired",
	};
	return map[eventType] || eventType;
}

export function extractStripeEventContext(event: Stripe.Event): ExtractedStripeEventContext {
	const objUnknown = event.data.object as unknown;
	const raw: Record<string, unknown> =
		objUnknown && typeof objUnknown === "object" ? (objUnknown as Record<string, unknown>) : {};
	let userId: string | null = null;
	const metadataVal = raw.metadata;
	if (metadataVal && typeof metadataVal === "object") {
		const userVal = (metadataVal as Record<string, unknown>).userId;
		if (typeof userVal === "string") userId = userVal;
	}

	const related: ExtractedStripeEventContext["related"] = {};
	let rootId: string | null = null;
	let kind = "unknown";

	const getString = (key: string): string | null => {
		const value = raw[key];
		return typeof value === "string" ? value : null;
	};

	if (event.type.startsWith("checkout.session")) {
		kind = "checkout.session";
		rootId = getString("id");
		if (rootId) related.sessionId = rootId;
		const paymentIntentId = getString("payment_intent");
		if (paymentIntentId) related.paymentIntentId = paymentIntentId;
		const subscriptionId = getString("subscription");
		if (subscriptionId) related.subscriptionId = subscriptionId;
	} else if (event.type.startsWith("payment_intent")) {
		kind = "payment_intent";
		rootId = getString("id");
		if (rootId) related.paymentIntentId = rootId;
		const chargesVal = raw.charges;
		if (chargesVal && typeof chargesVal === "object") {
			const dataArr = (chargesVal as Record<string, unknown>).data as unknown;
			if (Array.isArray(dataArr) && dataArr.length > 0) {
				const first = dataArr[0];
				if (first && typeof first === "object" && typeof (first as { id?: unknown }).id === "string") {
					related.chargeId = (first as { id: string }).id;
				}
			}
		}
	} else if (event.type.startsWith("invoice")) {
		kind = "invoice";
		rootId = getString("id");
		if (rootId) related.invoiceId = rootId;
		const subscriptionId = getString("subscription");
		if (subscriptionId) related.subscriptionId = subscriptionId;
		const paymentIntentId = getString("payment_intent");
		if (paymentIntentId) related.paymentIntentId = paymentIntentId;
	} else if (event.type.startsWith("customer.subscription")) {
		kind = "subscription";
		rootId = getString("id");
		if (rootId) related.subscriptionId = rootId;
	} else if (event.type.startsWith("charge.dispute.")) {
		kind = "dispute";
		const disputeId = getString("id");
		const paymentIntentId = getString("payment_intent");
		const chargeId = getString("charge");
		rootId = paymentIntentId || chargeId || disputeId;
		if (disputeId) related.disputeId = disputeId;
		if (paymentIntentId) related.paymentIntentId = paymentIntentId;
		if (chargeId) related.chargeId = chargeId;
	} else if (event.type.startsWith("charge.")) {
		kind = "charge";
		const paymentIntentId = getString("payment_intent");
		rootId = paymentIntentId || getString("id");
		const chargeId = getString("id");
		if (chargeId) related.chargeId = chargeId;
		if (paymentIntentId) related.paymentIntentId = paymentIntentId;
	} else if (event.type.startsWith("refund.")) {
		kind = "refund";
		const paymentIntentId = getString("payment_intent");
		rootId = paymentIntentId || getString("id");
		const refundId = getString("id");
		if (refundId) related.refundId = refundId;
		if (paymentIntentId) related.paymentIntentId = paymentIntentId;
		const chargeId = getString("charge");
		if (chargeId) related.chargeId = chargeId;
	}

	return { userId, rootId, kind, related };
}

function normalizeDisputeStatus(status?: string | null) {
	switch (status) {
		case "warning_needs_response":
		case "warning_under_review":
		case "needs_response":
		case "under_review":
			return "disputed";
		case "warning_closed":
		case "won":
			return "won";
		case "lost":
			return "lost";
		default:
			return "disputed";
	}
}
