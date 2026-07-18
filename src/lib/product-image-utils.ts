export function isLegacyHostedImageUrl(src: string) {
	try {
		const hostname = new URL(src).hostname;
		return hostname === "d1wqzb5bdbcre6.cloudfront.net";
	} catch {
		return false;
	}
}

export function getProductImageOptimizationProps(src: string) {
	return {
		unoptimized: isLegacyHostedImageUrl(src),
	};
}

export function filterRenderableProductImages(images: string[] | null | undefined) {
	return (images ?? []).filter((src) => src && !isLegacyHostedImageUrl(src));
}
