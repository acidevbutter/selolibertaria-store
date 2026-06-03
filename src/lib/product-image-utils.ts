export function isStripeHostedImageUrl(src: string) {
	try {
		const hostname = new URL(src).hostname;
		return hostname === "files.stripe.com" || hostname === "d1wqzb5bdbcre6.cloudfront.net";
	} catch {
		return false;
	}
}

export function getProductImageOptimizationProps(src: string) {
	return {
		unoptimized: isStripeHostedImageUrl(src),
	};
}

export function filterRenderableProductImages(images: string[] | null | undefined) {
	return (images ?? []).filter((src) => src && !isStripeHostedImageUrl(src));
}
