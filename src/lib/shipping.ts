"server-only";

import { ObjectId } from "mongodb";
import { env } from "@/env.mjs";
import { getDb } from "@/lib/mongodb";
import { decryptStoredSecret } from "@/lib/oauth/secrets";
import type { ShippingProviderSettings, ShippingProvidersSettings } from "@/lib/settings";
import { getDefaultCountrySetting, getSettingsDoc } from "@/lib/settings-store";
import {
	type CheckoutAddress,
	type CheckoutDeliveryMethod,
	normalizeShippingProviderInput,
	type ShippingDestination,
	type ShippingProviderInput,
	type ShippingQuote,
	type ShippingQuoteResolution,
	type ShippingRate,
	selectBestShippingQuote,
	toShippingRate,
} from "@/lib/shipping-core";
import { fetchMelhorEnvioQuotes } from "@/lib/shipping-melhor-envio";

const REQUEST_TIMEOUT_MS = 8_000;

type QuoteItem = { productId: string; variantId: string; quantity: number; price: number };
type RuntimePackageSummary = {
	weightGrams: number;
	lengthCm: number;
	widthCm: number;
	heightCm: number;
};

function parseEnvBoolean(value?: string | null) {
	const normalized = value?.trim().toLowerCase() ?? "";
	if (!normalized) return false;
	return ["1", "true", "yes", "on"].includes(normalized);
}

function parseEnvNumber(value: string | undefined, fallback: number) {
	const numeric = Number(value);
	return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function normalizeCountryCode(value?: string | null) {
	const normalized = value?.trim().toUpperCase() ?? "";
	return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function normalizePostalCode(value?: string | null) {
	const trimmed = value?.trim() ?? "";
	return trimmed ? trimmed : null;
}

function buildAbsoluteUrl(baseUrl?: string | null, path?: string | null) {
	const base = baseUrl?.trim() ?? "";
	const endpoint = path?.trim() ?? "";
	if (!base && !endpoint) return null;
	if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) return endpoint;
	if (!base) return endpoint || null;
	if (!endpoint) return base;
	return `${base.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;
}

function maskPlainSecret(value: string) {
	if (!value.trim()) return "";
	if (value.length <= 4) return "****";
	return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

function decryptProviderCredentials(provider: ShippingProviderSettings) {
	const next: Record<string, string> = {};
	if (isMelhorEnvioProvider(provider) && parseEnvBoolean(env.MELHOR_ENVIO_ENABLED)) {
		if (env.MELHOR_ENVIO_ACCESS_TOKEN?.trim()) next.accessToken = env.MELHOR_ENVIO_ACCESS_TOKEN.trim();
		if (env.MELHOR_ENVIO_ORIGIN_POSTAL_CODE?.trim()) {
			next.originPostalCode = env.MELHOR_ENVIO_ORIGIN_POSTAL_CODE.trim();
		}
		if (env.MELHOR_ENVIO_USER_AGENT?.trim()) next.userAgent = env.MELHOR_ENVIO_USER_AGENT.trim();
		if (env.MELHOR_ENVIO_CONTACT_EMAIL?.trim()) {
			next.contactEmail = env.MELHOR_ENVIO_CONTACT_EMAIL.trim();
		}
	}
	if (provider.credentialsEncrypted) {
		const decrypted = decryptStoredSecret(provider.credentialsEncrypted);
		if (decrypted) {
			try {
				const parsed = JSON.parse(decrypted) as Record<string, unknown>;
				for (const [key, rawValue] of Object.entries(parsed)) {
					if (typeof rawValue === "string" && rawValue.trim()) next[key] = rawValue.trim();
				}
			} catch {
				// Ignore malformed legacy payloads and fall through to other fields.
			}
		}
	}
	if (!provider.credentialsEncrypted && provider.apiKeyEncrypted) {
		const legacyApiKey = decryptStoredSecret(provider.apiKeyEncrypted);
		if (legacyApiKey?.trim()) next.apiKey = legacyApiKey.trim();
	}
	return next;
}

export function serializeShippingProviderForAdmin(
	value: ShippingProviderSettings | undefined,
	index = 0,
): ShippingProviderSettings {
	const normalized = normalizeShippingProviderInput(value ?? { code: "", label: "" }, index);
	const credentials = decryptProviderCredentials(normalized);
	return {
		...normalized,
		apiKeyEncrypted: null,
		credentialsEncrypted: null,
		credentialsMasked:
			Object.keys(credentials).length > 0
				? Object.fromEntries(
						Object.entries(credentials).map(([key, rawValue]) => [key, maskPlainSecret(rawValue)]),
					)
				: (normalized.credentialsMasked ?? null),
		apiKeyMasked:
			normalized.apiKeyEncrypted && !credentials.apiKey
				? maskPlainSecret(decryptStoredSecret(normalized.apiKeyEncrypted) ?? "")
				: (normalized.apiKeyMasked ?? null),
	};
}

export function serializeShippingProvidersForAdmin(
	value: ShippingProvidersSettings | undefined,
): ShippingProvidersSettings {
	return (value ?? []).map((provider, index) => serializeShippingProviderForAdmin(provider, index));
}

async function resolveUserShippingDestination(userId: string) {
	const db = await getDb();
	const user = await db
		.collection<{
			address?: { country?: string | null; postalCode?: string | null };
		}>("users")
		.findOne({ _id: new ObjectId(userId) }, { projection: { address: 1 } });

	const settings = await getSettingsDoc();
	const country =
		normalizeCountryCode(user?.address?.country) ?? normalizeCountryCode(settings?.current?.defaultCountry);
	const postalCode = normalizePostalCode(user?.address?.postalCode);

	return {
		country: country ?? (await getDefaultCountrySetting()) ?? null,
		postalCode,
	};
}

function normalizeShippingProviderRuntime(
	value: ShippingProviderSettings | undefined,
	index = 0,
): ShippingProviderSettings {
	return normalizeShippingProviderInput(value ?? { code: "", label: "" }, index);
}

function buildFlatQuote(
	provider: ShippingProviderSettings,
	destination: ShippingDestination,
	currency: string,
): ShippingQuote | null {
	if (provider.supportedCountries?.length) {
		const country = normalizeCountryCode(destination.country);
		if (!country || !provider.supportedCountries.includes(country)) return null;
	}
	if (provider.requiresPostalCode && !normalizePostalCode(destination.postalCode)) return null;
	const amount = Number.isFinite(provider.fixedAmount ?? Number.NaN) ? Number(provider.fixedAmount) : null;
	if (amount === null) return null;
	return {
		providerCode: provider.code,
		providerLabel: provider.label,
		serviceCode: provider.serviceCode ?? provider.code,
		serviceName: provider.serviceName ?? provider.label,
		amount,
		currency: currency.toUpperCase(),
		estimatedDays: typeof provider.estimatedDays === "number" ? provider.estimatedDays : null,
		method: provider.mode ?? "flat",
	};
}

function buildPickupQuote(currency: string): ShippingQuote {
	return {
		providerCode: "pickup",
		providerLabel: "Retirada na loja",
		serviceCode: "pickup",
		serviceName: "Retirar na loja",
		amount: 0,
		currency: currency.toUpperCase(),
		estimatedDays: 1,
		method: "flat",
	};
}

function buildPackageSummary(provider: ShippingProviderSettings, items: QuoteItem[]): RuntimePackageSummary {
	const totalQuantity = Math.max(
		1,
		items.reduce((sum, item) => sum + Math.max(1, item.quantity), 0),
	);
	return {
		weightGrams: Math.max(1, (provider.defaultWeightGrams ?? 300) * totalQuantity),
		lengthCm: Math.max(1, provider.defaultLengthCm ?? 20),
		widthCm: Math.max(1, provider.defaultWidthCm ?? 20),
		heightCm: Math.max(1, provider.defaultHeightCm ?? 10),
	};
}

function isMelhorEnvioProvider(provider: ShippingProviderSettings) {
	const kind = String(provider.kind ?? "").toLowerCase();
	const baseUrl = String(provider.baseUrl ?? "").toLowerCase();
	const endpointUrl = String(provider.endpointUrl ?? "").toLowerCase();
	const quoteEndpoint = String(provider.endpoints?.quote ?? "").toLowerCase();

	return (
		kind === "melhorenvio" ||
		baseUrl.includes("melhorenvio.com.br") ||
		endpointUrl.includes("me/shipment/calculate") ||
		quoteEndpoint.includes("me/shipment/calculate")
	);
}

function shouldPreferMelhorEnvio(destination: ShippingDestination, providers: ShippingProviderSettings[]) {
	const destinationCountry = normalizeCountryCode(destination.country);
	const destinationPostalCode = normalizePostalCode(destination.postalCode);

	return (
		destinationCountry === "BR" &&
		Boolean(destinationPostalCode) &&
		providers.some((provider) => provider.mode === "http" && isMelhorEnvioProvider(provider))
	);
}

function buildEnvMelhorEnvioProvider(): ShippingProviderSettings | null {
	if (!parseEnvBoolean(env.MELHOR_ENVIO_ENABLED)) return null;

	const accessToken = env.MELHOR_ENVIO_ACCESS_TOKEN?.trim() ?? "";
	const originPostalCode = env.MELHOR_ENVIO_ORIGIN_POSTAL_CODE?.trim() ?? "";
	if (!accessToken || !originPostalCode) return null;

	const credentials: Record<string, string> = {
		accessToken,
		originPostalCode,
	};

	if (env.MELHOR_ENVIO_USER_AGENT?.trim()) {
		credentials.userAgent = env.MELHOR_ENVIO_USER_AGENT.trim();
	}

	if (env.MELHOR_ENVIO_CONTACT_EMAIL?.trim()) {
		credentials.contactEmail = env.MELHOR_ENVIO_CONTACT_EMAIL.trim();
	}

	return normalizeShippingProviderInput(
		{
			code: "melhorenvio",
			label: "Melhor Envio",
			enabled: true,
			priority: 0,
			mode: "http",
			kind: "melhorenvio",
			authType: "bearer",
			baseUrl: env.MELHOR_ENVIO_BASE_URL?.trim() || "https://www.melhorenvio.com.br/api/v2",
			environment: env.MELHOR_ENVIO_ENVIRONMENT === "production" ? "production" : "sandbox",
			endpoints: {
				quote: "/me/shipment/calculate",
				shipment: null,
				tracking: null,
				token: null,
			},
			supportedCountries: ["BR"],
			requiresPostalCode: true,
			defaultWeightGrams: parseEnvNumber(env.MELHOR_ENVIO_DEFAULT_WEIGHT_GRAMS, 300),
			defaultLengthCm: parseEnvNumber(env.MELHOR_ENVIO_DEFAULT_LENGTH_CM, 20),
			defaultWidthCm: parseEnvNumber(env.MELHOR_ENVIO_DEFAULT_WIDTH_CM, 20),
			defaultHeightCm: parseEnvNumber(env.MELHOR_ENVIO_DEFAULT_HEIGHT_CM, 10),
			credentialsMasked: {
				accessToken: maskPlainSecret(accessToken),
				originPostalCode: maskPlainSecret(originPostalCode),
				...(credentials.contactEmail ? { contactEmail: maskPlainSecret(credentials.contactEmail) } : {}),
				...(credentials.userAgent ? { userAgent: maskPlainSecret(credentials.userAgent) } : {}),
			},
			credentialsEncrypted: null,
		},
		0,
	);
}

function buildMelhorEnvioUserAgent(credentials: Record<string, string>, provider: ShippingProviderSettings) {
	const explicitUserAgent = credentials.userAgent?.trim();
	if (explicitUserAgent) return explicitUserAgent;

	const technicalEmail = credentials.technicalEmail?.trim() || credentials.contactEmail?.trim();
	const applicationName = credentials.applicationName?.trim() || provider.label.trim();
	if (technicalEmail) return `${applicationName} (${technicalEmail})`;

	return "";
}

async function fetchJson(input: string, init: RequestInit) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	try {
		const response = await fetch(input, { ...init, signal: controller.signal });
		const text = await response.text();
		const payload = text ? (JSON.parse(text) as unknown) : null;
		return { ok: response.ok, status: response.status, payload };
	} catch {
		return { ok: false, status: 500, payload: null };
	} finally {
		clearTimeout(timeout);
	}
}

function normalizeHttpService(
	provider: ShippingProviderSettings,
	service: unknown,
	currency: string,
	index: number,
): ShippingQuote | null {
	if (!service || typeof service !== "object") return null;
	const record = service as Record<string, unknown>;
	const amountRaw =
		record.amount ?? record.price ?? record.value ?? record.unitAmount ?? record.rate ?? record.total;
	const amount = Math.round(Number(amountRaw ?? 0));
	if (!Number.isFinite(amount)) return null;
	if (record.available === false) return null;
	const serviceCode =
		typeof record.code === "string"
			? record.code
			: typeof record.serviceCode === "string"
				? record.serviceCode
				: `${provider.code}-${index + 1}`;
	const serviceName =
		typeof record.name === "string"
			? record.name
			: typeof record.serviceName === "string"
				? record.serviceName
				: (provider.serviceName ?? provider.label);
	const estimatedDaysRaw =
		record.estimatedDays ?? record.days ?? record.slaDays ?? record.delivery_time ?? record.deliveryDays;
	const estimatedDays = Number.isFinite(Number(estimatedDaysRaw)) ? Number(estimatedDaysRaw) : null;
	return {
		providerCode: provider.code,
		providerLabel: provider.label,
		serviceCode,
		serviceName,
		amount,
		currency: currency.toUpperCase(),
		estimatedDays,
		method: provider.mode ?? "http",
	};
}

function extractServicesFromPayload(payload: unknown): unknown[] {
	if (!payload || typeof payload !== "object") return [];
	const record = payload as Record<string, unknown>;
	if (Array.isArray(record.services)) return record.services;
	if (Array.isArray(record.rates)) return record.rates;
	if (Array.isArray(record.quote)) return record.quote;
	if (record.quote && typeof record.quote === "object") return [record.quote];
	if (record.service && typeof record.service === "object") return [record.service];
	if (record.amount !== undefined) return [{ amount: record.amount }];
	return [];
}

async function buildCustomHttpQuotes(
	provider: ShippingProviderSettings,
	destination: ShippingDestination,
	currency: string,
	subtotal: number,
	items: QuoteItem[],
): Promise<ShippingQuote[]> {
	const url = buildAbsoluteUrl(provider.baseUrl, provider.endpoints?.quote ?? provider.endpointUrl);
	if (!url) return [];
	const credentials = decryptProviderCredentials(provider);
	const packageSummary = buildPackageSummary(provider, items);
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (provider.authType === "bearer" && credentials.apiKey) {
		headers.Authorization = `Bearer ${credentials.apiKey}`;
	}
	if (provider.authType === "basic" && credentials.apiKey) {
		headers.Authorization = `Basic ${Buffer.from(`${credentials.apiKey}:`).toString("base64")}`;
	}
	const response = await fetchJson(url, {
		method: "POST",
		headers,
		body: JSON.stringify({
			provider: { code: provider.code, label: provider.label, kind: provider.kind ?? "custom" },
			origin: {
				postalCode: credentials.originPostalCode ?? credentials.fromPostalCode ?? null,
				country: credentials.originCountry ?? credentials.fromCountry ?? null,
			},
			destination,
			currency: currency.toUpperCase(),
			subtotal,
			items,
			package: packageSummary,
		}),
	});
	if (!response.ok) return [];
	return extractServicesFromPayload(response.payload)
		.map((service, index) => normalizeHttpService(provider, service, currency, index))
		.filter((quote): quote is ShippingQuote => quote !== null);
}

async function fetchCorreiosToken(provider: ShippingProviderSettings, credentials: Record<string, string>) {
	const tokenUrl = buildAbsoluteUrl(provider.baseUrl, provider.endpoints?.token);
	if (!tokenUrl || !credentials.username || !credentials.accessCode) return null;
	const response = await fetchJson(tokenUrl, {
		method: "POST",
		headers: {
			Authorization: `Basic ${Buffer.from(`${credentials.username}:${credentials.accessCode}`).toString("base64")}`,
			"Content-Type": "application/json",
		},
	});
	if (!response.ok || !response.payload || typeof response.payload !== "object") return null;
	const record = response.payload as Record<string, unknown>;
	for (const candidate of [record.token, record.access_token, record.jwt, record.id_token]) {
		if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
	}
	return null;
}

async function buildCorreiosQuotes(
	provider: ShippingProviderSettings,
	destination: ShippingDestination,
	currency: string,
	items: QuoteItem[],
): Promise<ShippingQuote[]> {
	const credentials = decryptProviderCredentials(provider);
	const originPostalCode = normalizePostalCode(credentials.originPostalCode);
	const destinationPostalCode = normalizePostalCode(destination.postalCode);
	const serviceCode = provider.serviceCode?.trim();
	if (!originPostalCode || !destinationPostalCode || !serviceCode) return [];
	const quoteUrl = buildAbsoluteUrl(provider.baseUrl, provider.endpoints?.quote);
	if (!quoteUrl) return [];

	const token = await fetchCorreiosToken(provider, credentials);
	if (!token) return [];

	const packageSummary = buildPackageSummary(provider, items);
	const requestUrl = `${quoteUrl.replace(/\/+$/, "")}/${encodeURIComponent(serviceCode)}`;
	const params = new URLSearchParams({
		cepOrigem: originPostalCode.replace(/\D+/g, ""),
		cepDestino: destinationPostalCode.replace(/\D+/g, ""),
		psObjeto: String(packageSummary.weightGrams),
		tpObjeto: "2",
		comprimento: String(packageSummary.lengthCm),
		largura: String(packageSummary.widthCm),
		altura: String(packageSummary.heightCm),
	});

	const response = await fetchJson(`${requestUrl}?${params.toString()}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/json",
		},
	});
	if (!response.ok) return [];

	const services = extractServicesFromPayload(response.payload);
	if (services.length > 0) {
		return services
			.map((service, index) => normalizeHttpService(provider, service, currency, index))
			.filter((quote): quote is ShippingQuote => quote !== null);
	}
	const single = normalizeHttpService(
		provider,
		(response.payload as Record<string, unknown> | null) ?? {
			code: serviceCode,
			name: provider.serviceName ?? provider.label,
		},
		currency,
		0,
	);
	return single ? [single] : [];
}

async function buildJadlogQuotes(
	provider: ShippingProviderSettings,
	destination: ShippingDestination,
	currency: string,
	subtotal: number,
	items: QuoteItem[],
): Promise<ShippingQuote[]> {
	const url = buildAbsoluteUrl(provider.baseUrl, provider.endpoints?.quote);
	if (!url) return [];
	const credentials = decryptProviderCredentials(provider);
	const originPostalCode = normalizePostalCode(credentials.originPostalCode);
	const destinationPostalCode = normalizePostalCode(destination.postalCode);
	if (!originPostalCode || !destinationPostalCode) return [];
	const packageSummary = buildPackageSummary(provider, items);
	const response = await fetchJson(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(credentials.token ? { Authorization: `Bearer ${credentials.token}` } : {}),
		},
		body: JSON.stringify({
			conta: credentials.account ?? null,
			origem: {
				cep: originPostalCode.replace(/\D+/g, ""),
				pais: credentials.originCountry ?? "BR",
			},
			destino: {
				cep: destinationPostalCode.replace(/\D+/g, ""),
				pais: destination.country ?? "BR",
			},
			volume: {
				peso: packageSummary.weightGrams,
				comprimento: packageSummary.lengthCm,
				largura: packageSummary.widthCm,
				altura: packageSummary.heightCm,
				valorMercadoria: subtotal,
			},
			itens: items.map((item) => ({
				id: item.variantId,
				quantidade: item.quantity,
				valorUnitario: item.price,
			})),
		}),
	});
	if (!response.ok) return [];
	return extractServicesFromPayload(response.payload)
		.map((service, index) => normalizeHttpService(provider, service, currency, index))
		.filter((quote): quote is ShippingQuote => quote !== null);
}

async function buildEasyPostQuotes(
	provider: ShippingProviderSettings,
	destination: ShippingDestination,
	currency: string,
	items: QuoteItem[],
): Promise<ShippingQuote[]> {
	const url = buildAbsoluteUrl(provider.baseUrl, provider.endpoints?.quote);
	if (!url) return [];
	const credentials = decryptProviderCredentials(provider);
	if (!credentials.apiKey || !destination.postalCode || !destination.country) return [];
	const packageSummary = buildPackageSummary(provider, items);
	const response = await fetchJson(url, {
		method: "POST",
		headers: {
			Authorization: `Basic ${Buffer.from(`${credentials.apiKey}:`).toString("base64")}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			shipment: {
				from_address: {
					zip: credentials.fromPostalCode ?? credentials.originPostalCode,
					country: credentials.fromCountry ?? credentials.originCountry ?? "US",
				},
				to_address: {
					zip: destination.postalCode,
					country: destination.country,
				},
				parcel: {
					weight: packageSummary.weightGrams,
					length: packageSummary.lengthCm,
					width: packageSummary.widthCm,
					height: packageSummary.heightCm,
				},
			},
		}),
	});
	if (!response.ok || !response.payload || typeof response.payload !== "object") return [];
	const record = response.payload as Record<string, unknown>;
	const rates = Array.isArray(record.rates)
		? record.rates
		: record.shipment &&
				typeof record.shipment === "object" &&
				Array.isArray((record.shipment as Record<string, unknown>).rates)
			? ((record.shipment as Record<string, unknown>).rates as unknown[])
			: [];

	return rates
		.map((rate, index) => {
			if (!rate || typeof rate !== "object") return null;
			const rateRecord = rate as Record<string, unknown>;
			const amount = Math.round(Number.parseFloat(String(rateRecord.rate ?? 0)) * 100);
			if (!Number.isFinite(amount)) return null;
			return {
				providerCode: provider.code,
				providerLabel: provider.label,
				serviceCode:
					typeof rateRecord.service === "string" ? rateRecord.service : `${provider.code}-${index + 1}`,
				serviceName:
					typeof rateRecord.service === "string"
						? rateRecord.service
						: (provider.serviceName ?? provider.label),
				amount,
				currency:
					typeof rateRecord.currency === "string"
						? rateRecord.currency.toUpperCase()
						: currency.toUpperCase(),
				estimatedDays: Number.isFinite(Number(rateRecord.delivery_days))
					? Number(rateRecord.delivery_days)
					: null,
				method: provider.mode ?? "http",
			} satisfies ShippingQuote;
		})
		.filter((quote): quote is ShippingQuote => quote !== null);
}

async function buildHttpQuotes(
	provider: ShippingProviderSettings,
	destination: ShippingDestination,
	currency: string,
	subtotal: number,
	items: QuoteItem[],
): Promise<ShippingQuote[]> {
	if (provider.supportedCountries?.length) {
		const country = normalizeCountryCode(destination.country);
		if (!country || !provider.supportedCountries.includes(country)) return [];
	}
	if (provider.requiresPostalCode && !normalizePostalCode(destination.postalCode)) return [];

	if (isMelhorEnvioProvider(provider)) {
		const credentials = decryptProviderCredentials(provider);
		const originPostalCode = normalizePostalCode(credentials.originPostalCode ?? credentials.fromPostalCode);
		const destinationPostalCode = normalizePostalCode(destination.postalCode);
		const destinationCountry = normalizeCountryCode(destination.country);
		const accessToken = credentials.apiKey ?? credentials.accessToken ?? credentials.token ?? "";
		const userAgent = buildMelhorEnvioUserAgent(credentials, provider);
		if (!originPostalCode || !destinationPostalCode) return [];
		if (destinationCountry && destinationCountry !== "BR") {
			throw new Error("O adapter do Melhor Envio aceita apenas envios no Brasil.");
		}

		const packageSummary = buildPackageSummary(provider, items);
		return await fetchMelhorEnvioQuotes({
			providerCode: provider.code,
			providerLabel: provider.label,
			originPostalCode,
			destinationPostalCode,
			package: packageSummary,
			declaredValueCents: subtotal,
			accessToken,
			userAgent,
			baseUrl: provider.baseUrl ?? null,
			environment: provider.environment ?? "production",
			currency,
		});
	}

	switch (provider.kind) {
		case "correios":
			return await buildCorreiosQuotes(provider, destination, currency, items);
		case "jadlog":
			return await buildJadlogQuotes(provider, destination, currency, subtotal, items);
		case "easypost":
			return await buildEasyPostQuotes(provider, destination, currency, items);
		default:
			return await buildCustomHttpQuotes(provider, destination, currency, subtotal, items);
	}
}

export async function resolveShippingQuotesForUser(args: {
	userId: string;
	subtotal: number;
	currency: string;
	items: QuoteItem[];
}): Promise<ShippingQuoteResolution & { provider: ShippingProviderSettings | null }> {
	const destination = await resolveUserShippingDestination(args.userId);
	return await resolveShippingQuotesForDestination({
		destination,
		subtotal: args.subtotal,
		currency: args.currency,
		items: args.items,
		deliveryMethod: "saved-address",
	});
}

export async function resolveShippingQuotesForDestination(args: {
	destination?: CheckoutAddress | null;
	subtotal: number;
	currency: string;
	items: QuoteItem[];
	deliveryMethod: CheckoutDeliveryMethod;
}): Promise<ShippingQuoteResolution & { provider: ShippingProviderSettings | null }> {
	const settings = await getSettingsDoc();
	if (settings?.current?.shippingEnabled === false) {
		return {
			quotes: [],
			selected: null,
			provider: null,
			error: null,
		};
	}
	if (args.deliveryMethod === "pickup") {
		const quote = buildPickupQuote(args.currency);
		return {
			quotes: [quote],
			selected: quote,
			provider: null,
		};
	}
	const envMelhorEnvioProvider = buildEnvMelhorEnvioProvider();
	const legacyProviders = (settings?.current?.shippingProviders ?? []).map((provider, index) =>
		normalizeShippingProviderRuntime(provider, index),
	);
	const providers = envMelhorEnvioProvider ? [envMelhorEnvioProvider] : legacyProviders;
	if (!providers.length) {
		return { quotes: [], selected: null, provider: null, error: "Nenhum provedor de frete foi configurado." };
	}

	const destination = args.destination ?? {};
	const orderedProviders = [...providers]
		.filter((provider) => provider.enabled !== false)
		.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0) || a.label.localeCompare(b.label));
	const preferredProviders = shouldPreferMelhorEnvio(destination, orderedProviders)
		? orderedProviders.filter((provider) => provider.mode === "http" && isMelhorEnvioProvider(provider))
		: orderedProviders;
	let lastProviderError: string | null = null;

	for (const provider of preferredProviders) {
		if (provider.mode === "http") {
			let quotes: ShippingQuote[] = [];
			try {
				quotes = await buildHttpQuotes(provider, destination, args.currency, args.subtotal, args.items);
			} catch (error) {
				lastProviderError = error instanceof Error ? error.message : "Nao foi possivel cotar o frete.";
			}
			if (quotes.length > 0) {
				return {
					quotes,
					selected: selectBestShippingQuote(quotes),
					provider,
				};
			}
			continue;
		}

		const quote = buildFlatQuote(provider, destination, args.currency);
		if (quote) {
			return {
				quotes: [quote],
				selected: quote,
				provider,
			};
		}
	}

	return {
		quotes: [],
		selected: null,
		provider: null,
		error: lastProviderError ?? "No shipping quote is available for the current destination.",
	};
}

export { normalizeShippingProviderInput, selectBestShippingQuote, toShippingRate };
export type { ShippingProviderInput, ShippingQuote, ShippingQuoteResolution, ShippingRate };
