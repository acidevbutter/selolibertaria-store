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

	it("reuses the account found by CPF/CNPJ without creating a duplicate", async () => {
		const userId = "507f1f77bcf86cd799439011";
		usersFindOneMock.mockResolvedValueOnce(null).mockResolvedValueOnce({
			_id: { toHexString: () => userId },
			email: "leitora@example.com",
			cpf: "390.533.447-05",
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
	});

	it("creates a customer with a normalized document when no account exists", async () => {
		const userId = "507f1f77bcf86cd799439011";
		usersFindOneMock.mockResolvedValue(null);
		usersInsertOneMock.mockResolvedValue({ insertedId: { toHexString: () => userId } });

		const { resolveCheckoutUserForDraft } = await import("@/lib/checkout-customer");
		const result = await resolveCheckoutUserForDraft({
			orderId: "ord_123",
			buyer: {
				fullName: "Nova Leitora",
				email: "nova@example.com",
				cpf: "39053344705",
				phone: "11999999999",
			},
			deliveryAddress: null,
		});

		expect(result).toEqual({ userId, created: true });
		expect(usersInsertOneMock).toHaveBeenCalledWith(
			expect.objectContaining({ email: "nova@example.com", cpfNormalized: "39053344705" }),
		);
	});

	it("refuses conflicting e-mail and document identities", async () => {
		usersFindOneMock
			.mockResolvedValueOnce({
				_id: { toHexString: () => "507f1f77bcf86cd799439011" },
				email: "a@example.com",
			})
			.mockResolvedValueOnce({
				_id: { toHexString: () => "507f1f77bcf86cd799439012" },
				email: "b@example.com",
			});

		const { resolveCheckoutUserForDraft } = await import("@/lib/checkout-customer");
		await expect(
			resolveCheckoutUserForDraft({
				orderId: "ord_123",
				buyer: {
					fullName: "Leitora Existente",
					email: "a@example.com",
					cpf: "39053344705",
					phone: "11999999999",
				},
				deliveryAddress: null,
			}),
		).rejects.toThrow("contas diferentes");
		expect(usersInsertOneMock).not.toHaveBeenCalled();
	});
});
