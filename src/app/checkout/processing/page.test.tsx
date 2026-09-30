import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IntlClientProvider } from "@/i18n/client";
import ptBrMessages from "../../../../messages/pt-BR.json";

const { finalizeMock, saveCardMock, replaceMock, toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
	finalizeMock: vi.fn(),
	saveCardMock: vi.fn(),
	replaceMock: vi.fn(),
	toastSuccessMock: vi.fn(),
	toastErrorMock: vi.fn(),
}));

vi.mock("@/actions/checkout-actions", () => ({
	finalizeAsaasCheckout: finalizeMock,
	saveCheckoutCard: saveCardMock,
}));

vi.mock("@/context/cart-context", () => ({
	useCart: () => ({ refreshCart: vi.fn(), closeCart: vi.fn() }),
}));

vi.mock("sonner", () => ({
	toast: { success: toastSuccessMock, error: toastErrorMock },
}));

function makeSearchParams(params: Record<string, string>) {
	return { get: (key: string) => params[key] ?? null } as unknown as URLSearchParams;
}

let searchParams: URLSearchParams;

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: replaceMock, push: vi.fn(), prefetch: vi.fn() }),
	useSearchParams: () => searchParams,
}));

import ProcessingPage from "./page";

function renderPage() {
	return render(
		<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
			<ProcessingPage />
		</IntlClientProvider>,
	);
}

describe("ProcessingPage - opt-in de salvar cartão", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		searchParams = makeSearchParams({ order: "ord_123" });
	});

	it("não mostra o prompt de salvar cartão quando card_save_available é falso", async () => {
		finalizeMock.mockResolvedValue({
			ok: true,
			status: "succeeded",
			setupPasswordRequired: false,
			cartCleared: false,
			accountEmailSent: false,
			billingType: "PIX",
			creditCardBrand: null,
			creditCardLast4: null,
			cardSaveAvailable: false,
		});

		renderPage();

		await waitFor(() => {
			expect(finalizeMock).toHaveBeenCalled();
		});
		expect(screen.queryByText("Salvar este cartão para próximas compras?")).toBeNull();
	});

	it("mostra o prompt de salvar cartão quando card_save_available é verdadeiro", async () => {
		finalizeMock.mockResolvedValue({
			ok: true,
			status: "succeeded",
			setupPasswordRequired: false,
			cartCleared: false,
			accountEmailSent: false,
			billingType: "CREDIT_CARD",
			creditCardBrand: "VISA",
			creditCardLast4: "4242",
			cardSaveAvailable: true,
		});

		renderPage();

		await waitFor(() => {
			expect(screen.getByText("Salvar este cartão para próximas compras?")).toBeTruthy();
		});
		expect(screen.getByText(/VISA/)).toBeTruthy();
		expect(screen.getByText(/4242/)).toBeTruthy();
		// The auto-redirect to the success page is held back until the user answers.
		expect(replaceMock).not.toHaveBeenCalled();
	});

	it("salva o cartão e segue para a página de sucesso ao confirmar", async () => {
		finalizeMock.mockResolvedValue({
			ok: true,
			status: "succeeded",
			setupPasswordRequired: false,
			cartCleared: false,
			accountEmailSent: false,
			billingType: "CREDIT_CARD",
			creditCardBrand: "VISA",
			creditCardLast4: "4242",
			cardSaveAvailable: true,
		});
		saveCardMock.mockResolvedValue({
			ok: true,
			card: { id: "card_1", provider: "asaas", brand: "VISA", last4: "4242" },
		});

		renderPage();

		await waitFor(() => {
			expect(screen.getByText("Salvar este cartão para próximas compras?")).toBeTruthy();
		});

		fireEvent.click(screen.getByRole("button", { name: "Salvar cartão" }));

		await waitFor(() => {
			expect(saveCardMock).toHaveBeenCalledWith({ orderId: "ord_123" });
			expect(replaceMock).toHaveBeenCalledWith(expect.stringContaining("/user?"));
		});
		expect(toastSuccessMock).toHaveBeenCalled();
	});

	it("pula o salvamento e segue para a página de sucesso ao recusar", async () => {
		finalizeMock.mockResolvedValue({
			ok: true,
			status: "succeeded",
			setupPasswordRequired: false,
			cartCleared: false,
			accountEmailSent: false,
			billingType: "CREDIT_CARD",
			creditCardBrand: "VISA",
			creditCardLast4: "4242",
			cardSaveAvailable: true,
		});

		renderPage();

		await waitFor(() => {
			expect(screen.getByText("Salvar este cartão para próximas compras?")).toBeTruthy();
		});

		fireEvent.click(screen.getByRole("button", { name: "Agora não" }));

		await waitFor(() => {
			expect(replaceMock).toHaveBeenCalledWith(expect.stringContaining("/user?"));
		});
		expect(saveCardMock).not.toHaveBeenCalled();
	});
});
