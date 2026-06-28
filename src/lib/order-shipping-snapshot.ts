import type { CheckoutSnapshot } from "@/lib/checkout/cart-snapshot";
import type { CheckoutAddress, CheckoutDeliveryMethod } from "@/lib/shipping-core";

type ShippingRateInput =
	| CheckoutSnapshot["shippingRate"]
	| {
			providerCode?: string | null;
			serviceCode?: string | null;
			serviceName?: string | null;
			amount?: number | null;
			currency?: string | null;
			estimatedDays?: number | null;
			quotedAt?: string | Date | null;
	  }
	| null
	| undefined;

export interface PersistedOrderDeliveryAddress {
	line1?: string | null;
	line2?: string | null;
	number?: string | null;
	complement?: string | null;
	district?: string | null;
	city?: string | null;
	state?: string | null;
	postalCode?: string | null;
	country?: string | null;
}

export interface PersistedOrderShippingRate {
	providerCode: string;
	serviceCode: string;
	serviceName: string;
	amount: number;
	currency?: string | null;
	estimatedDays?: number | null;
	quotedAt?: string | null;
}

export interface PersistedOrderShippingSnapshot {
	deliveryMethod?: CheckoutDeliveryMethod | null;
	deliveryAddress?: PersistedOrderDeliveryAddress | null;
	shippingRate?: PersistedOrderShippingRate | null;
}

function normalizeText(value?: string | null) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

function normalizeCurrency(value?: string | null) {
	const trimmed = value?.trim();
	return trimmed ? trimmed.toUpperCase() : null;
}

function normalizeQuotedAt(value?: string | Date | null) {
	if (!value) return null;

	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function buildPersistedOrderDeliveryAddress(
	address?: CheckoutAddress | PersistedOrderDeliveryAddress | null,
): PersistedOrderDeliveryAddress | null {
	if (!address) return null;

	const normalized: PersistedOrderDeliveryAddress = {
		line1: normalizeText(address.line1),
		line2: normalizeText(address.line2),
		number: normalizeText(address.number),
		complement: normalizeText(address.complement),
		district: normalizeText(address.district),
		city: normalizeText(address.city),
		state: normalizeText(address.state),
		postalCode: normalizeText(address.postalCode),
		country: normalizeCurrency(address.country),
	};

	return Object.values(normalized).some(Boolean) ? normalized : null;
}

export function buildPersistedOrderShippingRate(rate?: ShippingRateInput): PersistedOrderShippingRate | null {
	if (!rate) return null;

	const providerCode = normalizeText(rate.providerCode);
	const serviceCode = normalizeText(rate.serviceCode);
	const serviceName = normalizeText(rate.serviceName);
	const amountSource =
		typeof (rate as { amount?: unknown }).amount === "number"
			? (rate as { amount: number }).amount
			: (rate as { fixed_amount?: { amount?: unknown } | null }).fixed_amount?.amount;
	const amount = typeof amountSource === "number" && Number.isFinite(amountSource) ? amountSource : null;

	if (!providerCode || !serviceCode || !serviceName || amount === null) return null;

	const estimatedDaysSource =
		typeof (rate as { estimatedDays?: unknown }).estimatedDays === "number"
			? (rate as { estimatedDays: number }).estimatedDays
			: (rate as { estimated_days?: unknown }).estimated_days;
	const estimatedDays =
		typeof estimatedDaysSource === "number" && Number.isFinite(estimatedDaysSource)
			? estimatedDaysSource
			: null;

	return {
		providerCode,
		serviceCode,
		serviceName,
		amount,
		currency: normalizeCurrency((rate as { currency?: string | null }).currency),
		estimatedDays,
		quotedAt: normalizeQuotedAt((rate as { quotedAt?: string | Date | null }).quotedAt),
	};
}

export function buildPersistedOrderShippingSnapshot(input: {
	deliveryMethod?: CheckoutDeliveryMethod | null;
	deliveryAddress?: CheckoutAddress | PersistedOrderDeliveryAddress | null;
	shippingRate?: ShippingRateInput;
}): PersistedOrderShippingSnapshot {
	return {
		deliveryMethod: input.deliveryMethod ?? null,
		deliveryAddress: buildPersistedOrderDeliveryAddress(input.deliveryAddress),
		shippingRate: buildPersistedOrderShippingRate(input.shippingRate),
	};
}
