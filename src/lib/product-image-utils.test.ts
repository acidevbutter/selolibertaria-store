import { describe, expect, it } from "vitest";
import {
	filterRenderableProductImages,
	getProductImageOptimizationProps,
	isButterBlobPublicUrl,
	isLegacyHostedImageUrl,
} from "@/lib/product-image-utils";

const legacyCloudfront = "https://d1wqzb5bdbcre6.cloudfront.net/product.jpg";
const butterBlobPublic = "http://localhost:8003/v1/public/selolibertaria/slug";
const cloudinary = "https://res.cloudinary.com/demo/image/upload/v1/product.jpg";

describe("product-image-utils", () => {
	it("detects legacy CloudFront and butter_blob public URLs", () => {
		expect(isLegacyHostedImageUrl(legacyCloudfront)).toBe(true);
		expect(isButterBlobPublicUrl(butterBlobPublic)).toBe(true);
		expect(isButterBlobPublicUrl(cloudinary)).toBe(false);
		expect(isButterBlobPublicUrl("not-a-url")).toBe(false);
	});

	it("disables next/image optimization for legacy and butter_blob public URLs", () => {
		expect(getProductImageOptimizationProps(legacyCloudfront).unoptimized).toBe(true);
		expect(getProductImageOptimizationProps(butterBlobPublic).unoptimized).toBe(true);
		expect(getProductImageOptimizationProps(cloudinary).unoptimized).toBe(false);
	});

	it("filters only legacy CloudFront URLs from product galleries", () => {
		expect(filterRenderableProductImages([legacyCloudfront, butterBlobPublic, cloudinary, ""])).toEqual([
			butterBlobPublic,
			cloudinary,
		]);
	});
});
