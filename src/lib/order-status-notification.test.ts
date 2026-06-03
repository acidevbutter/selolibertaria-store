import { describe, expect, it } from "vitest";
import {
	getCustomerOrderStatusContent,
	getCustomerOrderStatusKey,
	shouldNotifyCustomerOrderStatusChange,
} from "./order-status-notification";

describe("order-status-notification", () => {
	it("normaliza paid e succeeded para a mesma fase comunicável", () => {
		expect(getCustomerOrderStatusKey("paid")).toBe("payment_confirmed");
		expect(getCustomerOrderStatusKey("succeeded")).toBe("payment_confirmed");
		expect(shouldNotifyCustomerOrderStatusChange("paid", "succeeded")).toBe(false);
	});

	it("mantém transições reais de pagamento notificáveis", () => {
		expect(shouldNotifyCustomerOrderStatusChange("processing", "succeeded")).toBe(true);
		expect(shouldNotifyCustomerOrderStatusChange("succeeded", "refunded")).toBe(true);
		expect(shouldNotifyCustomerOrderStatusChange("processing", "failed")).toBe(true);
	});

	it("trata disputa como fase própria do pagamento", () => {
		expect(getCustomerOrderStatusKey("disputed")).toBe("payment_disputed");
		expect(getCustomerOrderStatusKey("won")).toBe("payment_dispute_resolved");
		expect(getCustomerOrderStatusKey("lost")).toBe("payment_dispute_lost");
		expect(shouldNotifyCustomerOrderStatusChange("succeeded", "disputed")).toBe(true);
	});

	it("reconhece fases de fulfillment separadamente", () => {
		expect(getCustomerOrderStatusKey("received")).toBe("fulfillment_received");
		expect(getCustomerOrderStatusKey("producing")).toBe("fulfillment_producing");
		expect(getCustomerOrderStatusKey("shipped")).toBe("fulfillment_shipped");
		expect(shouldNotifyCustomerOrderStatusChange("received", "producing")).toBe(true);
	});

	it("gera conteúdo com rastreio quando o pedido foi enviado", () => {
		const content = getCustomerOrderStatusContent({
			status: "shipped",
			trackingNumber: "BR123456789",
		});

		expect(content).not.toBeNull();
		expect(content?.kind).toBe("fulfillment");
		expect(content?.details).toContain("BR123456789");
	});
});
