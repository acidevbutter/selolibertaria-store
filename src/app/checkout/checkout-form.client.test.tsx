import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CheckoutForm } from "@/app/checkout/checkout-form.client";
import { IntlClientProvider } from "@/i18n/client";
import enMessages from "../../../messages/en-US.json";

const {
	replaceMock,
	confirmPaymentMock,
	updatePaymentMethodSavingPreferenceMock,
	updateCheckoutDeliverySelectionMock,
} = vi.hoisted(() => ({
	replaceMock: vi.fn(),
	confirmPaymentMock: vi.fn(),
	updatePaymentMethodSavingPreferenceMock: vi.fn(),
	updateCheckoutDeliverySelectionMock: vi.fn(),
}));

class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		replace: replaceMock,
	}),
}));

vi.mock("@stripe/stripe-js", () => ({
	loadStripe: vi.fn().mockResolvedValue(null),
}));

vi.mock("@stripe/react-stripe-js", () => ({
	Elements: ({ children }: { children: unknown }) => children,
	PaymentElement: () => <div data-testid="payment-element">payment-element</div>,
	useStripe: () => ({
		confirmPayment: confirmPaymentMock,
	}),
	useElements: () => ({}),
}));

vi.mock("@/actions/checkout-actions", () => ({
	updatePaymentMethodSavingPreference: updatePaymentMethodSavingPreferenceMock,
	updateCheckoutDeliverySelection: updateCheckoutDeliverySelectionMock,
}));

describe("CheckoutForm", () => {
	beforeEach(() => {
		replaceMock.mockReset();
		confirmPaymentMock.mockReset();
		updatePaymentMethodSavingPreferenceMock.mockReset();
		updateCheckoutDeliverySelectionMock.mockReset();
		updatePaymentMethodSavingPreferenceMock.mockResolvedValue({ ok: true });
		updateCheckoutDeliverySelectionMock.mockResolvedValue({
			ok: true,
			orderId: "ord_123",
			paymentIntentId: "pi_123",
			deliveryMethod: "saved-address",
			deliveryAddress: {
				line1: "Rua Teste",
				line2: null,
				number: "123",
				complement: null,
				district: "Centro",
				city: "São Paulo",
				state: "SP",
				postalCode: "01000-000",
				country: "BR",
			},
			shippingRate: {
				providerCode: "correios",
				providerLabel: "Correios",
				serviceCode: "SEDEX",
				serviceName: "SEDEX",
				fixed_amount: { amount: 2500 },
				currency: "USD",
				estimated_days: 3,
			},
			shippingError: null,
			subtotal: 1000,
			discountTotal: 0,
			amountTotal: 3500,
			currency: "USD",
		});
		globalThis.ResizeObserver = ResizeObserverMock;
		window.history.replaceState({}, "", "/checkout");
	});

	it("confirma o pagamento com um método salvo selecionado", async () => {
		confirmPaymentMock.mockResolvedValue({
			paymentIntent: {
				status: "succeeded",
			},
		});

		render(
			<IntlClientProvider locale="en-US" messages={enMessages}>
				<CheckoutForm
					locale="en-US"
					checkout={{
						publishableKey: "pk_test_123",
						clientSecret: "pi_123_secret_abc",
						orderId: "ord_123",
						paymentIntentId: "pi_123",
						subtotal: 1000,
						discountTotal: 0,
						amountTotal: 1000,
						currency: "USD",
						items: [],
						couponCode: null,
						shippingRate: {
							providerCode: "pickup",
							providerLabel: "Store pickup",
							serviceCode: "pickup",
							serviceName: "Pick up at the store",
							fixed_amount: { amount: 0 },
							currency: "USD",
							estimated_days: 1,
						},
						shippingError: null,
						deliveryMethod: "pickup",
						deliveryAddress: null,
						canSavePaymentMethod: true,
						savePaymentMethod: false,
						savedPaymentMethods: [
							{
								id: "pm_123",
								type: "card",
								billingDetails: {
									name: "Teste",
									email: "teste@example.com",
								},
								card: {
									brand: "visa",
									last4: "4242",
									expMonth: 12,
									expYear: 2030,
								},
								created: 1,
							},
						],
					}}
				/>
			</IntlClientProvider>,
		);

		fireEvent.click(screen.getByRole("radio", { name: /Visa ending in 4242/i }));
		fireEvent.click(screen.getByRole("button", { name: /Pay with saved card/i }));

		await waitFor(() => {
			expect(updatePaymentMethodSavingPreferenceMock).toHaveBeenCalledWith({
				paymentIntentId: "pi_123",
				savePaymentMethod: false,
			});
		});

		await waitFor(() => {
			expect(confirmPaymentMock).toHaveBeenCalledWith({
				clientSecret: "pi_123_secret_abc",
				confirmParams: {
					return_url: "http://localhost:3000/checkout/return?order=ord_123",
					payment_method: "pm_123",
				},
				redirect: "if_required",
			});
		});

		await waitFor(() => {
			expect(replaceMock).toHaveBeenCalledWith("/checkout/processing?order=ord_123");
		});
	});
});
