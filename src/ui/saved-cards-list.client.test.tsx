import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IntlClientProvider } from "@/i18n/client";
import ptBrMessages from "../../messages/pt-BR.json";
import { SavedCardsList } from "./saved-cards-list.client";

const { deleteSavedCardMock, toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
	deleteSavedCardMock: vi.fn(),
	toastSuccessMock: vi.fn(),
	toastErrorMock: vi.fn(),
}));

vi.mock("@/actions/saved-cards-actions", () => ({
	deleteSavedCard: deleteSavedCardMock,
}));

vi.mock("sonner", () => ({
	toast: { success: toastSuccessMock, error: toastErrorMock },
}));

function renderWithIntl(children: React.ReactNode) {
	return render(
		<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
			{children}
		</IntlClientProvider>,
	);
}

describe("SavedCardsList", () => {
	beforeEach(() => {
		deleteSavedCardMock.mockReset();
		toastSuccessMock.mockReset();
		toastErrorMock.mockReset();
	});

	it("mostra o estado vazio quando não há cartões salvos", () => {
		renderWithIntl(<SavedCardsList cards={[]} />);
		expect(screen.getByText("Você ainda não salvou nenhum cartão.")).toBeTruthy();
	});

	it("lista os cartões salvos mascarados por bandeira e final", () => {
		renderWithIntl(
			<SavedCardsList
				cards={[
					{
						id: "card_1",
						provider: "asaas",
						brand: "visa",
						last4: "4242",
						createdAt: "2026-01-15T12:00:00Z",
					},
				]}
			/>,
		);
		expect(screen.getByText("VISA •••• 4242")).toBeTruthy();
	});

	it("remove um cartão após confirmar a exclusão", async () => {
		deleteSavedCardMock.mockResolvedValue({ ok: true });
		renderWithIntl(
			<SavedCardsList
				cards={[
					{
						id: "card_1",
						provider: "asaas",
						brand: "visa",
						last4: "4242",
						createdAt: "2026-01-15T12:00:00Z",
					},
				]}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Remover" }));
		fireEvent.click(screen.getByRole("button", { name: "Remover cartão" }));

		await waitFor(() => {
			expect(deleteSavedCardMock).toHaveBeenCalledWith("card_1");
			expect(screen.queryByText("VISA •••• 4242")).toBeNull();
		});
		expect(toastSuccessMock).toHaveBeenCalled();
	});

	it("mantém o cartão na lista e mostra um toast de erro quando a remoção falha", async () => {
		deleteSavedCardMock.mockResolvedValue({ error: "boom" });
		renderWithIntl(
			<SavedCardsList
				cards={[
					{
						id: "card_1",
						provider: "asaas",
						brand: "visa",
						last4: "4242",
						createdAt: "2026-01-15T12:00:00Z",
					},
				]}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Remover" }));
		fireEvent.click(screen.getByRole("button", { name: "Remover cartão" }));

		await waitFor(() => {
			expect(toastErrorMock).toHaveBeenCalled();
		});
		expect(screen.getByText("VISA •••• 4242")).toBeTruthy();
	});
});
