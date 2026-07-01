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
		.refine((value) => isValidCpf(value), "Informe um CPF válido."),
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
	const digits = normalizeDigits(value).slice(0, 11);
	if (digits.length <= 3) return digits;
	if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
	if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
	return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatCheckoutPhone(value?: string | null) {
	return formatNationalPhone("BR", normalizeDigits(value).slice(0, 11));
}
