import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddToCart } from "@/components/add-to-cart";

const optimisticAdd = vi.fn();
const openCart = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push }),
}));

vi.mock("@/context/cart-context", () => ({
	useCart: () => ({
		openCart,
		optimisticAdd,
	}),
}));

vi.mock("@/i18n/client", () => ({
	useTranslations: () => () => "Adicionar ao carrinho",
}));

describe("AddToCart", () => {
	beforeEach(() => {
		optimisticAdd.mockReset();
		openCart.mockReset();
		push.mockReset();
	});

	it("envia o payload correto ao adicionar ao carrinho", async () => {
		optimisticAdd.mockResolvedValue(undefined);

		render(
			<AddToCart
				variantId="price_123"
				quantity={2}
				productInfo={{
					id: "prod_123",
					name: "Livro",
					images: ["/capa.png"],
					summary: "Resumo",
				}}
			>
				Adicionar ao carrinho
			</AddToCart>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Adicionar ao carrinho" }));

		await waitFor(() => {
			expect(optimisticAdd).toHaveBeenCalledWith("price_123", 2, {
				id: "prod_123",
				name: "Livro",
				images: ["/capa.png"],
				summary: "Resumo",
			});
		});
		expect(openCart).toHaveBeenCalledTimes(1);
		expect(push).not.toHaveBeenCalled();
	});

	it("redireciona para o checkout quando usado como buy-now", async () => {
		optimisticAdd.mockResolvedValue(undefined);

		render(
			<AddToCart variantId="price_123" redirectTo="/checkout">
				Comprar
			</AddToCart>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Comprar" }));

		await waitFor(() => {
			expect(optimisticAdd).toHaveBeenCalledWith("price_123", 1, undefined);
		});
		expect(push).toHaveBeenCalledWith("/checkout");
		expect(openCart).not.toHaveBeenCalled();
	});
});
