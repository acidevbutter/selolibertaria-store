import { z } from "zod";
import { formatNationalPhone } from "@/lib/location/countries";

export interface CheckoutBuyerDraft {
	fullName: string;
	email: string;
	cpf: string;
	phone: string;
}

function normalizeDigits(value?: string | null) {
	return (value || "").replace(/\D+/g, "");
}

export function normalizeBuyerName(value?: string | null) {
	return (value || "").replace(/\s+/g, " ").trim();
}

export function normalizeBuyerEmail(value?: string | null) {
	return (value || "").trim().toLowerCase();
}

function isValidCpf(value: string) {
	const digits = normalizeDigits(value);
	if (digits.length !== 11) return false;
	if (/^(\d)\1{10}$/.test(digits)) return false;

	const calcDigit = (base: string, factor: number) => {
		const total = base.split("").reduce((sum, digit) => sum + Number(digit) * factor--, 0);
		const remainder = (total * 10) % 11;
		return remainder === 10 ? 0 : remainder;
	};

	const firstDigit = calcDigit(digits.slice(0, 9), 10);
	const secondDigit = calcDigit(digits.slice(0, 10), 11);

	return firstDigit === Number(digits[9]) && secondDigit === Number(digits[10]);
}

function isValidCnpj(value: string) {
	const digits = normalizeDigits(value);
	if (digits.length !== 14) return false;
	if (/^(\d)\1{13}$/.test(digits)) return false;

	const calcDigit = (base: string, weights: number[]) => {
		const total = base.split("").reduce((sum, digit, index) => sum + Number(digit) * weights[index]!, 0);
		const remainder = total % 11;
		return remainder < 2 ? 0 : 11 - remainder;
	};

	return (
		calcDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(digits[12]) &&
		calcDigit(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(digits[13])
	);
}

export function getCheckoutIdentificationType(value?: string | null) {
	return normalizeDigits(value).length === 14 ? "CNPJ" : "CPF";
}

const checkoutBuyerSchema = z.object({
	fullName: z
		.string()
		.transform((value) => normalizeBuyerName(value))
		.refine((value) => value.length >= 3 && value.includes(" "), "Informe seu nome completo."),
	email: z
		.string()
		.transform((value) => normalizeBuyerEmail(value))
		.pipe(z.email("Informe um e-mail válido.")),
	cpf: z
		.string()
		.transform((value) => normalizeDigits(value))
		.refine((value) => isValidCpf(value) || isValidCnpj(value), "Informe um CPF ou CNPJ válido."),
	phone: z
		.string()
		.transform((value) => normalizeDigits(value))
		.refine((value) => value.length >= 10 && value.length <= 11, "Informe um telefone válido."),
});

export function normalizeCheckoutBuyer(input: unknown): CheckoutBuyerDraft {
	return checkoutBuyerSchema.parse(input);
}

export function getCheckoutBuyerFieldErrors(input: unknown) {
	const parsed = checkoutBuyerSchema.safeParse(input);
	if (parsed.success) return {};

	return parsed.error.issues.reduce<Record<string, string>>((accumulator, issue) => {
		const field = typeof issue.path[0] === "string" ? issue.path[0] : null;
		if (field && !accumulator[field]) {
			accumulator[field] = issue.message;
		}
		return accumulator;
	}, {});
}

export function formatCpf(value?: string | null) {
	const digits = normalizeDigits(value).slice(0, 14);
	if (digits.length > 11) {
		if (digits.length <= 2) return digits;
		if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
		if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
		if (digits.length <= 12)
			return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
		return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
	}
	if (digits.length <= 3) return digits;
	if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
	if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
	return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatCheckoutPhone(value?: string | null) {
	return formatNationalPhone("BR", normalizeDigits(value).slice(0, 11));
}
