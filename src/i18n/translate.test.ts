import { describe, expect, it } from "vitest";
import { getMessagesInternal } from "./translate";

describe("getMessagesInternal", () => {
	it("falls back to the message key when the translation is missing", () => {
		const t = getMessagesInternal("/order.paymentStatus", "pt-BR", {
			"/order.paymentStatus.paid": "Pago",
		} as IntlMessages);

		expect(t("disputed" as never)).toBe("disputed");
	});

	it("formats translated strings normally when the key exists", () => {
		const t = getMessagesInternal("Checkout.processing", "pt-BR", {
			"Checkout.processing.redirectSoon": "Você será redirecionada em instantes.",
		} as IntlMessages);

		expect(t("redirectSoon" as never)).toBe("Você será redirecionada em instantes.");
	});
});
