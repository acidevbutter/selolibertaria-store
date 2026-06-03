const DISPUTE_RELATED_STATUSES = new Set([
	"disputed",
	"under_review",
	"warning_under_review",
	"needs_response",
	"warning_needs_response",
	"warning_closed",
	"won",
	"lost",
]);

export const PROCESSING_RELATED_STATUSES = new Set(["processing", "pending", "open", "unpaid"]);

export const AWAITING_ACTION_STATUSES = new Set([
	"requires_action",
	"requires_capture",
	"requires_confirmation",
	"requires_payment_method",
]);

export function getDisputeRelatedStatuses() {
	return Array.from(DISPUTE_RELATED_STATUSES);
}

export function normalizeDisplayPaymentStatus(status?: string | null) {
	const normalized = status?.trim().toLowerCase() ?? "";
	if (DISPUTE_RELATED_STATUSES.has(normalized)) {
		if (normalized === "warning_closed") return "won";
		if (
			normalized === "under_review" ||
			normalized === "warning_under_review" ||
			normalized === "needs_response" ||
			normalized === "warning_needs_response"
		) {
			return "disputed";
		}
	}
	return normalized;
}
