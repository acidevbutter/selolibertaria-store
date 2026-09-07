import { describe, expect, it } from "vitest";
import { createInternalOrderId } from "@/lib/order-identity";

describe("createInternalOrderId", () => {
	it("generates an ord_ prefixed identifier", () => {
		expect(createInternalOrderId()).toMatch(/^ord_[a-f0-9]{32}$/);
	});
});
