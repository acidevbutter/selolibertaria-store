import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TransparentCheckoutIntent } from "@/actions/checkout-actions";
import { MercadoPagoCheckoutForm } from "@/app/checkout/mercado-pago-checkout-form.client";
import { IntlClientProvider } from "@/i18n/client";
import ptBrMessages from "../../../messages/pt-BR.json";

const getPendingMercadoPagoPixPayment = vi.fn();
const submitMercadoPagoCheckoutPayment = vi.fn();
const updateCheckoutBuyerData = vi.fn();
const routerReplace = vi.fn();

function createDeferred<T>() {
	let resolve!: (value: T | PromiseLike<T>) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});
	return { promise, resolve };
}

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: routerReplace }),
}));

vi.mock("@/actions/checkout-actions", () => ({
	getPendingMercadoPagoPixPayment: (...args: unknown[]) => getPendingMercadoPagoPixPayment(...args),
	submitMercadoPagoCheckoutPayment: (...args: unknown[]) => submitMercadoPagoCheckoutPayment(...args),
	updateCheckoutBuyerData: (...args: unknown[]) => updateCheckoutBuyerData(...args),
	updateCheckoutDeliverySelection: vi.fn(),
}));

const checkout: TransparentCheckoutIntent = {
	paymentProvider: "mercado_pago",
	publishableKey: "TEST-public-key",
	paymentReferenceId: "mp_draft_ord_123",
	orderId: "ord_123",
	isAuthenticated: false,
	buyer: { fullName: "Pessoa Leitora", email: "leitora@selo.test", cpf: "12345678909", phone: "11999999999" },
	subtotal: 4200,
	discountTotal: 0,
	amountTotal: 4200,
	currency: "BRL",
	items: [],
	deliveryMethod: "pickup",
	deliveryAddress: null,
	shippingRate: null,
	shippingError: null,
};

describe("MercadoPagoCheckoutForm Pix", () => {
	beforeEach(() => {
		getPendingMercadoPagoPixPayment.mockReset();
		submitMercadoPagoCheckoutPayment.mockReset();
		updateCheckoutBuyerData.mockReset();
		routerReplace.mockReset();
		updateCheckoutBuyerData.mockResolvedValue({ ok: true });
		getPendingMercadoPagoPixPayment.mockResolvedValue({ ok: true, payment: null });
		vi.stubGlobal(
			"MercadoPago",
			class {
				bricks() {
					return {
						create: async (
							_type: string,
							_container: string,
							settings: { callbacks: { onReady: () => void } },
						) => {
							settings.callbacks.onReady();
							return { unmount: vi.fn() };
						},
					};
				}
			},
		);
	});

	it("retoma o Pix pendente após recarga sem submeter outra cobrança", async () => {
		getPendingMercadoPagoPixPayment.mockResolvedValue({
			ok: true,
			payment: {
				paymentId: "123",
				status: "processing",
				qrCode: "pix-copia-e-cola",
				qrCodeBase64: "cXItY29kZQ==",
				ticketUrl: null,
				expiresAt: "2026-07-19T12:00:00.000Z",
			},
		});

		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<MercadoPagoCheckoutForm checkout={checkout} locale="pt-BR" />
			</IntlClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText("Pix gerado. Pague pelo QR Code ou copie o código abaixo.")).toBeVisible();
		});
		expect(getPendingMercadoPagoPixPayment).toHaveBeenCalledWith({ orderId: "ord_123" });
		expect(screen.getByRole("img", { name: "QR Code Pix" })).toHaveAttribute(
			"src",
			"data:image/png;base64,cXItY29kZQ==",
		);
		expect(screen.getByDisplayValue("pix-copia-e-cola")).toBeVisible();
	});

	it("copia o código Pix e anuncia o retorno acessível", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
		getPendingMercadoPagoPixPayment.mockResolvedValue({
			ok: true,
			payment: {
				paymentId: "123",
				status: "processing",
				qrCode: "pix-copia-e-cola",
				qrCodeBase64: null,
				ticketUrl: null,
				expiresAt: null,
			},
		});

		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<MercadoPagoCheckoutForm checkout={checkout} locale="pt-BR" />
			</IntlClientProvider>,
		);

		await screen.findByRole("button", { name: "Copiar código Pix" });
		fireEvent.click(screen.getByRole("button", { name: "Copiar código Pix" }));
		await waitFor(() => expect(writeText).toHaveBeenCalledWith("pix-copia-e-cola"));
		expect(screen.getByRole("status")).toHaveTextContent("Código Pix copiado.");
	});

	it("mantém o Pix visível quando a verificação manual ainda estiver pendente", async () => {
		getPendingMercadoPagoPixPayment.mockResolvedValue({
			ok: true,
			payment: {
				paymentId: "123",
				status: "processing",
				qrCode: "pix-copia-e-cola",
				qrCodeBase64: null,
				ticketUrl: null,
				expiresAt: null,
			},
		});

		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<MercadoPagoCheckoutForm checkout={checkout} locale="pt-BR" />
			</IntlClientProvider>,
		);

		const button = await screen.findByRole("button", { name: "Já paguei — verificar pagamento" });
		fireEvent.click(button);
		await waitFor(() => {
			expect(screen.getByRole("status")).toHaveTextContent(
				"Pagamento ainda pendente. Assim que for confirmado, você seguirá para o pedido.",
			);
		});
		expect(screen.getByDisplayValue("pix-copia-e-cola")).toBeVisible();
		expect(routerReplace).not.toHaveBeenCalled();
	});

	it("encaminha para a confirmação somente depois que o Pix for aprovado", async () => {
		getPendingMercadoPagoPixPayment.mockResolvedValue({
			ok: true,
			payment: {
				paymentId: "123",
				status: "processing",
				qrCode: "pix-copia-e-cola",
				qrCodeBase64: null,
				ticketUrl: null,
				expiresAt: null,
			},
		});

		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<MercadoPagoCheckoutForm checkout={checkout} locale="pt-BR" />
			</IntlClientProvider>,
		);

		await screen.findByRole("button", { name: "Já paguei — verificar pagamento" });
		getPendingMercadoPagoPixPayment.mockResolvedValue({
			ok: true,
			payment: {
				paymentId: "123",
				status: "succeeded",
				qrCode: "pix-copia-e-cola",
				qrCodeBase64: null,
				ticketUrl: null,
				expiresAt: null,
			},
		});

		fireEvent.click(screen.getByRole("button", { name: "Já paguei — verificar pagamento" }));
		await waitFor(() =>
			expect(routerReplace).toHaveBeenCalledWith("/checkout/processing?order=ord_123&mp_payment=123&guest=1"),
		);
	});

	it("mantém o Pix disponível quando a consulta manual falha", async () => {
		getPendingMercadoPagoPixPayment.mockResolvedValue({
			ok: true,
			payment: {
				paymentId: "123",
				status: "processing",
				qrCode: "pix-copia-e-cola",
				qrCodeBase64: null,
				ticketUrl: null,
				expiresAt: null,
			},
		});

		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<MercadoPagoCheckoutForm checkout={checkout} locale="pt-BR" />
			</IntlClientProvider>,
		);

		await screen.findByRole("button", { name: "Já paguei — verificar pagamento" });
		getPendingMercadoPagoPixPayment.mockResolvedValue({
			error: "Não foi possível recuperar o pagamento Pix",
		});

		fireEvent.click(screen.getByRole("button", { name: "Já paguei — verificar pagamento" }));
		await waitFor(() =>
			expect(screen.getByRole("status")).toHaveTextContent("Não foi possível recuperar o pagamento Pix"),
		);
		expect(screen.getByDisplayValue("pix-copia-e-cola")).toBeVisible();
		expect(submitMercadoPagoCheckoutPayment).not.toHaveBeenCalled();
		expect(routerReplace).not.toHaveBeenCalled();
	});

	it("informa a expiração do Pix sem criar outra cobrança", async () => {
		getPendingMercadoPagoPixPayment.mockResolvedValue({
			ok: true,
			payment: {
				paymentId: "123",
				status: "processing",
				qrCode: "pix-copia-e-cola",
				qrCodeBase64: null,
				ticketUrl: null,
				expiresAt: null,
			},
		});

		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<MercadoPagoCheckoutForm checkout={checkout} locale="pt-BR" />
			</IntlClientProvider>,
		);

		await screen.findByRole("button", { name: "Já paguei — verificar pagamento" });
		getPendingMercadoPagoPixPayment.mockResolvedValue({
			ok: true,
			payment: {
				paymentId: "123",
				status: "failed",
				qrCode: null,
				qrCodeBase64: null,
				ticketUrl: null,
				expiresAt: null,
			},
		});

		fireEvent.click(screen.getByRole("button", { name: "Já paguei — verificar pagamento" }));
		await waitFor(() => {
			expect(
				screen.getByText("Este Pix não está mais disponível. Gere uma nova cobrança para continuar."),
			).toBeVisible();
		});
		expect(submitMercadoPagoCheckoutPayment).not.toHaveBeenCalled();
		expect(routerReplace).not.toHaveBeenCalled();
	});

	it("gera Pix com o e-mail do checkout sem renderizar o formulário Pix do Brick", async () => {
		getPendingMercadoPagoPixPayment.mockResolvedValue({ ok: true, payment: null });
		submitMercadoPagoCheckoutPayment.mockResolvedValue({
			ok: true,
			orderId: "ord_123",
			paymentId: "456",
			status: "processing",
			qrCode: "pix-copia-e-cola",
			qrCodeBase64: null,
			ticketUrl: null,
			expiresAt: null,
		});

		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<MercadoPagoCheckoutForm checkout={checkout} locale="pt-BR" />
			</IntlClientProvider>,
		);

		const button = await screen.findByRole("button", { name: "Gerar código Pix" });
		expect(screen.getByRole("radio", { name: "CartãoCrédito ou débito no formulário seguro" })).toBeVisible();
		fireEvent.click(button);
		await waitFor(() => {
			expect(submitMercadoPagoCheckoutPayment).toHaveBeenCalledWith({
				orderId: "ord_123",
				paymentData: { payment_method_id: "pix" },
			});
		});
		expect(screen.getByDisplayValue("pix-copia-e-cola")).toBeVisible();
	});

	it("abre o Brick somente ao selecionar cartão", async () => {
		getPendingMercadoPagoPixPayment.mockResolvedValue({ ok: true, payment: null });

		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<MercadoPagoCheckoutForm checkout={checkout} locale="pt-BR" />
			</IntlClientProvider>,
		);

		const card = await screen.findByRole("radio", {
			name: "CartãoCrédito ou débito no formulário seguro",
		});
		fireEvent.click(card);
		await waitFor(() =>
			expect(
				screen.getByText("Informe os dados do cartão no formulário seguro do Mercado Pago."),
			).toBeVisible(),
		);
	});

	it("ignora clique duplicado na geração do Pix", async () => {
		const buyerUpdate = createDeferred<{ ok: true }>();
		getPendingMercadoPagoPixPayment.mockResolvedValue({ ok: true, payment: null });
		updateCheckoutBuyerData.mockReturnValue(buyerUpdate.promise);
		submitMercadoPagoCheckoutPayment.mockResolvedValue({
			ok: true,
			orderId: "ord_123",
			paymentId: "789",
			status: "processing",
			qrCode: "pix-copia-e-cola",
			qrCodeBase64: null,
			ticketUrl: null,
			expiresAt: null,
		});

		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<MercadoPagoCheckoutForm checkout={checkout} locale="pt-BR" />
			</IntlClientProvider>,
		);

		const button = await screen.findByRole("button", { name: "Gerar código Pix" });
		fireEvent.click(button);
		fireEvent.click(button);
		buyerUpdate.resolve({ ok: true });

		await waitFor(() => expect(submitMercadoPagoCheckoutPayment).toHaveBeenCalledTimes(1));
	});
});
