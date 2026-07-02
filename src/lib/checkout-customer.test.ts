import { beforeEach, describe, expect, it, vi } from "vitest";

const usersFindOneMock = vi.fn();
const usersUpdateOneMock = vi.fn();
const usersInsertOneMock = vi.fn();

vi.mock("@/lib/mongodb", () => ({
	getDb: async () => ({
		collection: () => ({
			findOne: usersFindOneMock,
			updateOne: usersUpdateOneMock,
			insertOne: usersInsertOneMock,
		}),
	}),
}));

describe("resolveCheckoutUserForDraft", () => {
	beforeEach(() => {
		usersFindOneMock.mockReset();
		usersUpdateOneMock.mockReset();
		usersInsertOneMock.mockReset();
		vi.resetModules();
	});

	it("reuses existing email without creating duplicate user or overwriting password", async () => {
		const userId = "507f1f77bcf86cd799439011";
		usersFindOneMock.mockResolvedValue({
			_id: { toHexString: () => userId },
			email: "leitora@example.com",
			name: "Leitora Existente",
			cpf: "39053344705",
			phone: "11999999999",
			address: {
				line1: "Rua A",
				number: "10",
				city: "São Paulo",
				state: "SP",
				postalCode: "01000-000",
				country: "BR",
			},
			passwordHash: "bcrypt_hash",
		});
		usersUpdateOneMock.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

		const { resolveCheckoutUserForDraft } = await import("@/lib/checkout-customer");
		const result = await resolveCheckoutUserForDraft({
			orderId: "ord_123",
			buyer: {
				fullName: "Leitora Existente",
				email: "leitora@example.com",
				cpf: "39053344705",
				phone: "11999999999",
			},
			deliveryAddress: null,
		});

		expect(result).toEqual({ userId, created: false });
		expect(usersInsertOneMock).not.toHaveBeenCalled();
		expect(usersUpdateOneMock).toHaveBeenCalledTimes(1);
		const updateSet =
			(usersUpdateOneMock.mock.calls[0]?.[1] as { $set?: Record<string, unknown> }).$set ?? {};
		expect(updateSet).not.toHaveProperty("passwordHash");
	});
});
