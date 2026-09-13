"server-only";

import { env } from "@/env.mjs";
import type { MelhorEnvioSettings, ShippingProvidersSettings } from "@/lib/settings";
import {
	type CheckoutAddress,
	type CheckoutDeliveryMethod,
	normalizeShippingProviderInput,
	type ShippingProviderInput,
	type ShippingQuote,
	type ShippingQuoteResolution,
	type ShippingRate,
	selectBestShippingQuote,
	toShippingRate,
} from "@/lib/shipping-core";

type QuoteItem = {
	productId: string;
	variantId: string;
	quantity: number;
	price: number;
	productType?: string | null;
	format?: string | null;
};

function toQuote(value: Record<string, unknown>): ShippingQuote {
	return {
		providerCode: String(value.provider_code ?? "melhor-envio"),
		providerLabel: String(value.provider_label ?? "Melhor Envio"),
		serviceCode: String(value.service_code ?? "shipping"),
		serviceName: String(value.service_name ?? value.service_code ?? "Frete"),
		amount: Number(value.amount ?? 0),
		currency: String(value.currency ?? "BRL"),
		estimatedDays: typeof value.estimated_days === "number" ? value.estimated_days : null,
		quotedAt: typeof value.quoted_at === "string" ? value.quoted_at : null,
		method: value.method === "flat" ? "flat" : "http",
	};
}

async function requestQuote(body: Record<string, unknown>): Promise<ShippingQuoteResolution> {
	const response = await fetch(`${env.FASTAPI_API_URL}/shipping/quote`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY,
		},
		body: JSON.stringify(body),
		cache: "no-store",
	});
	const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
	if (!response.ok)
		throw new Error(typeof payload?.detail === "string" ? payload.detail : "Não foi possível cotar o frete.");
	const quotes = Array.isArray(payload?.quotes)
		? payload.quotes
				.filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object"))
				.map(toQuote)
		: [];
	const selected =
		payload?.selected && typeof payload.selected === "object"
			? toQuote(payload.selected as Record<string, unknown>)
			: null;
	return { quotes, selected, error: typeof payload?.error === "string" ? payload.error : null };
}

export async function resolveShippingQuotesForUser(args: {
	userId: string;
	subtotal: number;
	currency: string;
	items: QuoteItem[];
}): Promise<ShippingQuoteResolution & { provider: null }> {
	return {
		...(await requestQuote({
			user_id: args.userId,
			destination: {},
			subtotal: Math.round(args.subtotal),
			currency: args.currency,
			delivery_method: "saved-address",
			items: args.items.map((item) => ({
				quantity: item.quantity,
				product_type: item.productType,
				format: item.format,
			})),
		})),
		provider: null,
	};
}

export async function resolveShippingQuotesForDestination(args: {
	destination?: CheckoutAddress | null;
	subtotal: number;
	currency: string;
	items: QuoteItem[];
	deliveryMethod: CheckoutDeliveryMethod;
}): Promise<ShippingQuoteResolution & { provider: null }> {
	const resolution = await requestQuote({
		destination: {
			country: args.destination?.country ?? "BR",
			postal_code: args.destination?.postalCode ?? null,
		},
		subtotal: Math.round(args.subtotal),
		currency: args.currency,
		delivery_method: args.deliveryMethod,
		items: args.items.map((item) => ({
			quantity: item.quantity,
			product_type: item.productType,
			format: item.format,
		})),
	});
	return { ...resolution, provider: null };
}

export function serializeMelhorEnvioSettingsForAdmin(
	value?: MelhorEnvioSettings | null,
	providers?: ShippingProvidersSettings,
): MelhorEnvioSettings | null {
	if (!value && !providers?.length) return value ?? null;
	return {
		...(value ?? {}),
		envTokenStatus: value?.envTokenStatus ?? "missing",
		oauthStatus: "coming-soon",
	};
}

export { normalizeShippingProviderInput, selectBestShippingQuote, toShippingRate };
export type { ShippingProviderInput, ShippingQuote, ShippingQuoteResolution, ShippingRate };
