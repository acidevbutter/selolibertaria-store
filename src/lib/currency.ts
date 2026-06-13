import type { AppLocale } from "@/i18n/config";

export const CURRENCY_COOKIE_NAME = "storefront_currency";

export const CURRENCY_OPTIONS = [
	{ code: "USD", label: "US Dollar" },
	{ code: "BRL", label: "Brazilian Real" },
	{ code: "EUR", label: "Euro" },
] as const;

export type SupportedCurrency = (typeof CURRENCY_OPTIONS)[number]["code"];

const supportedCurrencySet = new Set<string>(CURRENCY_OPTIONS.map((currency) => currency.code));

export function resolveSupportedCurrency(value: string | null | undefined): SupportedCurrency | null {
	if (!value) return null;
	const normalized = value.trim().toUpperCase();
	return supportedCurrencySet.has(normalized) ? (normalized as SupportedCurrency) : null;
}

export function getDefaultCurrencyForLocale(
	locale: string | AppLocale | null | undefined,
): SupportedCurrency {
	const normalized = String(locale || "")
		.trim()
		.toLowerCase();
	if (normalized.startsWith("pt")) return "BRL";
	if (normalized.startsWith("es")) return "EUR";
	return "USD";
}

export function getCurrencyLabel(currency: SupportedCurrency) {
	return CURRENCY_OPTIONS.find((option) => option.code === currency)?.label ?? currency;
}
