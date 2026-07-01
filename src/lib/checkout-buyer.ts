import { z } from "zod";

export interface CheckoutBuyerDraft {
	fullName: string;
	email: string;
	cpf: string;
	phone: string;
}

const checkoutBuyerSchema = z.object({
	fullName: z.string().trim().min(3, "Informe seu nome completo."),
	email: z.email("Informe um e-mail válido.").transform((value) => value.trim().toLowerCase()),
	cpf: z
		.string()
		.transform((value) => value.replace(/\D+/g, ""))
		.refine((value) => value.length === 11, "Informe um CPF válido."),
	phone: z
		.string()
		.transform((value) => value.trim())
		.refine((value) => value.replace(/\D+/g, "").length >= 10, "Informe um telefone válido."),
});

export function normalizeCheckoutBuyer(input: unknown): CheckoutBuyerDraft {
	return checkoutBuyerSchema.parse(input);
}

export function formatCpf(value?: string | null) {
	const digits = (value || "").replace(/\D+/g, "");
	if (digits.length !== 11) return value || "";
	return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
