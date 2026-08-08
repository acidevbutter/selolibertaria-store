import { afterEach, describe, expect, it } from "vitest";
import { isMaintenanceModeEnabled } from "@/lib/maintenance-mode";

describe("isMaintenanceModeEnabled", () => {
	const original = process.env.MAINTENANCE_MODE;

	afterEach(() => {
		if (original === undefined) {
			delete process.env.MAINTENANCE_MODE;
		} else {
			process.env.MAINTENANCE_MODE = original;
		}
	});

	it("is off by default when unset", () => {
		delete process.env.MAINTENANCE_MODE;
		expect(isMaintenanceModeEnabled()).toBe(false);
	});

	it("is off for any value other than the literal string 'true'", () => {
		process.env.MAINTENANCE_MODE = "1";
		expect(isMaintenanceModeEnabled()).toBe(false);
	});

	it("is on when set to 'true'", () => {
		process.env.MAINTENANCE_MODE = "true";
		expect(isMaintenanceModeEnabled()).toBe(true);
	});
});
