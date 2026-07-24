import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAuthMock = vi.fn();
const mergeGuestCartIntoUserMock = vi.fn();

vi.mock("@/lib/api-auth", () => ({
	requireAuth: () => requireAuthMock(),
}));

vi.mock("@/actions/cart-actions", () => ({
	mergeGuestCartIntoUser: () => mergeGuestCartIntoUserMock(),
}));

import { GET } from "@/app/checkout/prepare/route";

describe("/checkout/prepare", () => {
	beforeEach(() => {
		requireAuthMock.mockReset();
		mergeGuestCartIntoUserMock.mockReset();
	});

	it("preserva a origem atual ao redirecionar o checkout convidado", async () => {
		requireAuthMock.mockResolvedValue({ error: { status: 401 } });

		const response = await GET(new Request("http://192.168.15.6:3001/checkout/prepare"));

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toBe("/checkout?prepared=1");
		expect(mergeGuestCartIntoUserMock).not.toHaveBeenCalled();
	});
});
