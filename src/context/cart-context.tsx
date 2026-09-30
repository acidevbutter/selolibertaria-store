"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { addToCartAction, removeFromCartAction, updateCartItemAction } from "@/actions/cart-actions";
import type { Cart, ProductInfo } from "@/lib/commerce-types";

type CartAction =
	| { type: "ADD_ITEM"; variantId: string; quantity: number; product?: ProductInfo }
	| { type: "UPDATE_ITEM"; variantId: string; quantity: number }
	| { type: "REMOVE_ITEM"; variantId: string };

interface CartContextType {
	cart: Cart | null;
	isCartOpen: boolean;
	itemCount: number;
	openCart: () => void;
	closeCart: () => void;
	optimisticAdd: (variantId: string, quantity: number, product?: ProductInfo) => Promise<void>;
	optimisticUpdate: (variantId: string, quantity: number) => Promise<void>;
	optimisticRemove: (variantId: string) => Promise<void>;
	cartReady: boolean;
	replaceCart: (cart: Cart | null) => void;
	refreshCart: () => Promise<void>;
}

type CartProviderProps = {
	children: ReactNode;
	initialCart?: Cart | null;
};

function cartReducer(state: Cart | null, action: CartAction): Cart | null {
	switch (action.type) {
		case "ADD_ITEM": {
			if (!state) {
				return {
					id: "optimistic",
					items: [
						{
							id: action.variantId,
							productId: action.variantId,
							variantId: action.variantId,
							quantity: action.quantity,
							price: 0,
							product: action.product,
						},
					],
					total: 0,
					// This store only ever charges in BRL (checkout rejects anything
					// else -- see the Asaas flow) and this is only a placeholder
					// shown until the real priced cart comes back from the server;
					// "USD" here previously made a failed/slow add-to-cart flash
					// wrong-currency zeros (selolibertaria-store#174).
					currency: "BRL",
				};
			}

			const existingItemIndex = state.items.findIndex(
				(item) => (item.variantId || item.productId) === action.variantId,
			);

			if (existingItemIndex >= 0) {
				const existingItem = state.items[existingItemIndex];
				if (!existingItem) {
					return state;
				}

				const updatedItems = [...state.items];
				updatedItems[existingItemIndex] = {
					...existingItem,
					quantity: existingItem.quantity + action.quantity,
				};

				return {
					...state,
					items: updatedItems,
				};
			}

			return {
				...state,
				items: [
					...state.items,
					{
						id: action.variantId,
						productId: action.variantId,
						variantId: action.variantId,
						quantity: action.quantity,
						price: 0,
						product: action.product,
					},
				],
			};
		}

		case "UPDATE_ITEM": {
			if (!state) {
				return state;
			}

			if (action.quantity <= 0) {
				return {
					...state,
					items: state.items.filter((item) => (item.variantId || item.productId) !== action.variantId),
				};
			}

			return {
				...state,
				items: state.items.map((item) =>
					(item.variantId || item.productId) === action.variantId
						? { ...item, quantity: action.quantity }
						: item,
				),
			};
		}

		case "REMOVE_ITEM": {
			if (!state) {
				return state;
			}

			return {
				...state,
				items: state.items.filter((item) => (item.variantId || item.productId) !== action.variantId),
			};
		}

		default:
			return state;
	}
}

function cartHasItems(cart: Cart | null | undefined): boolean {
	return Boolean(cart?.items.some((item) => Number(item.quantity) > 0));
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children, initialCart = null }: CartProviderProps) {
	const [cart, setCart] = useState<Cart | null>(initialCart);
	const [isCartOpen, setIsCartOpen] = useState(false);
	const [cartReady, setCartReady] = useState(false);
	const latestCartOpRef = useRef(0);
	const searchParams = useSearchParams();
	const pathname = usePathname();
	// The maintenance gate answers every /api call with 503 MAINTENANCE_MODE, so the page it redirects
	// visitors to must not try to hydrate a cart (selolibertaria-store#209).
	const cartFetchDisabled = pathname === "/maintenance";

	const itemCount = cart?.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0;

	const beginCartOp = () => {
		latestCartOpRef.current += 1;
		return latestCartOpRef.current;
	};

	const isLatestCartOp = (opId: number) => latestCartOpRef.current === opId;

	const syncCartState = (nextCart: Cart | null, options?: { preservePopulated?: boolean }) => {
		setCart((currentCart) => {
			if (options?.preservePopulated && cartHasItems(currentCart) && !cartHasItems(nextCart)) {
				return currentCart;
			}

			return nextCart;
		});
	};

	async function fetchCart(): Promise<Cart | null> {
		try {
			const response = await fetch("/api/cart", { method: "GET", cache: "no-store" });
			if (!response.ok) {
				return null;
			}

			const data = (await response.json()) as { cart: Cart | null };
			return data.cart;
		} catch (error) {
			console.error("Failed fetch cart", error);
			return null;
		}
	}

	const refreshCart = async () => {
		const opId = beginCartOp();

		try {
			const nextCart = await fetchCart();
			if (isLatestCartOp(opId)) {
				syncCartState(nextCart);
			}
		} catch (error) {
			console.error("Failed refresh cart", error);
		}
	};

	const replaceCart = (nextCart: Cart | null) => {
		beginCartOp();
		syncCartState(nextCart);
	};

	useEffect(() => {
		if (cartFetchDisabled) {
			setCartReady(true);
			return;
		}
		let active = true;
		const opId = beginCartOp();

		void fetchCart()
			.then((nextCart) => {
				if (active && isLatestCartOp(opId)) {
					syncCartState(nextCart, { preservePopulated: true });
				}
			})
			.finally(() => {
				if (active) {
					setCartReady(true);
				}
			});

		return () => {
			active = false;
		};
	}, []);

	useEffect(() => {
		const status = searchParams?.get("checkout");
		const orderId = searchParams?.get("order");

		if (!status || !orderId) {
			return;
		}

		const normalizedStatus = status.toLowerCase();
		if (
			normalizedStatus !== "success" &&
			normalizedStatus !== "succeeded" &&
			normalizedStatus !== "processing"
		) {
			return;
		}

		void refreshCart().catch(() => {});
	}, [searchParams]);

	const openCart = () => setIsCartOpen(true);
	const closeCart = () => setIsCartOpen(false);

	const optimisticAdd = async (variantId: string, quantity = 1, product?: ProductInfo) => {
		const previousCart = cart;
		const optimisticSnapshot = cartReducer(cart, {
			type: "ADD_ITEM",
			variantId,
			quantity,
			product,
		});
		const opId = beginCartOp();

		setCart((currentCart) => cartReducer(currentCart, { type: "ADD_ITEM", variantId, quantity, product }));
		setIsCartOpen(true);

		try {
			const updatedCart = await addToCartAction(variantId, quantity);
			if (isLatestCartOp(opId)) {
				syncCartState(updatedCart ?? optimisticSnapshot);
				const confirmedCart = await fetchCart();
				if (isLatestCartOp(opId)) {
					syncCartState(confirmedCart ?? updatedCart ?? optimisticSnapshot);
				}
			}
		} catch (error) {
			console.error("Failed to add cart:", error);
			// Don't leave the optimistic placeholder (price 0, no real total)
			// on screen indefinitely when the server call fails -- roll back
			// to whatever was actually confirmed before this add
			// (selolibertaria-store#174).
			if (isLatestCartOp(opId)) {
				setCart(previousCart);
			}
			throw error;
		}
	};

	const optimisticUpdate = async (variantId: string, quantity: number) => {
		const optimisticSnapshot = cartReducer(cart, {
			type: "UPDATE_ITEM",
			variantId,
			quantity,
		});
		const opId = beginCartOp();

		setCart((currentCart) => cartReducer(currentCart, { type: "UPDATE_ITEM", variantId, quantity }));

		try {
			const updatedCart = await updateCartItemAction(variantId, quantity);
			if (isLatestCartOp(opId)) {
				syncCartState(updatedCart ?? optimisticSnapshot);
				const confirmedCart = await fetchCart();
				if (isLatestCartOp(opId)) {
					syncCartState(confirmedCart ?? updatedCart ?? optimisticSnapshot);
				}
			}
		} catch (error) {
			console.error("Failed to update cart item:", error);
			throw error;
		}
	};

	const optimisticRemove = async (variantId: string) => {
		const optimisticSnapshot = cartReducer(cart, {
			type: "REMOVE_ITEM",
			variantId,
		});
		const opId = beginCartOp();

		setCart((currentCart) => cartReducer(currentCart, { type: "REMOVE_ITEM", variantId }));

		try {
			const updatedCart = await removeFromCartAction(variantId);
			if (isLatestCartOp(opId)) {
				syncCartState(updatedCart ?? optimisticSnapshot);
				const confirmedCart = await fetchCart();
				if (isLatestCartOp(opId)) {
					syncCartState(confirmedCart ?? updatedCart ?? optimisticSnapshot);
				}
			}
		} catch (error) {
			console.error("Failed to remove from cart:", error);
			throw error;
		}
	};

	return (
		<CartContext.Provider
			value={{
				cart,
				isCartOpen,
				itemCount,
				openCart,
				closeCart,
				optimisticAdd,
				optimisticUpdate,
				optimisticRemove,
				cartReady,
				replaceCart,
				refreshCart,
			}}
		>
			{children}
		</CartContext.Provider>
	);
}

export function useCart() {
	const context = useContext(CartContext);
	if (!context) {
		throw new Error("useCart must be used within CartProvider");
	}

	return context;
}
