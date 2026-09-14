"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type CheckoutLiveQuote = {
	amountTotal: number;
	shippingAmount: number;
	estimatedDays: number | null;
	currency: string;
};

type CheckoutQuoteContextValue = {
	quote: CheckoutLiveQuote | null;
	setQuote: (quote: CheckoutLiveQuote | null) => void;
};

const CheckoutQuoteContext = createContext<CheckoutQuoteContextValue | null>(null);

/**
 * Shares the shipping quote from the "Calcular total" step between the
 * checkout form and the order summary sidebar, which live in separate
 * client components under the same server page.
 */
export function CheckoutQuoteProvider({ children }: { children: React.ReactNode }) {
	const [quote, setQuote] = useState<CheckoutLiveQuote | null>(null);
	const value = useMemo(() => ({ quote, setQuote }), [quote]);
	return <CheckoutQuoteContext.Provider value={value}>{children}</CheckoutQuoteContext.Provider>;
}

export function useCheckoutQuote() {
	const context = useContext(CheckoutQuoteContext);
	if (!context) throw new Error("useCheckoutQuote must be used within a CheckoutQuoteProvider");
	return context;
}
