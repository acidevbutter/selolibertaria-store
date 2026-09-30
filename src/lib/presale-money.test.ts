import { describe, expect, it } from "vitest";
import { centsToReais, reaisToCents } from "./presale-money";

describe("presale money units", () => {
	it("reads the catalog's centavos as reais", () => {
		expect(centsToReais(4990)).toBe(49.9);
		expect(centsToReais("5760")).toBe(57.6);
		expect(centsToReais(500)).toBe(5);
	});

	it("writes what the editor typed in reais as centavos, without float drift", () => {
		expect(reaisToCents(39.9)).toBe(3990);
		expect(reaisToCents(57.6)).toBe(5760);
		expect(reaisToCents("49.90")).toBe(4990);
		expect(reaisToCents(0.29)).toBe(29);
		expect(reaisToCents(1.005)).toBe(101);
	});

	it("round-trips", () => {
		for (const cents of [0, 1, 99, 500, 4990, 5800, 123456])
			expect(reaisToCents(centsToReais(cents))).toBe(cents);
	});

	it("never yields NaN for missing or invalid input", () => {
		expect(centsToReais(undefined)).toBe(0);
		expect(centsToReais("abc")).toBe(0);
		expect(reaisToCents(null)).toBe(0);
		expect(reaisToCents(Number.NaN)).toBe(0);
	});
});
