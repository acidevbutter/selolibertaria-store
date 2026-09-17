const FINALIZED_PAYMENT_STATUSES = new Set(["paid", "succeeded", "no_payment_required"]);
const CHECKOUT_RESOLVED_STATUSES = new Set([
	...FINALIZED_PAYMENT_STATUSES,
	"received",
	"producing",
	"shipped",
]);
const CHECKOUT_WARNING_STATUSES = new Set(["disputed", "won", "lost"]);

export function normalizePaymentStatus(status?: string | null) {
	return status?.trim().toLowerCase() ?? "";
}

export function isResolvedCheckoutStatus(status?: string | null) {
	return CHECKOUT_RESOLVED_STATUSES.has(normalizePaymentStatus(status));
}

export function isWarningCheckoutStatus(status?: string | null) {
	return CHECKOUT_WARNING_STATUSES.has(normalizePaymentStatus(status));
}
