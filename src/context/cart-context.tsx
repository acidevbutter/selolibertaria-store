"use client";

import { useSearchParams } from "next/navigation";
import {
	createContext,
	type ReactNode,
	startTransition,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
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
					currency: "USD",
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

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
	const [cart, setCart] = useState<Cart | null>(null);
	const [isCartOpen, setIsCartOpen] = useState(false);
	const [cartReady, setCartReady] = useState(false);
	const latestCartOpRef = useRef(0);
	const searchParams = useSearchParams();

	const itemCount = cart?.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0;

	const beginCartOp = () => {
		latestCartOpRef.current += 1;
		return latestCartOpRef.current;
	};

	const isLatestCartOp = (opId: number) => latestCartOpRef.current === opId;

	const syncCartState = (nextCart: Cart | null) => {
		startTransition(() => {
			setCart(nextCart);
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
			console.error("Failed to fetch cart", error);
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
			console.error("Failed to refresh cart", error);
		}
	};

	const replaceCart = (nextCart: Cart | null) => {
		beginCartOp();
		syncCartState(nextCart);
	};

	useEffect(() => {
		let active = true;
		const opId = beginCartOp();

		void fetchCart()
			.then((nextCart) => {
				if (active && isLatestCartOp(opId)) {
					syncCartState(nextCart);
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
		const sessionId = searchParams?.get("session_id");
		const orderId = searchParams?.get("order");
		const paymentIntentId = searchParams?.get("payment_intent");

		if (!status || (!sessionId && !paymentIntentId && !orderId)) {
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
		const optimisticSnapshot = cartReducer(cart, {
			type: "ADD_ITEM",
			variantId,
			quantity,
			product,
		});
		const opId = beginCartOp();

		startTransition(() => {
			setCart((currentCart) => cartReducer(currentCart, { type: "ADD_ITEM", variantId, quantity, product }));
			setIsCartOpen(true);
		});

		try {
			const updatedCart = await addToCartAction(variantId, quantity);
			if (isLatestCartOp(opId) && updatedCart) {
				syncCartState(updatedCart);
			}

			const refreshedCart = await fetchCart();
			if (isLatestCartOp(opId)) {
				syncCartState(refreshedCart ?? updatedCart ?? optimisticSnapshot);
			}
		} catch (error) {
			console.error("Failed to add to cart:", error);
			throw error;
		}
	};

	const optimisticUpdate = async (variantId: string, quantity: number) => {
		const opId = beginCartOp();

		startTransition(() => {
			setCart((currentCart) => cartReducer(currentCart, { type: "UPDATE_ITEM", variantId, quantity }));
		});

		try {
			const updatedCart = await updateCartItemAction(variantId, quantity);
			if (isLatestCartOp(opId)) {
				syncCartState(updatedCart);
			}
		} catch (error) {
			console.error("Failed to update cart item:", error);
			throw error;
		}
	};

	const optimisticRemove = async (variantId: string) => {
		const opId = beginCartOp();

		startTransition(() => {
			setCart((currentCart) => cartReducer(currentCart, { type: "REMOVE_ITEM", variantId }));
		});

		try {
			const updatedCart = await removeFromCartAction(variantId);
			if (isLatestCartOp(opId)) {
				syncCartState(updatedCart);
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
