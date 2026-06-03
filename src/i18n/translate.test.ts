import { describe, expect, it } from "vitest";
import { getMessagesInternal } from "./translate";

describe("getMessagesInternal", () => {
	it("falls back to the message key when the translation is missing", () => {
		const t = getMessagesInternal("/order.paymentStatus", "en-US", {
			"/order.paymentStatus.paid": "Paid",
		} as IntlMessages);

		expect(t("disputed" as never)).toBe("disputed");
	});

	it("formats translated strings normally when the key exists", () => {
		const t = getMessagesInternal("Checkout.processing", "en-US", {
			"Checkout.processing.redirectSoon": "You will be redirected shortly.",
		} as IntlMessages);

		expect(t("redirectSoon" as never)).toBe("You will be redirected shortly.");
	});
});
