import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CartIcon } from "@/components/cart-icon";

const useCartMock = vi.fn();

vi.mock("@/context/cart-context", () => ({
	useCart: () => useCartMock(),
}));

vi.mock("@/components/cart-sidebar", () => ({
	CartSidebar: () => <div data-testid="cart-sidebar" />,
}));

describe("CartIcon", () => {
	it("oculta o badge quando o carrinho está vazio", () => {
		useCartMock.mockReturnValue({
			isCartOpen: false,
			openCart: vi.fn(),
			closeCart: vi.fn(),
			itemCount: 0,
		});

		render(<CartIcon />);

		expect(screen.getByRole("button", { name: "Carrinho" })).toBeInTheDocument();
		expect(screen.queryByText("0")).not.toBeInTheDocument();
	});

	it("mostra o badge com a quantidade atual do carrinho", () => {
		useCartMock.mockReturnValue({
			isCartOpen: false,
			openCart: vi.fn(),
			closeCart: vi.fn(),
			itemCount: 3,
		});

		render(<CartIcon />);

		expect(screen.getByText("3")).toBeInTheDocument();
	});
});
