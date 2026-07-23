import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/env.mjs";

const MERCADO_PAGO_API_BASE_URL = "https://api.mercadopago.com";

export interface MercadoPagoCustomerCard {
	id?: string | number;
	token?: string;
	first_six_digits?: string;
	last_four_digits?: string;
	expiration_month?: number;
	expiration_year?: number;
	payment_method?: { id?: string; name?: string };
	issuer?: { id?: string | number; name?: string };
}

export interface MercadoPagoSavedCard {
	id: string;
	brand: string | null;
	lastFourDigits: string | null;
	expirationMonth: number | null;
	expirationYear: number | null;
}

function mercadoPagoError(payload: { message?: string; error?: string } | null, fallback: string) {
	return payload?.message || payload?.error || fallback;
}

async function mercadoPagoRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
	if (!env.MERCADO_PAGO_ACCESS_TOKEN) throw new Error("Mercado Pago não configurado");
	const response = await fetch(`${MERCADO_PAGO_API_BASE_URL}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`,
			...(init.body ? { "Content-Type": "application/json" } : {}),
			...init.headers,
		},
		cache: "no-store",
	});
	const payload = (await response.json().catch(() => null)) as
		| (T & { message?: string; error?: string })
		| null;
	if (!response.ok) throw new Error(mercadoPagoError(payload, "Falha na comunicação com o Mercado Pago"));
	return payload as T;
}

export function mapMercadoPagoSavedCard(card: MercadoPagoCustomerCard): MercadoPagoSavedCard | null {
	if (!card.id) return null;
	return {
		id: String(card.id),
		brand: card.payment_method?.name ?? card.payment_method?.id ?? null,
		lastFourDigits: card.last_four_digits ?? null,
		expirationMonth: Number.isInteger(card.expiration_month) ? card.expiration_month! : null,
		expirationYear: Number.isInteger(card.expiration_year) ? card.expiration_year! : null,
	};
}

export async function createMercadoPagoCustomer(input: {
	email: string;
	firstName?: string;
	lastName?: string;
	identification?: { type: string; number: string };
}) {
	return mercadoPagoRequest<{ id?: string | number }>("/v1/customers", {
		method: "POST",
		body: JSON.stringify({
			email: input.email,
			first_name: input.firstName,
			last_name: input.lastName,
			identification: input.identification,
		}),
	});
}

export async function listMercadoPagoCustomerCards(customerId: string) {
	const cards = await mercadoPagoRequest<MercadoPagoCustomerCard[] | { cards?: MercadoPagoCustomerCard[] }>(
		`/v1/customers/${encodeURIComponent(customerId)}/cards`,
	);
	return Array.isArray(cards) ? cards : (cards.cards ?? []);
}

export async function retrieveMercadoPagoCustomerCard(customerId: string, cardId: string) {
	return mercadoPagoRequest<MercadoPagoCustomerCard>(
		`/v1/customers/${encodeURIComponent(customerId)}/cards/${encodeURIComponent(cardId)}`,
	);
}

export async function addMercadoPagoCustomerCard(customerId: string, token: string) {
	return mercadoPagoRequest<MercadoPagoCustomerCard>(
		`/v1/customers/${encodeURIComponent(customerId)}/cards`,
		{
			method: "POST",
			body: JSON.stringify({ token }),
		},
	);
}

export async function removeMercadoPagoCustomerCard(customerId: string, cardId: string) {
	await mercadoPagoRequest<unknown>(
		`/v1/customers/${encodeURIComponent(customerId)}/cards/${encodeURIComponent(cardId)}`,
		{ method: "DELETE" },
	);
}

export function isMercadoPagoPixPayment(paymentMethodId?: string | null) {
	return paymentMethodId?.trim().toLowerCase() === "pix";
}

export function validateMercadoPagoWebhookSignature(input: {
	xSignature: string | null;
	xRequestId: string | null;
	dataId: string | null;
	secret?: string | null;
}) {
	if (!input.secret) return false;
	if (!input.xSignature || !input.xRequestId || !input.dataId) return false;

	const parts = Object.fromEntries(
		input.xSignature.split(",").map((part) => {
			const [key, value] = part.trim().split("=");
			return [key, value];
		}),
	);
	const ts = parts.ts;
	const expected = parts.v1;
	if (!ts || !expected) return false;

	const manifest = `id:${input.dataId};request-id:${input.xRequestId};ts:${ts};`;
	const calculated = createHmac("sha256", input.secret).update(manifest).digest("hex");
	const expectedBuffer = Buffer.from(expected, "hex");
	const calculatedBuffer = Buffer.from(calculated, "hex");
	return (
		expectedBuffer.length === calculatedBuffer.length && timingSafeEqual(expectedBuffer, calculatedBuffer)
	);
}
