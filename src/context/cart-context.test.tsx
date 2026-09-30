import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "@/context/cart-context";
import type { Cart } from "@/lib/commerce-types";

const searchParamsGet = vi.fn();
let currentPathname = "/";
const addToCartAction = vi.fn();
const removeFromCartAction = vi.fn();
const updateCartItemAction = vi.fn();

vi.mock("next/navigation", () => ({
	useSearchParams: () => ({
		get: searchParamsGet,
	}),
	usePathname: () => currentPathname,
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
	const { cart, itemCount, optimisticAdd } = useCart();

	return (
		<div>
			<span data-testid="item-count">{itemCount}</span>
			<span data-testid="cart-currency">{cart?.currency ?? ""}</span>
			<button
				type="button"
				onClick={() =>
					void optimisticAdd("price_123", 1, {
						id: "prod_123",
						name: "Produto",
						images: ["/capa.png"],
						summary: "Resumo",
					}).catch(() => {})
				}
			>
				Adicionar
			</button>
		</div>
	);
}

function createGuestCart(): Cart {
	return {
		id: "guest_cart",
		items: [
			{
				id: "item_1",
				productId: "prod_123",
				variantId: "price_123",
				quantity: 1,
				price: 4200,
				product: {
					id: "prod_123",
					name: "Produto",
					images: ["/capa.png"],
					summary: "Resumo",
				},
			},
		],
		total: 4200,
		subtotal: 4200,
		discountTotal: 0,
		currency: "BRL",
		couponCode: null,
		couponError: null,
		appliedPromotions: [],
	};
}

describe("CartProvider", () => {
	beforeEach(() => {
		searchParamsGet.mockReset();
		addToCartAction.mockReset();
		removeFromCartAction.mockReset();
		updateCartItemAction.mockReset();
		searchParamsGet.mockReturnValue(null);
		currentPathname = "/";
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it.each(["/maintenance", "/login"])(
		"não busca o carrinho em %s (durante a manutenção o gate responde 503 a toda /api) -- selolibertaria-store#209",
		async (pathname) => {
			currentPathname = pathname;
			const fetchMock = vi.fn();
			vi.stubGlobal("fetch", fetchMock);

			render(
				<CartProvider>
					<CartHarness />
				</CartProvider>,
			);

			await waitFor(() => expect(screen.getByTestId("item-count").textContent).toBe("0"));
			expect(fetchMock).not.toHaveBeenCalled();
		},
	);

	it("mantém o contador do carrinho após add-to-cart mesmo com refresh inicial atrasado", async () => {
		const guestCart = createGuestCart();
		const initialCartRequest = createDeferred<Response>();
		const refreshCartRequest = createDeferred<Response>();
		const fetchMock = vi
			.fn()
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

	it("preserva um carrinho convidado já populado quando a hidratação passiva retorna vazio", async () => {
		const guestCart = createGuestCart();
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ cart: null }), {
				headers: { "Content-Type": "application/json" },
			}),
		);

		vi.stubGlobal("fetch", fetchMock);

		render(
			<CartProvider initialCart={guestCart}>
				<CartHarness />
			</CartProvider>,
		);

		expect(screen.getByTestId("item-count")).toHaveTextContent("1");

		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledTimes(1);
		});

		await waitFor(() => {
			expect(screen.getByTestId("item-count")).toHaveTextContent("1");
		});
	});

	it("usa BRL (nunca USD) no placeholder otimista de um carrinho vazio (selolibertaria-store#174)", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ cart: null }), {
				headers: { "Content-Type": "application/json" },
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const addToCartRequest = createDeferred<Cart | null>();
		addToCartAction.mockReturnValue(addToCartRequest.promise);

		render(
			<CartProvider>
				<CartHarness />
			</CartProvider>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

		await waitFor(() => {
			expect(screen.getByTestId("item-count")).toHaveTextContent("1");
		});
		expect(screen.getByTestId("cart-currency")).toHaveTextContent("BRL");

		addToCartRequest.resolve(null);
	});

	it("reverte para o estado anterior (não fica preso no placeholder zerado) quando o add-to-cart falha no servidor", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ cart: null }), {
				headers: { "Content-Type": "application/json" },
			}),
		);
		vi.stubGlobal("fetch", fetchMock);
		addToCartAction.mockRejectedValue(new Error("Falha ao adicionar"));

		render(
			<CartProvider>
				<CartHarness />
			</CartProvider>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

		await waitFor(() => {
			expect(screen.getByTestId("item-count")).toHaveTextContent("1");
		});

		await waitFor(() => {
			expect(screen.getByTestId("item-count")).toHaveTextContent("0");
		});
	});
});
