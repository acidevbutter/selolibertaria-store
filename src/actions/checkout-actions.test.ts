import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getCheckoutSnapshot: vi.fn(),
	getDb: vi.fn(),
	retrieveCheckoutOrder: vi.fn(),
	resolveCheckoutUserForDraft: vi.fn(),
	auth: vi.fn(),
	createPersistentSession: vi.fn(),
}));

vi.mock("@/env.mjs", () => ({ env: { JWT_SECRET: "test-secret" } }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/checkout/cart-snapshot", () => ({ getCheckoutSnapshot: mocks.getCheckoutSnapshot }));
vi.mock("@/lib/checkout-customer", () => ({
	resolveCheckoutUserForDraft: mocks.resolveCheckoutUserForDraft,
}));
vi.mock("@/lib/mercado-pago-orders/checkout", () => ({
	createCheckoutOrder: vi.fn(),
	retrieveCheckoutOrder: mocks.retrieveCheckoutOrder,
}));
vi.mock("@/lib/mercado-pago", () => ({
	addMercadoPagoCustomerCard: vi.fn(),
	createMercadoPagoCustomer: vi.fn(),
	isMercadoPagoPixPayment: vi.fn(),
	listMercadoPagoCustomerCards: vi.fn(),
	mapMercadoPagoSavedCard: vi.fn(),
	removeMercadoPagoCustomerCard: vi.fn(),
	retrieveMercadoPagoCustomerCard: vi.fn(),
}));
vi.mock("@/lib/mercado-pago-orders/card", () => ({ getMaxCardInstallments: vi.fn() }));
vi.mock("@/lib/mongodb", () => ({ getDb: mocks.getDb }));
vi.mock("@/lib/session", () => ({
	auth: mocks.auth,
	createPersistentSession: mocks.createPersistentSession,
}));

describe("continuePendingMercadoPagoPixCheckout", () => {
	beforeEach(() => {
		vi.resetModules();
		Object.values(mocks).forEach((mock) => mock.mockReset());
	});

	it("vincula a conta e cria uma sessão uma vez sem aprovar o Pix", async () => {
		const draft = {
			orderId: "ord_123",
			checkoutOwnerKey: "owner",
			paymentProvider: "mercado_pago" as const,
			mercadoPagoOrderId: "mp_123",
			status: "processing",
			cartHash: "cart",
			amountTotal: 4200,
			currency: "BRL",
			items: [],
			buyer: {
				fullName: "Pessoa Leitora",
				email: "leitora@selo.test",
				cpf: "12345678909",
				phone: "11999999999",
			},
		};
		const draftUpdates = vi.fn().mockResolvedValue({ matchedCount: 1 });
		const users = {
			findOne: vi.fn().mockResolvedValue({
				_id: { toHexString: () => "507f1f77bcf86cd799439011" },
				email: "leitora@selo.test",
				name: "Pessoa Leitora",
				role: "customer",
			}),
		};
		mocks.getDb.mockResolvedValue({
			collection: (name: string) =>
				name === "orderDrafts"
					? { findOne: vi.fn().mockResolvedValue(draft), updateOne: draftUpdates }
					: users,
		});
		mocks.getCheckoutSnapshot.mockResolvedValue({ ok: true, snapshot: { checkoutOwnerKey: "owner" } });
		mocks.retrieveCheckoutOrder.mockResolvedValue({
			providerOrderId: "mp_123",
			status: "processing",
			providerStatus: "pending",
			transaction: { id: "tx_123" },
			pix: { qrCode: "secret" },
		});
		mocks.resolveCheckoutUserForDraft.mockResolvedValue({
			userId: "507f1f77bcf86cd799439011",
			created: true,
		});
		mocks.auth.mockResolvedValue(null);
		mocks.createPersistentSession.mockImplementation(async () => {
			mocks.auth.mockResolvedValue({ user: { id: "507f1f77bcf86cd799439011" } });
		});

		const { continuePendingMercadoPagoPixCheckout } = await import("@/actions/checkout-actions");
		await expect(continuePendingMercadoPagoPixCheckout({ orderId: "ord_123" })).resolves.toEqual({
			ok: true,
			redirectUrl: "/user?section=purchases&order=ord_123&pendingPayment=1&setupPassword=1",
		});
		await expect(continuePendingMercadoPagoPixCheckout({ orderId: "ord_123" })).resolves.toMatchObject({
			ok: true,
		});
		expect(mocks.resolveCheckoutUserForDraft).toHaveBeenCalledTimes(2);
		expect(mocks.createPersistentSession).toHaveBeenCalledTimes(1);
		expect(draftUpdates).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				$set: expect.objectContaining({ status: "processing", userId: "507f1f77bcf86cd799439011" }),
			}),
		);
	});
});
