import { describe, expect, it } from "vitest";
import { isSuccessLikeCheckoutStatus } from "./checkout-processing-status";

describe("checkout-processing-status", () => {
	it("treats success-like return params as non-error fallback states", () => {
		expect(isSuccessLikeCheckoutStatus("success")).toBe(true);
		expect(isSuccessLikeCheckoutStatus("succeeded")).toBe(true);
		expect(isSuccessLikeCheckoutStatus("processing")).toBe(true);
	});

	it("rejects non-success-like return params", () => {
		expect(isSuccessLikeCheckoutStatus("failed")).toBe(false);
		expect(isSuccessLikeCheckoutStatus("cancel")).toBe(false);
		expect(isSuccessLikeCheckoutStatus(null)).toBe(false);
	});
});
