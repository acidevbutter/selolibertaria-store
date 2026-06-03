import { describe, expect, it } from "vitest";
import { getClientVisiblePaymentIntentStatus } from "./payment-intent-status";
import {
	isFinalizedPaymentStatus,
	isOrderReceivedEligibleStatus,
	isResolvedCheckoutStatus,
	isWarningCheckoutStatus,
	shouldPreserveAuthoritativePurchaseStatus,
} from "./payment-status";

describe("payment-intent-status", () => {
	it("mantém o status confirmado visível para o navegador", () => {
		expect(getClientVisiblePaymentIntentStatus("succeeded")).toBe("succeeded");
		expect(getClientVisiblePaymentIntentStatus("processing")).toBe("processing");
	});

	it("preserva estados que ainda exigem ação do cliente", () => {
		expect(getClientVisiblePaymentIntentStatus("requires_payment_method")).toBe("requires_payment_method");
		expect(getClientVisiblePaymentIntentStatus("requires_action")).toBe("requires_action");
	});

	it("reconhece estados já confirmados pelo servidor", () => {
		expect(isFinalizedPaymentStatus("paid")).toBe(true);
		expect(isFinalizedPaymentStatus("succeeded")).toBe(true);
		expect(isFinalizedPaymentStatus("processing")).toBe(false);
		expect(isOrderReceivedEligibleStatus("processing")).toBe(true);
		expect(isResolvedCheckoutStatus("received")).toBe(true);
		expect(isResolvedCheckoutStatus("shipped")).toBe(true);
		expect(isWarningCheckoutStatus("disputed")).toBe(true);
		expect(isWarningCheckoutStatus("lost")).toBe(true);
		expect(shouldPreserveAuthoritativePurchaseStatus("disputed")).toBe(true);
		expect(shouldPreserveAuthoritativePurchaseStatus("failed")).toBe(false);
	});
});
