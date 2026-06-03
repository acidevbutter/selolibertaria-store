export function isSuccessLikeCheckoutStatus(status: string | null) {
	if (!status) return false;
	const normalized = status.toLowerCase();
	return normalized === "success" || normalized === "succeeded" || normalized === "processing";
}
