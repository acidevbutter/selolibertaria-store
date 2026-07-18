import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProcessingPage from "@/app/checkout/processing/page";
import { IntlClientProvider } from "@/i18n/client";
import ptBrMessages from "../../../../messages/pt-BR.json";

const {
	closeCartMock,
	finalizeCheckoutCleanupMock,
	recordMercadoPagoCheckoutMock,
	recordPaymentIntentCheckoutMock,
	recordSuccessfulCheckoutMock,
	refreshCartMock,
	replaceMock,
	routerMock,
	searchParamsState,
} = vi.hoisted(() => ({
	closeCartMock: vi.fn(),
	finalizeCheckoutCleanupMock: vi.fn(),
	recordMercadoPagoCheckoutMock: vi.fn(),
	recordPaymentIntentCheckoutMock: vi.fn(),
	recordSuccessfulCheckoutMock: vi.fn(),
	refreshCartMock: vi.fn(),
	replaceMock: vi.fn(),
	routerMock: { replace: vi.fn() },
	searchParamsState: {
		session_id: null as string | null,
		order: "ord_123" as string | null,
		payment_intent: "pi_123" as string | null,
		mp_payment: null as string | null,
		checkout: "success" as string | null,
		guest: null as string | null,
	},
}));

routerMock.replace = replaceMock;

vi.mock("next/navigation", () => ({
	useRouter: () => routerMock,
	useSearchParams: () => ({
		get: (key: keyof typeof searchParamsState) => searchParamsState[key] ?? null,
	}),
}));

vi.mock("@/actions/order-actions", () => ({
	finalizeCheckoutCleanup: finalizeCheckoutCleanupMock,
	recordPaymentIntentCheckout: recordPaymentIntentCheckoutMock,
	recordSuccessfulCheckout: recordSuccessfulCheckoutMock,
}));

vi.mock("@/actions/mercado-pago-order-actions", () => ({
	recordMercadoPagoCheckout: recordMercadoPagoCheckoutMock,
}));

vi.mock("@/context/cart-context", () => ({
	useCart: () => ({
		refreshCart: refreshCartMock,
		closeCart: closeCartMock,
	}),
}));

describe("Checkout processing page", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		closeCartMock.mockReset();
		finalizeCheckoutCleanupMock.mockReset();
		recordMercadoPagoCheckoutMock.mockReset();
		recordPaymentIntentCheckoutMock.mockReset();
		recordSuccessfulCheckoutMock.mockReset();
		refreshCartMock.mockReset();
		replaceMock.mockReset();
		refreshCartMock.mockResolvedValue(undefined);
		searchParamsState.session_id = null;
		searchParamsState.order = "ord_123";
		searchParamsState.payment_intent = "pi_123";
		searchParamsState.mp_payment = null;
		searchParamsState.checkout = "success";
		searchParamsState.guest = null;
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("redireciona para pedidos após 15s quando o pagamento segue em processing", async () => {
		recordPaymentIntentCheckoutMock.mockResolvedValue({
			ok: true,
			status: "processing",
			cartCleared: false,
		});

		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<ProcessingPage />
			</IntlClientProvider>,
		);

		await act(async () => {
			await Promise.resolve();
		});

		expect(screen.getByText("Pedido recebido")).toBeTruthy();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(15000);
		});

		expect(replaceMock).toHaveBeenCalledWith("/user?section=purchases&order=ord_123");
		expect(recordPaymentIntentCheckoutMock.mock.calls.length).toBeGreaterThan(1);
	});

	it("redireciona após 15s mesmo se a sincronização travar", async () => {
		recordPaymentIntentCheckoutMock.mockImplementation(() => new Promise(() => {}));

		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<ProcessingPage />
			</IntlClientProvider>,
		);

		await act(async () => {
			await Promise.resolve();
			await vi.advanceTimersByTimeAsync(15000);
		});

		expect(replaceMock).toHaveBeenCalledWith("/user?section=purchases&order=ord_123");
		expect(screen.getByText("Pagamento ainda em processamento")).toBeTruthy();
	});

	it("interrompe o loading quando o status autoritativo já está em disputa", async () => {
		recordPaymentIntentCheckoutMock.mockResolvedValue({
			ok: true,
			status: "disputed",
			cartCleared: false,
		});

		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<ProcessingPage />
			</IntlClientProvider>,
		);

		await act(async () => {
			await Promise.resolve();
		});

		expect(screen.getByText("Pagamento em análise")).toBeTruthy();
		expect(screen.getByText(/esta página não precisa mais continuar carregando/i)).toBeTruthy();
		expect(recordPaymentIntentCheckoutMock).toHaveBeenCalledTimes(1);
	});

	it("finaliza rapidamente quando o pagamento já está confirmado", async () => {
		recordPaymentIntentCheckoutMock.mockResolvedValue({
			ok: true,
			status: "succeeded",
			cartCleared: false,
		});

		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<ProcessingPage />
			</IntlClientProvider>,
		);

		await act(async () => {
			await Promise.resolve();
		});

		expect(screen.getByText("Pagamento confirmado")).toBeTruthy();

		await act(async () => {
			await vi.runAllTimersAsync();
		});

		expect(replaceMock).toHaveBeenCalledWith("/user?section=purchases&order=ord_123");
		expect(recordPaymentIntentCheckoutMock).toHaveBeenCalledTimes(1);
	});

	it("segue adiante quando o estado autoritativo do pedido já avançou no mongo", async () => {
		recordPaymentIntentCheckoutMock.mockResolvedValue({
			ok: true,
			status: "producing",
			cartCleared: false,
		});

		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<ProcessingPage />
			</IntlClientProvider>,
		);

		await act(async () => {
			await Promise.resolve();
		});

		expect(screen.getByText("Pagamento confirmado")).toBeTruthy();

		await act(async () => {
			await vi.runAllTimersAsync();
		});

		expect(replaceMock).toHaveBeenCalledWith("/user?section=purchases&order=ord_123");
		expect(recordPaymentIntentCheckoutMock).toHaveBeenCalledTimes(1);
	});

	it("mantém o acesso autenticado e o setup de senha no redirect do checkout convidado", async () => {
		searchParamsState.guest = "1";
		recordPaymentIntentCheckoutMock.mockResolvedValue({
			ok: true,
			status: "succeeded",
			cartCleared: false,
			setupPasswordRequired: true,
		});

		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<ProcessingPage />
			</IntlClientProvider>,
		);

		await act(async () => {
			await Promise.resolve();
		});

		await act(async () => {
			await vi.runAllTimersAsync();
		});

		expect(replaceMock).toHaveBeenCalledWith("/user?section=purchases&order=ord_123&setupPassword=1");
	});

	it("redireciona o fluxo por session_id com setup de senha quando a conta nasce no checkout", async () => {
		searchParamsState.order = null;
		searchParamsState.payment_intent = null;
		searchParamsState.session_id = "cs_123";
		searchParamsState.guest = "1";
		recordSuccessfulCheckoutMock.mockResolvedValue({
			ok: true,
			setupPasswordRequired: true,
		});
		finalizeCheckoutCleanupMock.mockResolvedValue({ ok: true });

		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<ProcessingPage />
			</IntlClientProvider>,
		);

		await act(async () => {
			await Promise.resolve();
		});

		await act(async () => {
			await vi.runAllTimersAsync();
		});

		expect(recordSuccessfulCheckoutMock).toHaveBeenCalledWith("cs_123");
		expect(replaceMock).toHaveBeenCalledWith("/user?section=purchases&setupPassword=1");
	});

	it("redireciona imediatamente quando entra sem order, intent ou session", async () => {
		searchParamsState.order = null;
		searchParamsState.payment_intent = null;
		searchParamsState.session_id = null;

		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<ProcessingPage />
			</IntlClientProvider>,
		);

		await act(async () => {
			await Promise.resolve();
		});

		expect(replaceMock).toHaveBeenCalledWith("/user?section=purchases");
		expect(recordPaymentIntentCheckoutMock).not.toHaveBeenCalled();
	});
});
