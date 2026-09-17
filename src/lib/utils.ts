import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const slugify = (text: string) => {
	return text
		.toString() // Cast to string (optional)
		.normalize("NFKD") // The normalize() using NFKD method returns the Unicode Normalization Form of a given string.
		.toLowerCase() // Convert the string to lowercase letters
		.trim() // Remove whitespace from both sides of a string (optional)
		.replace(/\s+/g, "-") // Replace spaces with -
		.replace(/[^\w-]+/g, "") // Remove all non-word chars
		.replace(/_/g, "-") // Replace _ with -
		.replace(/--+/g, "-") // Replace multiple - with single -
		.replace(/-$/g, ""); // Remove trailing -
};

export const capitalize = (str: string) => (str[0] ? str[0].toUpperCase() + str.slice(1) : "");

export const deslugify = (slug: string) => {
	return slug
		.split("-")
		.map((part) => capitalize(part))
		.join(" ");
};

export const formatProductName = (name: string, variant?: string) => {
	if (!variant) {
		return name;
	}
	return `${name} (${deslugify(variant)})`;
};

type Money = { amount: number; currency: string };

export function invariant(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}

export const assertInteger = (value: number) => {
	invariant(Number.isInteger(value), "Value must be an integer");
};

const getCurrencyDecimals = (currency: string) => {
	invariant(currency.length === 3, "currency needs to be a 3-letter code");

	const decimals = currencyDecimals[currency.toUpperCase()] ?? 2;
	return decimals;
};

export const getMinorAmountFromDecimal = ({ amount: major, currency }: Money) => {
	const decimals = getCurrencyDecimals(currency);
	const multiplier = 10 ** decimals;
	return Number.parseInt((major * multiplier).toFixed(0), 10);
};

export const getDecimalFromMinorAmount = ({ amount: minor, currency }: Money) => {
	assertInteger(minor);
	const decimals = getCurrencyDecimals(currency);
	const multiplier = 10 ** decimals;
	return Number.parseFloat((minor / multiplier).toFixed(decimals));
};

export const formatMoney = ({ amount: minor, currency, locale = "pt-BR" }: Money & { locale?: string }) => {
	const amount = getDecimalFromMinorAmount({ amount: minor, currency });
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
	}).format(amount);
};

const currencyDecimals: Record<string, number> = {
	BIF: 0,
	CLP: 0,
	DJF: 0,
	GNF: 0,
	JPY: 0,
	KMF: 0,
	KRW: 0,
	MGA: 0,
	PYG: 0,
	RWF: 0,
	UGX: 0,
	VND: 0,
	VUV: 0,
	XAF: 0,
	XOF: 0,
	XPF: 0,

	BHD: 3,
	JOD: 3,
	KWD: 3,
	OMR: 3,
	TND: 3,
};
