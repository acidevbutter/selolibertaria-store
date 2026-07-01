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

vi.mock("@/ui/auth/address-fields.client", () => ({
	AddressFields: ({
		countryMode,
		onChange,
		onResolvedAddress,
	}: {
		countryMode?: string;
		onChange?: (value: Record<string, string>) => void;
		onResolvedAddress?: (value: Record<string, string>) => void;
	}) => {
		const resolvedAddress = {
			line1: "SQS 102 Bloco A",
			line2: "",
			number: "12",
			complement: "",
			district: "Asa Sul",
			city: "Brasilia",
			state: "DF",
			postalCode: "71015-210",
			country: "BR",
		};

		return (
			<div>
				<span data-testid="country-mode">{countryMode}</span>
				<button
					type="button"
					onClick={() => {
						onChange?.(resolvedAddress);
						onResolvedAddress?.(resolvedAddress);
					}}
				>
					Simular CEP
				</button>
			</div>
		);
	},
}));

const baseCheckout = {
	publishableKey: "pk_test_123",
	clientSecret: "pi_client_secret_123",
	orderId: "ord_123",
	paymentIntentId: "pi_123",
	isAuthenticated: true,
	buyer: {
		fullName: "Pessoa Leitora",
		email: "leitora@selo.com",
		cpf: "12345678909",
		phone: "11999999999",
	},
	subtotal: 5000,
	discountTotal: 0,
	amountTotal: 5000,
	currency: "BRL",
	items: [],
	deliveryMethod: "pickup" as const,
	deliveryAddress: null,
	canSavePaymentMethod: true,
	savePaymentMethod: false,
	savedPaymentMethods: [
		{
			id: "pm_saved",
			type: "card",
			billingDetails: {
				name: "Pessoa Leitora",
				email: "leitora@selo.com",
			},
			card: {
				brand: "visa",
				last4: "4242",
				expMonth: 12,
				expYear: 2030,
			},
			created: 1710000000,
		},
	],
};

function renderCheckout(override: Partial<typeof baseCheckout> = {}) {
	return render(
		<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
			<CheckoutForm locale="pt-BR" checkout={{ ...baseCheckout, ...override }} />
		</IntlClientProvider>,
	);
}

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
				cpf: "12345678909",
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

	it("confirma o pagamento com um metodo salvo selecionado", async () => {
		confirmPaymentMock.mockResolvedValue({
			paymentIntent: {
				id: "pi_123",
				status: "succeeded",
			},
		});

		renderCheckout();

		fireEvent.click(screen.getByRole("button", { name: "Finalizar compra" }));

		await waitFor(() => {
			expect(updateCheckoutBuyerDataMock).toHaveBeenCalledTimes(1);
			expect(confirmPaymentMock).toHaveBeenCalledTimes(1);
			expect(replaceMock).toHaveBeenCalledWith(
				"/checkout/processing?order=ord_123&payment_intent=pi_123&guest=0",
			);
		});
	});

	it("formata CPF e telefone no checkout", () => {
		renderCheckout();

		const cpfInput = screen.getByLabelText("CPF");
		const phoneInput = screen.getByLabelText("Telefone");

		fireEvent.change(cpfInput, { target: { value: "12345678909" } });
		fireEvent.change(phoneInput, { target: { value: "11987654321" } });

		expect(cpfInput).toHaveValue("123.456.789-09");
		expect(phoneInput).toHaveValue("(11) 98765-4321");
	});

	it("bloqueia submit quando CPF ou telefone sao invalidos", async () => {
		renderCheckout();

		fireEvent.change(screen.getByLabelText("CPF"), {
			target: { value: "11111111111" },
		});
		fireEvent.change(screen.getByLabelText("Telefone"), {
			target: { value: "12345" },
		});

		fireEvent.click(screen.getByRole("button", { name: "Finalizar compra" }));

		await waitFor(() => {
			expect(screen.getAllByText("Informe um CPF válido.").length).toBeGreaterThan(0);
			expect(screen.getByText("Informe um telefone válido.")).toBeTruthy();
			expect(updateCheckoutBuyerDataMock).not.toHaveBeenCalled();
			expect(confirmPaymentMock).not.toHaveBeenCalled();
		});
	});

	it("recalcula o frete apos o CEP resolvido e trava o pais em BR no checkout", async () => {
		updateCheckoutDeliverySelectionMock.mockResolvedValue({
			ok: true,
			orderId: "ord_123",
			paymentIntentId: "pi_123",
			deliveryMethod: "new-address",
			deliveryAddress: {
				line1: "SQS 102 Bloco A",
				line2: "",
				number: "12",
				complement: "",
				district: "Asa Sul",
				city: "Brasilia",
				state: "DF",
				postalCode: "71015-210",
				country: "BR",
			},
			shippingRate: {
				providerCode: "melhorenvio",
				serviceCode: "best",
				serviceName: "SEDEX",
				fixed_amount: {
					amount: 1990,
				},
				estimated_days: 4,
			},
			shippingError: null,
			subtotal: 5000,
			discountTotal: 0,
			amountTotal: 6990,
			currency: "BRL",
		});

		renderCheckout({
			deliveryMethod: "new-address",
			deliveryAddress: {
				line1: "",
				line2: "",
				number: "",
				complement: "",
				district: "",
				city: "",
				state: "",
				postalCode: "",
				country: "BR",
			},
			savedPaymentMethods: [],
			canSavePaymentMethod: false,
		});

		expect(screen.getByTestId("country-mode")).toHaveTextContent("br-only");

		fireEvent.click(screen.getByRole("button", { name: "Simular CEP" }));

		await waitFor(() => {
			expect(updateCheckoutDeliverySelectionMock).toHaveBeenCalledWith({
				paymentIntentId: "pi_123",
				orderId: "ord_123",
				deliveryMethod: "new-address",
				address: expect.objectContaining({
					postalCode: "71015-210",
					country: "BR",
				}),
			});
		});
	});
});
