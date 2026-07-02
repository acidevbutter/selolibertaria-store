import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAuthMock = vi.fn();
const resolveCheckoutUserForDraftMock = vi.fn();
const createPersistentSessionMock = vi.fn();
const ensureOrderReceivedEmailMock = vi.fn();
const orderDraftFindOneMock = vi.fn();
const orderDraftUpdateOneMock = vi.fn();
const usersFindOneMock = vi.fn();
const usersUpdateOneMock = vi.fn();
const paymentIntentRetrieveMock = vi.fn();

vi.mock("@/env.mjs", () => ({
	env: {
		STRIPE_SECRET_KEY: "sk_test_123",
		STRIPE_CURRENCY: "BRL",
	},
}));

vi.mock("stripe", () => ({
	default: vi.fn(function Stripe() {
		return {
			paymentIntents: {
				retrieve: paymentIntentRetrieveMock,
			},
		};
	}),
}));

vi.mock("@/lib/api-auth", () => ({
	requireAuth: () => requireAuthMock(),
}));

vi.mock("@/lib/authz", () => ({
	canBuyOnSelolibertaria: () => true,
	normalizeUserRole: (role?: string) => role ?? "customer",
}));

vi.mock("@/lib/cart-cookies", () => ({
	clearCartId: vi.fn(),
	getCartId: vi.fn(),
}));

vi.mock("@/lib/checkout-customer", () => ({
	resolveCheckoutUserForDraft: (...args: unknown[]) => resolveCheckoutUserForDraftMock(...args),
}));

vi.mock("@/lib/commerce-stripe", () => ({
	commerce: {
		cart: {
			clear: vi.fn(),
		},
	},
}));

vi.mock("@/lib/mongodb", () => ({
	getDb: async () => ({
		collection: (name: string) => {
			if (name === "orderDrafts") {
				return {
					findOne: orderDraftFindOneMock,
					updateOne: orderDraftUpdateOneMock,
				};
			}

			return {
				findOne: usersFindOneMock,
				updateOne: usersUpdateOneMock,
			};
		},
	}),
}));

vi.mock("@/lib/order-received", () => ({
	ensureOrderReceivedEmail: (...args: unknown[]) => ensureOrderReceivedEmailMock(...args),
}));

vi.mock("@/lib/session", () => ({
	createPersistentSession: (...args: unknown[]) => createPersistentSessionMock(...args),
}));

describe("recordPaymentIntentCheckout", () => {
	const userId = "507f1f77bcf86cd799439011";
	const draft = {
		orderId: "ord_guest_123",
		paymentIntentId: "pi_123",
		status: "open",
		amountTotal: 4200,
		currency: "BRL",
		buyer: {
			fullName: "Leitora Teste",
			email: "leitora@example.com",
			cpf: "39053344705",
			phone: "11999999999",
		},
		items: [
			{
				name: "Livro Teste",
				quantity: 1,
				unitAmount: 4200,
				priceId: "price_123",
				productId: "prod_123",
				image: null,
			},
		],
		deliveryMethod: "pickup" as const,
		deliveryAddress: null,
		shippingRate: null,
	};

	beforeEach(() => {
		requireAuthMock.mockReset();
		resolveCheckoutUserForDraftMock.mockReset();
		createPersistentSessionMock.mockReset();
		ensureOrderReceivedEmailMock.mockReset();
		orderDraftFindOneMock.mockReset();
		orderDraftUpdateOneMock.mockReset();
		usersFindOneMock.mockReset();
		usersUpdateOneMock.mockReset();
		paymentIntentRetrieveMock.mockReset();
		vi.resetModules();

		requireAuthMock.mockResolvedValue({ error: "not_authenticated" });
		resolveCheckoutUserForDraftMock.mockResolvedValue({ userId, created: true });
		createPersistentSessionMock.mockResolvedValue({
			sid: "sid_123",
			jwt: "jwt_123",
			expires: Date.now() + 1000,
		});
		ensureOrderReceivedEmailMock.mockResolvedValue(true);
		orderDraftFindOneMock.mockImplementation(
			async (filter: { orderId?: string; paymentIntentId?: string }) => {
				if (filter.orderId === draft.orderId || filter.paymentIntentId === draft.paymentIntentId) {
					return draft;
				}
				return null;
			},
		);
		orderDraftUpdateOneMock.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
		usersFindOneMock.mockImplementation(
			async (_filter: unknown, options?: { projection?: Record<string, number> }) => {
				if (options?.projection?.email) {
					return {
						_id: { toHexString: () => userId },
						email: "leitora@example.com",
						name: "Leitora Teste",
						role: "customer",
					};
				}

				return { purchases: [] };
			},
		);
		usersUpdateOneMock.mockResolvedValue({ matchedCount: 0, modifiedCount: 1 });
		paymentIntentRetrieveMock.mockResolvedValue({
			id: "pi_123",
			status: "succeeded",
			amount: 4200,
			currency: "brl",
			latest_charge: { id: "ch_123" },
			metadata: { orderId: draft.orderId },
		});
	});

	it("hydrates guest checkout into a user session without dropping the purchase", async () => {
		const { recordPaymentIntentCheckout } = await import("@/actions/order-actions");

		const result = await recordPaymentIntentCheckout({
			paymentIntentId: "pi_123",
			orderId: draft.orderId,
		});

		expect(result).toMatchObject({
			ok: true,
			status: "succeeded",
			cartCleared: true,
			setupPasswordRequired: true,
		});
		expect(resolveCheckoutUserForDraftMock).toHaveBeenCalledWith(
			expect.objectContaining({
				orderId: draft.orderId,
				buyer: expect.objectContaining({ email: "leitora@example.com" }),
			}),
		);
		expect(createPersistentSessionMock).toHaveBeenCalledWith(
			expect.objectContaining({
				id: userId,
				email: "leitora@example.com",
			}),
		);
		expect(ensureOrderReceivedEmailMock).toHaveBeenCalledWith(userId, draft.orderId);

		const orderDraftUserLinkCall = orderDraftUpdateOneMock.mock.calls.find(([, update]) =>
			Boolean((update as { $set?: { userId?: string } }).$set?.userId),
		);
		expect(orderDraftUserLinkCall).toBeTruthy();
		expect(orderDraftUserLinkCall?.[1]).toMatchObject({
			$set: expect.objectContaining({ userId }),
		});
	});
});
