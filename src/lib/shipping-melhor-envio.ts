import type { ShippingProviderEnvironment } from "@/lib/settings";
import type { ShippingQuote } from "@/lib/shipping-core";

const MELHOR_ENVIO_TIMEOUT_MS = 8_000;
const MELHOR_ENVIO_SANDBOX_BASE_URL = "https://sandbox.melhorenvio.com.br/api/v2";
const MELHOR_ENVIO_PRODUCTION_BASE_URL = "https://www.melhorenvio.com.br/api/v2";

type MelhorEnvioPackage = {
	heightCm: number;
	widthCm: number;
	lengthCm: number;
	weightGrams: number;
};

export type MelhorEnvioQuoteAdapterInput = {
	providerCode: string;
	providerLabel: string;
	originPostalCode: string;
	destinationPostalCode: string;
	package: MelhorEnvioPackage;
	declaredValueCents: number;
	accessToken: string;
	userAgent: string;
	baseUrl?: string | null;
	environment?: ShippingProviderEnvironment | null;
	currency?: string;
	quotedAt?: string;
	modicoShippingEligible?: boolean;
};

export class MelhorEnvioQuoteAdapterError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "MelhorEnvioQuoteAdapterError";
	}
}

function normalizeDigits(value: string) {
	return value.replace(/\D+/g, "");
}

function normalizePositiveNumber(value: number, fallback: number) {
	return Number.isFinite(value) && value > 0 ? value : fallback;
}

function toKilograms(weightGrams: number) {
	return Number((normalizePositiveNumber(weightGrams, 1) / 1000).toFixed(3));
}

function toBrlAmount(valueCents: number) {
	return Number((Math.max(0, valueCents) / 100).toFixed(2));
}

function normalizeBaseUrl(baseUrl?: string | null, environment?: ShippingProviderEnvironment | null) {
	const trimmed = baseUrl?.trim();
	if (trimmed) {
		if (/\/api\/v\d+\/?$/i.test(trimmed)) return trimmed.replace(/\/+$/, "");
		if (/melhorenvio\.com\.br/i.test(trimmed)) return `${trimmed.replace(/\/+$/, "")}/api/v2`;
		return trimmed.replace(/\/+$/, "");
	}

	return environment === "production" ? MELHOR_ENVIO_PRODUCTION_BASE_URL : MELHOR_ENVIO_SANDBOX_BASE_URL;
}

function normalizeCurrency(value?: string | null) {
	const normalized = value?.trim().toUpperCase() ?? "BRL";
	if (normalized === "R$") return "BRL";
	return normalized;
}

function toCents(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
		return Math.round(value * 100);
	}

	if (typeof value === "string" && value.trim()) {
		const normalized = value
			.replace(/[^\d,.-]+/g, "")
			.replace(/\.(?=\d{3}(?:\D|$))/g, "")
			.replace(",", ".");
		const parsed = Number.parseFloat(normalized);
		return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
	}

	return null;
}

function toDays(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
		return Math.round(value);
	}

	if (typeof value === "string" && value.trim()) {
		const parsed = Number.parseInt(value, 10);
		return Number.isFinite(parsed) ? parsed : null;
	}

	return null;
}

function toTrimmedText(value: unknown) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed ? trimmed : null;
}

function extractQuotedServices(payload: unknown) {
	if (Array.isArray(payload)) return payload;
	if (!payload || typeof payload !== "object") return [];

	const record = payload as Record<string, unknown>;
	if (Array.isArray(record.deliveryDetails)) return record.deliveryDetails;
	if (Array.isArray(record.data)) return record.data;
	if (Array.isArray(record.services)) return record.services;
	if (Array.isArray(record.rates)) return record.rates;

	return [];
}

function normalizeErrorMessage(payload: unknown, status?: number) {
	if (payload && typeof payload === "object") {
		const record = payload as Record<string, unknown>;
		const directMessage =
			typeof record.message === "string"
				? record.message
				: typeof record.error === "string"
					? record.error
					: typeof record.errors === "string"
						? record.errors
						: null;

		if (directMessage?.trim()) return directMessage.trim();
	}

	if (status === 401 || status === 403) {
		return "O token do Melhor Envio esta ausente, expirou ou nao e valido.";
	}

	if (status === 408 || status === 504) {
		return "A cotacao do Melhor Envio expirou antes de responder.";
	}

	if (status === 422) {
		return "O Melhor Envio rejeitou os dados informados para cotacao.";
	}

	return "Nao foi possivel obter cotacao no Melhor Envio.";
}

function extractServiceCode(record: Record<string, unknown>) {
	const candidates = [record.id, record.service, record.service_code, record.code, record.name];

	for (const candidate of candidates) {
		if (typeof candidate === "number" || typeof candidate === "string") {
			const normalized = String(candidate).trim();
			if (normalized) return normalized;
		}
	}

	return null;
}

function extractServiceName(record: Record<string, unknown>) {
	return (
		toTrimmedText(record.name) ??
		toTrimmedText(record.service) ??
		toTrimmedText(record.service_name) ??
		toTrimmedText(record.service_description) ??
		toTrimmedText(record.description) ??
		toTrimmedText(record.label) ??
		null
	);
}

function normalizeServiceText(...values: Array<string | null>) {
	return values
		.filter((value): value is string => Boolean(value))
		.join(" ")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
}

function isImpressoService(serviceCode: string, serviceName: string) {
	const normalized = normalizeServiceText(serviceCode, serviceName);
	return normalized.includes("impresso") && !normalized.includes("registro");
}

function isRegistroModicoService(serviceCode: string, serviceName: string) {
	const normalized = normalizeServiceText(serviceCode, serviceName);
	return normalized.includes("registro") && normalized.includes("modico");
}

export function buildMelhorEnvioQuoteRequest(input: MelhorEnvioQuoteAdapterInput) {
	const originPostalCode = normalizeDigits(input.originPostalCode);
	const destinationPostalCode = normalizeDigits(input.destinationPostalCode);
	const currency = normalizeCurrency(input.currency);
	const userAgent = input.userAgent.trim();
	const accessToken = input.accessToken.trim();

	if (currency !== "BRL") {
		throw new MelhorEnvioQuoteAdapterError("O adapter do Melhor Envio aceita apenas cotacao em BRL.");
	}

	if (!originPostalCode || !destinationPostalCode) {
		throw new MelhorEnvioQuoteAdapterError("O Melhor Envio exige CEPs de origem e destino validos.");
	}

	if (!accessToken) {
		throw new MelhorEnvioQuoteAdapterError("O token do Melhor Envio nao foi configurado.");
	}

	if (!userAgent) {
		throw new MelhorEnvioQuoteAdapterError("O Melhor Envio exige um User-Agent com identificacao tecnica.");
	}

	const quotedAt = input.quotedAt ?? new Date().toISOString();
	const baseUrl = normalizeBaseUrl(input.baseUrl, input.environment);

	return {
		url: `${baseUrl}/me/shipment/calculate`,
		init: {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
				"User-Agent": userAgent,
			},
			body: JSON.stringify({
				from: { postal_code: originPostalCode },
				to: { postal_code: destinationPostalCode },
				volumes: [
					{
						height: normalizePositiveNumber(input.package.heightCm, 1),
						width: normalizePositiveNumber(input.package.widthCm, 1),
						length: normalizePositiveNumber(input.package.lengthCm, 1),
						weight: toKilograms(input.package.weightGrams),
						insurance: toBrlAmount(input.declaredValueCents),
					},
				],
			}),
		} satisfies RequestInit,
		quotedAt,
	};
}

export function normalizeMelhorEnvioQuoteResponse(args: {
	payload: unknown;
	providerCode: string;
	providerLabel: string;
	quotedAt: string;
	modicoShippingEligible?: boolean;
}) {
	const parsedServices = extractQuotedServices(args.payload).reduce<
		Array<{
			record: Record<string, unknown>;
			amount: number;
			serviceId: string;
			serviceName: string;
		}>
	>((accumulator, service) => {
		if (!service || typeof service !== "object") return accumulator;

		const record = service as Record<string, unknown>;
		const amount =
			toCents(record.custom_price) ??
			toCents(record.price) ??
			toCents(record.amount) ??
			toCents(record.total);
		if (amount === null) return accumulator;

		const serviceId = extractServiceCode(record);
		const serviceName = extractServiceName(record);
		if (!serviceId || !serviceName) return accumulator;

		accumulator.push({ record, amount, serviceId, serviceName });
		return accumulator;
	}, []);

	const impressoAmount = args.modicoShippingEligible
		? parsedServices.find((service) => isImpressoService(service.serviceId, service.serviceName))?.amount
		: undefined;

	const quotes = parsedServices.reduce<ShippingQuote[]>((accumulator, service) => {
		const { record, serviceId, serviceName } = service;
		const amount =
			args.modicoShippingEligible &&
			impressoAmount !== undefined &&
			isRegistroModicoService(serviceId, serviceName)
				? impressoAmount + service.amount
				: service.amount;
		const company =
			record.company && typeof record.company === "object"
				? (record.company as Record<string, unknown>)
				: null;
		const providerLabel =
			typeof company?.name === "string" && company.name.trim() ? company.name.trim() : args.providerLabel;
		const estimatedDays =
			toDays(record.custom_delivery_time) ??
			toDays(record.delivery_time) ??
			toDays((record.custom_delivery_range as { max?: unknown } | undefined)?.max) ??
			toDays((record.delivery_range as { max?: unknown } | undefined)?.max);

		accumulator.push({
			providerCode: args.providerCode,
			providerLabel,
			serviceCode: serviceId,
			serviceName,
			amount,
			currency: normalizeCurrency(String(record.currency ?? "BRL")),
			estimatedDays,
			quotedAt: args.quotedAt,
			method: "http",
		});

		return accumulator;
	}, []);

	if (quotes.length > 0) return quotes;
	throw new MelhorEnvioQuoteAdapterError(normalizeErrorMessage(args.payload));
}

export async function fetchMelhorEnvioQuotes(input: MelhorEnvioQuoteAdapterInput) {
	const request = buildMelhorEnvioQuoteRequest(input);
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), MELHOR_ENVIO_TIMEOUT_MS);

	try {
		const response = await fetch(request.url, {
			...request.init,
			cache: "no-store",
			signal: controller.signal,
		});

		const text = await response.text();
		const payload = text ? (JSON.parse(text) as unknown) : null;

		if (!response.ok) {
			throw new MelhorEnvioQuoteAdapterError(normalizeErrorMessage(payload, response.status));
		}

		return normalizeMelhorEnvioQuoteResponse({
			payload,
			providerCode: input.providerCode,
			providerLabel: input.providerLabel,
			quotedAt: request.quotedAt,
			modicoShippingEligible: input.modicoShippingEligible,
		});
	} catch (error) {
		if (error instanceof MelhorEnvioQuoteAdapterError) throw error;
		if (error instanceof Error && error.name === "AbortError") {
			throw new MelhorEnvioQuoteAdapterError("A cotacao do Melhor Envio expirou antes de responder.");
		}
		throw new MelhorEnvioQuoteAdapterError("Nao foi possivel obter cotacao no Melhor Envio.");
	} finally {
		clearTimeout(timeout);
	}
}
