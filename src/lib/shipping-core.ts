import type {
	ShippingProviderEnvironment,
	ShippingProviderMode,
	ShippingProviderSettings,
} from "@/lib/settings";
import { getShippingProviderPreset } from "@/lib/shipping-provider-presets";

export interface ShippingDestination {
	country?: string | null;
	postalCode?: string | null;
}

export interface CheckoutAddress extends ShippingDestination {
	line1?: string | null;
	line2?: string | null;
	number?: string | null;
	complement?: string | null;
	district?: string | null;
	city?: string | null;
	state?: string | null;
}

export type CheckoutDeliveryMethod = "saved-address" | "new-address";

export interface ShippingQuote {
	providerCode: string;
	providerLabel: string;
	serviceCode: string;
	serviceName: string;
	amount: number;
	currency: string;
	estimatedDays: number | null;
	quotedAt?: string | null;
	method: ShippingProviderMode;
}

export interface ShippingRate {
	providerCode: string;
	providerLabel: string;
	serviceCode: string;
	serviceName: string;
	fixed_amount: { amount: number };
	currency?: string;
	estimated_days?: number | null;
	quotedAt?: string | null;
}

export interface ShippingQuoteResolution {
	quotes: ShippingQuote[];
	selected: ShippingQuote | null;
	error?: string | null;
}

export type ShippingProviderInput = ShippingProviderSettings & {
	apiKey?: string | null;
	credentials?: Record<string, string | null | undefined>;
	priority?: number | string | null;
	fixedAmount?: number | string | null;
	estimatedDays?: number | string | null;
	defaultWeightGrams?: number | string | null;
	defaultLengthCm?: number | string | null;
	defaultWidthCm?: number | string | null;
	defaultHeightCm?: number | string | null;
};

function slugify(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);
}

function normalizeCountryCode(value?: string | null) {
	const normalized = value?.trim().toUpperCase() ?? "";
	return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function normalizePriority(value?: number | string | null) {
	const numeric = typeof value === "number" ? value : Number.parseInt(String(value ?? 0), 10);
	return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeSupportedCountries(value?: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return Array.from(
		new Set(
			value
				.map((entry) => (typeof entry === "string" ? normalizeCountryCode(entry) : null))
				.filter((entry): entry is string => Boolean(entry)),
		),
	);
}

function normalizeShippingProviderCode(value: string, fallbackLabel: string) {
	return slugify(value || fallbackLabel) || slugify(fallbackLabel) || "shipping-provider";
}

function normalizeEnvironment(value?: string | null): ShippingProviderEnvironment {
	return value === "production" ? "production" : "sandbox";
}

function normalizeEndpointPath(value?: string | null) {
	const trimmed = value?.trim() ?? "";
	if (!trimmed) return null;
	return trimmed.startsWith("/") || trimmed.startsWith("http") ? trimmed : `/${trimmed}`;
}

function normalizeCredentials(
	value?: Record<string, string | null | undefined> | null,
): Record<string, string> | null {
	if (!value || typeof value !== "object") return null;
	const entries = Object.entries(value)
		.map(([key, rawValue]) => [key, typeof rawValue === "string" ? rawValue.trim() : ""] as const)
		.filter(([, rawValue]) => rawValue.length > 0);
	return entries.length > 0 ? Object.fromEntries(entries) : null;
}

export function normalizeShippingProviderInput(
	value: ShippingProviderInput,
	index = 0,
): ShippingProviderSettings {
	const label = value.label?.trim() || `Provedor ${index + 1}`;
	const code = normalizeShippingProviderCode(value.code?.trim() || "", label);
	const preset = getShippingProviderPreset(value.kind);
	const credentials =
		normalizeCredentials(value.credentials) ??
		(value.apiKey?.trim() ? { apiKey: value.apiKey.trim() } : null);
	return {
		code,
		label,
		enabled: value.enabled !== false,
		priority: normalizePriority(value.priority),
		mode: value.mode === "http" || Boolean(value.endpointUrl) || value.kind !== "custom" ? "http" : "flat",
		kind: value.kind ?? "custom",
		authType: value.authType ?? preset.defaultAuthType,
		baseUrl: value.baseUrl?.trim() || preset.defaultBaseUrl || null,
		environment: normalizeEnvironment(value.environment ?? preset.defaultEnvironment),
		endpointUrl: value.endpointUrl?.trim() || value.endpoints?.quote?.trim() || null,
		apiKeyEncrypted: value.apiKeyEncrypted ?? null,
		apiKeyMasked: value.apiKeyMasked ?? null,
		credentialsEncrypted: value.credentialsEncrypted ?? null,
		credentialsMasked:
			value.credentialsMasked ??
			(credentials ? Object.fromEntries(Object.keys(credentials).map((key) => [key, "configured"])) : null),
		endpoints: {
			quote: normalizeEndpointPath(
				value.endpoints?.quote ?? value.endpointUrl ?? preset.defaultEndpoints.quote,
			),
			shipment: normalizeEndpointPath(value.endpoints?.shipment ?? preset.defaultEndpoints.shipment),
			tracking: normalizeEndpointPath(value.endpoints?.tracking ?? preset.defaultEndpoints.tracking),
			token: normalizeEndpointPath(value.endpoints?.token ?? preset.defaultEndpoints.token),
		},
		serviceCode: value.serviceCode?.trim() || null,
		serviceName: value.serviceName?.trim() || null,
		fixedAmount:
			typeof value.fixedAmount === "number"
				? value.fixedAmount
				: value.fixedAmount !== undefined && value.fixedAmount !== null && value.fixedAmount !== ""
					? Number.isFinite(Number(value.fixedAmount))
						? Number(value.fixedAmount)
						: null
					: null,
		estimatedDays:
			typeof value.estimatedDays === "number"
				? value.estimatedDays
				: value.estimatedDays !== undefined && value.estimatedDays !== null && value.estimatedDays !== ""
					? Number.isFinite(Number(value.estimatedDays))
						? Number(value.estimatedDays)
						: null
					: null,
		supportedCountries: normalizeSupportedCountries(
			value.supportedCountries ?? preset.defaultSupportedCountries,
		),
		requiresPostalCode:
			value.requiresPostalCode !== undefined
				? value.requiresPostalCode === true
				: preset.defaultRequiresPostalCode,
		defaultWeightGrams:
			typeof value.defaultWeightGrams === "number"
				? value.defaultWeightGrams
				: value.defaultWeightGrams !== undefined &&
						value.defaultWeightGrams !== null &&
						value.defaultWeightGrams !== ""
					? Number.isFinite(Number(value.defaultWeightGrams))
						? Number(value.defaultWeightGrams)
						: null
					: null,
		defaultLengthCm:
			typeof value.defaultLengthCm === "number"
				? value.defaultLengthCm
				: value.defaultLengthCm !== undefined &&
						value.defaultLengthCm !== null &&
						value.defaultLengthCm !== ""
					? Number.isFinite(Number(value.defaultLengthCm))
						? Number(value.defaultLengthCm)
						: null
					: null,
		defaultWidthCm:
			typeof value.defaultWidthCm === "number"
				? value.defaultWidthCm
				: value.defaultWidthCm !== undefined && value.defaultWidthCm !== null && value.defaultWidthCm !== ""
					? Number.isFinite(Number(value.defaultWidthCm))
						? Number(value.defaultWidthCm)
						: null
					: null,
		defaultHeightCm:
			typeof value.defaultHeightCm === "number"
				? value.defaultHeightCm
				: value.defaultHeightCm !== undefined &&
						value.defaultHeightCm !== null &&
						value.defaultHeightCm !== ""
					? Number.isFinite(Number(value.defaultHeightCm))
						? Number(value.defaultHeightCm)
						: null
					: null,
		lastUpdatedAt: value.lastUpdatedAt ?? null,
		lastUpdatedBy: value.lastUpdatedBy ?? null,
	};
}

export function selectBestShippingQuote(quotes: ShippingQuote[]) {
	return (
		[...quotes].sort((a, b) => a.amount - b.amount || (a.estimatedDays ?? 0) - (b.estimatedDays ?? 0))[0] ??
		null
	);
}

export function toShippingRate(quote: ShippingQuote | null): ShippingRate | null {
	if (!quote) return null;
	return {
		providerCode: quote.providerCode,
		providerLabel: quote.providerLabel,
		serviceCode: quote.serviceCode,
		serviceName: quote.serviceName,
		fixed_amount: { amount: quote.amount },
		currency: quote.currency,
		estimated_days: quote.estimatedDays,
		quotedAt: quote.quotedAt ?? null,
	};
}
