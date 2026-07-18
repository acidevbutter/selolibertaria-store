import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CheckoutForm } from "@/app/checkout/checkout-form.client";
import { IntlClientProvider } from "@/i18n/client";
import ptBrMessages from "../../../messages/pt-BR.json";

const {
	replaceMock,
	confirmPaymentMock,
	updateCheckoutBuyerDataMock,
	updatePaymentMethodSavingPreferenceMock,
	updateCheckoutDeliverySelectionMock,
} = vi.hoisted(() => ({
	replaceMock: vi.fn(),
	confirmPaymentMock: vi.fn(),
	updateCheckoutBuyerDataMock: vi.fn(),
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
	Elements: ({ children }: { children: React.ReactNode }) => children,
	PaymentElement: () => <div data-testid="payment-element">payment-element</div>,
	useStripe: () => ({
		confirmPayment: confirmPaymentMock,
	}),
	useElements: () => ({}),
}));

vi.mock("@/actions/checkout-actions", () => ({
	updateCheckoutBuyerData: updateCheckoutBuyerDataMock,
	updatePaymentMethodSavingPreference: updatePaymentMethodSavingPreferenceMock,
	updateCheckoutDeliverySelection: updateCheckoutDeliverySelectionMock,
}));

describe("CheckoutForm", () => {
	beforeEach(() => {
		replaceMock.mockReset();
		confirmPaymentMock.mockReset();
		updateCheckoutBuyerDataMock.mockReset();
		updatePaymentMethodSavingPreferenceMock.mockReset();
		updateCheckoutDeliverySelectionMock.mockReset();
		updateCheckoutBuyerDataMock.mockResolvedValue({
			ok: true,
			buyer: {
				fullName: "Pessoa Leitora",
				email: "leitora@selo.com",
				cpf: "12345678901",
				phone: "11999999999",
			},
		});
		updatePaymentMethodSavingPreferenceMock.mockResolvedValue({ ok: true });
		updateCheckoutDeliverySelectionMock.mockResolvedValue({
			ok: true,
			orderId: "ord_123",
			paymentIntentId: "pi_123",
			deliveryMethod: "pickup",
			deliveryAddress: null,
			shippingRate: null,
			shippingError: null,
			subtotal: 5000,
			discountTotal: 0,
			amountTotal: 5000,
			currency: "BRL",
		});
		vi.stubGlobal("ResizeObserver", ResizeObserverMock);
	});

	it("confirma o pagamento com um método salvo selecionado", async () => {
		confirmPaymentMock.mockResolvedValue({
			paymentIntent: {
				id: "pi_123",
				status: "succeeded",
			},
		});

		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<CheckoutForm
					locale="pt-BR"
					checkout={{
						publishableKey: "pk_test_123",
						clientSecret: "pi_client_secret_123",
						orderId: "ord_123",
						paymentIntentId: "pi_123",
						isAuthenticated: true,
						buyer: {
							fullName: "Pessoa Leitora",
							email: "leitora@selo.com",
							cpf: "12345678901",
							phone: "11999999999",
						},
						subtotal: 5000,
						discountTotal: 0,
						amountTotal: 5000,
						currency: "BRL",
						items: [],
						deliveryMethod: "pickup",
						deliveryAddress: null,
						canSavePaymentMethod: true,
						savePaymentMethod: false,
						savedPaymentMethods: [
							{
								id: "pm_saved",
								brand: "visa",
								last4: "4242",
								expMonth: 12,
								expYear: 2030,
							},
						],
					}}
				/>
			</IntlClientProvider>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Finalizar compra" }));

		await waitFor(() => {
			expect(updateCheckoutBuyerDataMock).toHaveBeenCalledTimes(1);
			expect(confirmPaymentMock).toHaveBeenCalledTimes(1);
			expect(replaceMock).toHaveBeenCalledWith(
				"/checkout/processing?order=ord_123&payment_intent=pi_123&guest=0",
			);
		});
	});
});
