import { describe, expect, it } from "vitest";
import { formatBRL, formatShortDate, presaleDiscountPercent } from "@/lib/presales";

describe("presaleDiscountPercent", () => {
	it("computes the rounded discount percentage", () => {
		expect(presaleDiscountPercent(72, 57.6)).toBe(20);
		expect(presaleDiscountPercent(72, 64.8)).toBe(10);
		expect(presaleDiscountPercent(72, 54)).toBe(25);
	});

	it("is 0% when the presale price equals the full price", () => {
		expect(presaleDiscountPercent(72, 72)).toBe(0);
	});

	it("falls back to 0 for an invalid (non-positive) full price", () => {
		expect(presaleDiscountPercent(0, 50)).toBe(0);
		expect(presaleDiscountPercent(-10, 50)).toBe(0);
	});
});

describe("formatBRL", () => {
	it("formats with comma decimal separator and two digits", () => {
		expect(formatBRL(57.6)).toBe("R$ 57,60");
		expect(formatBRL(100)).toBe("R$ 100,00");
	});
});

describe("formatShortDate", () => {
	it("formats as dd/mm", () => {
		expect(formatShortDate("2026-10-14T19:00:00Z")).toMatch(/^\d{2}\/\d{2}$/);
	});

	it("returns an em dash for an invalid date", () => {
		expect(formatShortDate("not-a-date")).toBe("—");
	});
});
