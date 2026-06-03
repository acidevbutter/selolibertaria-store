const FINALIZED_PAYMENT_STATUSES = new Set(["paid", "succeeded", "no_payment_required"]);
const ORDER_RECEIVED_ELIGIBLE_STATUSES = new Set(["processing", "paid", "succeeded", "no_payment_required"]);
const CHECKOUT_RESOLVED_STATUSES = new Set([
	...FINALIZED_PAYMENT_STATUSES,
	"received",
	"producing",
	"shipped",
]);
const CHECKOUT_WARNING_STATUSES = new Set(["disputed", "won", "lost"]);
const AUTHORITATIVE_PURCHASE_STATUSES = new Set([
	"paid",
	"succeeded",
	"no_payment_required",
	"refunded",
	"disputed",
	"won",
	"lost",
	"received",
	"producing",
	"shipped",
]);

export function normalizePaymentStatus(status?: string | null) {
	return status?.trim().toLowerCase() ?? "";
}

export function isFinalizedPaymentStatus(status?: string | null) {
	return FINALIZED_PAYMENT_STATUSES.has(normalizePaymentStatus(status));
}

export function isOrderReceivedEligibleStatus(status?: string | null) {
	return ORDER_RECEIVED_ELIGIBLE_STATUSES.has(normalizePaymentStatus(status));
}

export function isResolvedCheckoutStatus(status?: string | null) {
	return CHECKOUT_RESOLVED_STATUSES.has(normalizePaymentStatus(status));
}

export function isWarningCheckoutStatus(status?: string | null) {
	return CHECKOUT_WARNING_STATUSES.has(normalizePaymentStatus(status));
}

export function shouldPreserveAuthoritativePurchaseStatus(status?: string | null) {
	return AUTHORITATIVE_PURCHASE_STATUSES.has(normalizePaymentStatus(status));
}
