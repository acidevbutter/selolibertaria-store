import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env.mjs", () => ({
	env: { FASTAPI_API_URL: "http://fastapi.test", FASTAPI_INTERNAL_API_KEY: "internal" },
}));

import { sendEmail } from "@/lib/email";

describe("sendEmail", () => {
	afterEach(() => vi.restoreAllMocks());

	it("queues delivery through FastAPI and Butter Relay metadata", async () => {
		const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
			new Response(JSON.stringify({ id: "communication-1", provider_message_id: "relay-1" }), {
				status: 201,
			}),
		);

		await expect(
			sendEmail({
				to: { name: "Leitora", address: "reader@example.com" },
				subject: "Compra confirmada",
				text: "Obrigada.",
				log: { template: "selolibertaria_purchase_completed", purchaseId: "ord_1" },
			}),
		).resolves.toMatchObject({ sent: true, communicationIds: ["communication-1"], messageId: "relay-1" });

		expect(fetchMock).toHaveBeenCalledWith(
			"http://fastapi.test/communications/send",
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({ "x-internal-api-key": "internal" }),
			}),
		);
		const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
		expect(request.template_key).toBe("selolibertaria_purchase_completed");
		expect(request.order_id).toBe("ord_1");
	});
});
