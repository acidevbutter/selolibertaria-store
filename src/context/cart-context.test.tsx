import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "@/context/cart-context";
import type { Cart } from "@/lib/commerce-types";

const searchParamsGet = vi.fn();
const addToCartAction = vi.fn();
const removeFromCartAction = vi.fn();
const updateCartItemAction = vi.fn();

vi.mock("next/navigation", () => ({
	useSearchParams: () => ({
		get: searchParamsGet,
	}),
}));

vi.mock("@/actions/cart-actions", () => ({
	addToCartAction: (...args: unknown[]) => addToCartAction(...args),
	removeFromCartAction: (...args: unknown[]) => removeFromCartAction(...args),
	updateCartItemAction: (...args: unknown[]) => updateCartItemAction(...args),
}));

function createDeferred<T>() {
	let resolve!: (value: T | PromiseLike<T>) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, resolve, reject };
}

function CartHarness() {
	const { itemCount, optimisticAdd } = useCart();

	return (
		<div>
			<span data-testid="item-count">{itemCount}</span>
			<button
				type="button"
				onClick={() =>
					void optimisticAdd("price_123", 1, {
						id: "prod_123",
						name: "Livro",
						images: ["/capa.png"],
						summary: "Resumo",
					})
				}
			>
				Adicionar
			</button>
		</div>
	);
}

describe("CartProvider", () => {
	beforeEach(() => {
		searchParamsGet.mockReset();
		addToCartAction.mockReset();
		removeFromCartAction.mockReset();
		updateCartItemAction.mockReset();
		searchParamsGet.mockReturnValue(null);
		vi.restoreAllMocks();
	});

	it("mantém o contador do carrinho após add-to-cart mesmo com refresh inicial atrasado", async () => {
		const initialCartRequest = createDeferred<Response>();
		const refreshCartRequest = createDeferred<Response>();
		const guestCart: Cart = {
			id: "guest_cart",
			items: [
				{
					id: "price_123",
					productId: "prod_123",
					variantId: "price_123",
					quantity: 1,
					price: 2500,
					product: {
						id: "prod_123",
						name: "Livro",
						images: ["/capa.png"],
						summary: "Resumo",
					},
				},
			],
			total: 2500,
			currency: "BRL",
		};

		const fetchMock = vi
			.fn<typeof fetch>()
			.mockImplementationOnce(() => initialCartRequest.promise)
			.mockImplementationOnce(() => refreshCartRequest.promise);
		vi.stubGlobal("fetch", fetchMock);
		addToCartAction.mockResolvedValue(guestCart);

		render(
			<CartProvider>
				<CartHarness />
			</CartProvider>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

		await waitFor(() => {
			expect(screen.getByTestId("item-count")).toHaveTextContent("1");
		});

		initialCartRequest.resolve(
			new Response(JSON.stringify({ cart: null }), {
				headers: { "Content-Type": "application/json" },
			}),
		);

		await waitFor(() => {
			expect(addToCartAction).toHaveBeenCalledWith("price_123", 1);
		});

		refreshCartRequest.resolve(
			new Response(JSON.stringify({ cart: null }), {
				headers: { "Content-Type": "application/json" },
			}),
		);

		await waitFor(() => {
			expect(screen.getByTestId("item-count")).toHaveTextContent("1");
		});
	});
});
