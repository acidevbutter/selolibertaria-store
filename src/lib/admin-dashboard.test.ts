import { describe, expect, it } from "vitest";
import {
	classifyPaymentStatus,
	isPaidStatus,
	normalizeAdminPaymentStatus,
	resolveDashboardSince,
} from "./admin-dashboard";

describe("admin-dashboard status normalization", () => {
	it("normalizes dispute aliases into stable dashboard statuses", () => {
		expect(normalizeAdminPaymentStatus("under_review")).toBe("disputed");
		expect(normalizeAdminPaymentStatus("warning_under_review")).toBe("disputed");
		expect(normalizeAdminPaymentStatus("needs_response")).toBe("disputed");
		expect(normalizeAdminPaymentStatus("warning_needs_response")).toBe("disputed");
		expect(normalizeAdminPaymentStatus("warning_closed")).toBe("won");
	});

	it("classifies dispute and processing aliases into the expected funnel buckets", () => {
		expect(classifyPaymentStatus("under_review")).toBe("disputed");
		expect(classifyPaymentStatus("needs_response")).toBe("disputed");
		expect(classifyPaymentStatus("warning_closed")).toBe("disputed");
		expect(classifyPaymentStatus("open")).toBe("processing");
		expect(classifyPaymentStatus("unpaid")).toBe("processing");
	});

	it("preserves paid recognition for canonical paid states", () => {
		expect(isPaidStatus("paid")).toBe(true);
		expect(isPaidStatus("succeeded")).toBe(true);
		expect(isPaidStatus("no_payment_required")).toBe(true);
		expect(isPaidStatus("under_review")).toBe(false);
	});

	it("keeps period resolution stable", () => {
		const now = new Date("2026-05-28T12:00:00.000Z");
		expect(resolveDashboardSince("7d", now)?.toISOString()).toBe("2026-05-21T12:00:00.000Z");
		expect(resolveDashboardSince("all", now)).toBeNull();
	});
});
