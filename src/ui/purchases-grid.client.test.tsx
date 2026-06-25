import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IntlClientProvider } from "@/i18n/client";
import ptBrMessages from "../../messages/pt-BR.json";
import { PurchasesGrid } from "./purchases-grid.client";

const { getPurchaseDetailsMock } = vi.hoisted(() => ({
	getPurchaseDetailsMock: vi.fn(),
}));

vi.mock("@/actions/order-actions", () => ({
	getPurchaseDetails: getPurchaseDetailsMock,
}));

describe("PurchasesGrid", () => {
	beforeEach(() => {
		getPurchaseDetailsMock.mockReset();
	});

	it("normalizes under_review into the disputed UI state", async () => {
		getPurchaseDetailsMock.mockResolvedValue({
			id: "ord_123",
			status: "under_review",
			createdAt: "2026-05-27T22:41:00.000Z",
			amountTotal: 56677,
			currency: "USD",
			items: [
				{
					name: "Camiseta Emocionadaaa",
					quantity: 4,
					unitAmount: 13500,
					priceId: "price_1",
					productId: "prod_1",
					image: null,
				},
			],
			fulfillment: { status: "received" as const },
		});

		render(
			<IntlClientProvider locale="pt-BR" messages={ptBrMessages}>
				<PurchasesGrid
					purchases={[
						{
							id: "ord_123",
							status: "under_review",
							createdAt: "2026-05-27T22:41:00.000Z",
							amountTotal: 56677,
							currency: "USD",
							items: [{ name: "Camiseta Emocionadaaa", quantity: 4, unitAmount: 13500 }],
							fulfillment: { status: "received" },
						},
					]}
				/>
			</IntlClientProvider>,
		);

		expect(screen.getByText("Em disputa")).toBeTruthy();
		expect(screen.queryByText("UNDER_REVIEW")).toBeNull();

		fireEvent.click(screen.getByRole("button", { name: /ord_123/i }));

		await waitFor(() => {
			expect(screen.getByText("Status: Em disputa")).toBeTruthy();
		});
	});
});
