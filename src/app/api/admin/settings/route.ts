import type { UpdateFilter } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { APP_LOCALES } from "@/i18n/config";
import { requireAdmin } from "@/lib/api-auth";
import { COUNTRY_CODES } from "@/lib/location/countries";
import { getDb } from "@/lib/mongodb";
import { OAUTH_PROVIDER_IDS } from "@/lib/oauth/catalog";
import { encryptStoredSecret, maskStoredSecret } from "@/lib/oauth/secrets";
import type {
	OAuthProvidersSettings,
	SettingsDoc,
	SettingsHistoryEntry,
	ShippingProviderSettings,
	ShippingProvidersSettings,
} from "@/lib/settings";
import { serializeSettingsForAdmin } from "@/lib/settings-serialization";
import { getShippingProviderPreset } from "@/lib/shipping-provider-presets";

const oauthProviderInputSchema = z.object({
	enabled: z.boolean().optional(),
	clientId: z.string().optional(),
	clientSecret: z.string().optional(),
});

const oauthProvidersPatchSchema = z
	.object({
		google: oauthProviderInputSchema.optional(),
		facebook: oauthProviderInputSchema.optional(),
		instagram: oauthProviderInputSchema.optional(),
	})
	.partial();

const shippingProviderInputSchema = z.object({
	code: z.string().optional(),
	label: z.string().optional(),
	enabled: z.boolean().optional(),
	priority: z.union([z.number(), z.string()]).optional(),
	mode: z.enum(["flat", "http"]).optional(),
	kind: z.enum(["custom", "correios", "jadlog", "easypost"]).optional(),
	authType: z.enum(["none", "bearer", "basic", "query", "custom"]).optional(),
	baseUrl: z.string().optional(),
	environment: z.enum(["sandbox", "production"]).optional(),
	endpointUrl: z.string().optional(),
	apiKey: z.string().optional(),
	credentials: z.record(z.string(), z.string()).optional(),
	endpoints: z
		.object({
			quote: z.string().optional(),
			shipment: z.string().optional(),
			tracking: z.string().optional(),
			token: z.string().optional(),
		})
		.partial()
		.optional(),
	serviceCode: z.string().optional(),
	serviceName: z.string().optional(),
	fixedAmount: z.union([z.number(), z.string()]).optional(),
	estimatedDays: z.union([z.number(), z.string()]).optional(),
	currency: z.string().optional(),
	supportedCountries: z.array(z.string()).optional(),
	requiresPostalCode: z.boolean().optional(),
	defaultWeightGrams: z.union([z.number(), z.string()]).optional(),
	defaultLengthCm: z.union([z.number(), z.string()]).optional(),
	defaultWidthCm: z.union([z.number(), z.string()]).optional(),
	defaultHeightCm: z.union([z.number(), z.string()]).optional(),
});

const shippingProvidersPatchSchema = z.array(shippingProviderInputSchema).optional();

const settingsPatchSchema = z.object({
	theme: z.enum(["light", "dark"]).optional(),
	supportEmail: z.string().email().nullable().optional(),
	defaultCountry: z.enum(COUNTRY_CODES as [string, ...string[]]).optional(),
	defaultLocale: z.enum(APP_LOCALES).optional(),
	oauthProviders: oauthProvidersPatchSchema.optional(),
	shippingEnabled: z.boolean().optional(),
	shippingProviders: shippingProvidersPatchSchema.optional(),
});

function normalizeNumericInput(value: string | number | undefined, fallback: number | null = null) {
	if (value === undefined) return fallback;
	if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
	const trimmed = value.trim();
	if (!trimmed) return fallback;
	const numeric = Number(trimmed);
	return Number.isFinite(numeric) ? numeric : fallback;
}

function sanitizeCredentialRecord(record?: Record<string, string> | undefined) {
	if (!record) return null;
	const entries = Object.entries(record)
		.map(([key, value]) => [key, value.trim()] as const)
		.filter(([, value]) => value.length > 0);
	return entries.length > 0 ? Object.fromEntries(entries) : null;
}

export async function GET() {
	const { error } = await requireAdmin();
	if (error) return error;
	const db = await getDb();
	const doc = await db.collection<SettingsDoc>("settings").findOne({});
	return NextResponse.json(serializeSettingsForAdmin(doc));
}

export async function PATCH(req: Request) {
	const { session, error } = await requireAdmin();
	if (error) return error;
	const db = await getDb();
	const parsed = settingsPatchSchema.safeParse(await req.json());
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
	}
	const body = parsed.data;
	const existing = await db.collection<SettingsDoc>("settings").findOne({});

	const now = new Date().toISOString();
	const userId = session!.sub as string;
	const currentOauthProviders: OAuthProvidersSettings = existing?.current?.oauthProviders ?? {};
	const nextOauthProviders: OAuthProvidersSettings = { ...currentOauthProviders };
	const currentShippingProviders: ShippingProvidersSettings = existing?.current?.shippingProviders ?? [];
	const nextShippingProviders: ShippingProvidersSettings = [...currentShippingProviders];

	for (const providerId of OAUTH_PROVIDER_IDS) {
		const providerPatch = body.oauthProviders?.[providerId];
		if (!providerPatch) continue;
		const previous = currentOauthProviders[providerId] ?? {};
		const clientIdEncrypted =
			providerPatch.clientId !== undefined
				? encryptStoredSecret(providerPatch.clientId)
				: (previous.clientIdEncrypted ?? (previous.clientId ? encryptStoredSecret(previous.clientId) : null));
		const clientSecretEncrypted = providerPatch.clientSecret?.trim()
			? encryptStoredSecret(providerPatch.clientSecret)
			: (previous.clientSecretEncrypted ?? null);
		nextOauthProviders[providerId] = {
			enabled: providerPatch.enabled ?? previous.enabled,
			clientIdEncrypted,
			clientIdMasked: maskStoredSecret(clientIdEncrypted),
			clientSecretEncrypted,
			clientSecretMasked: maskStoredSecret(clientSecretEncrypted),
			lastUpdatedAt: now,
			lastUpdatedBy: userId,
		};
	}

	if (body.shippingProviders) {
		body.shippingProviders.forEach((providerPatch, index) => {
			const previous: Partial<ShippingProviderSettings> = currentShippingProviders[index] ?? {};
			const preset = getShippingProviderPreset(providerPatch.kind ?? previous.kind);
			const sanitizedCredentials = sanitizeCredentialRecord({
				...(providerPatch.apiKey?.trim() ? { apiKey: providerPatch.apiKey.trim() } : {}),
				...(providerPatch.credentials ?? {}),
			});
			const credentialsEncrypted =
				sanitizedCredentials !== null
					? encryptStoredSecret(JSON.stringify(sanitizedCredentials))
					: (previous.credentialsEncrypted ?? null);
			nextShippingProviders[index] = {
				code: (providerPatch.code?.trim() || previous.code || `provider-${index + 1}`).trim(),
				label: providerPatch.label?.trim() || previous.label || `Provider ${index + 1}`,
				enabled: providerPatch.enabled ?? previous.enabled ?? true,
				priority:
					typeof providerPatch.priority === "number"
						? providerPatch.priority
						: Number.isFinite(Number(providerPatch.priority))
							? Number(providerPatch.priority)
							: (previous.priority ?? index),
				mode: providerPatch.mode ?? previous.mode ?? (providerPatch.kind ? "http" : "flat"),
				kind: providerPatch.kind ?? previous.kind ?? "custom",
				authType: providerPatch.authType ?? previous.authType ?? preset.defaultAuthType,
				baseUrl:
					providerPatch.baseUrl !== undefined
						? providerPatch.baseUrl?.trim() || null
						: (previous.baseUrl ?? preset.defaultBaseUrl),
				environment: providerPatch.environment ?? previous.environment ?? preset.defaultEnvironment,
				endpointUrl:
					providerPatch.endpointUrl !== undefined
						? providerPatch.endpointUrl?.trim() || null
						: (previous.endpointUrl ?? null),
				apiKeyEncrypted: null,
				apiKeyMasked: previous.apiKeyMasked ?? null,
				credentialsEncrypted,
				credentialsMasked:
					sanitizedCredentials !== null
						? Object.fromEntries(
								Object.entries(sanitizedCredentials).map(([key, value]) => [
									key,
									maskStoredSecret(encryptStoredSecret(value)) ?? "",
								]),
							)
						: (previous.credentialsMasked ?? null),
				endpoints:
					providerPatch.endpoints !== undefined
						? {
								quote: providerPatch.endpoints.quote?.trim() || null,
								shipment: providerPatch.endpoints.shipment?.trim() || null,
								tracking: providerPatch.endpoints.tracking?.trim() || null,
								token: providerPatch.endpoints.token?.trim() || null,
							}
						: (previous.endpoints ?? preset.defaultEndpoints),
				serviceCode:
					providerPatch.serviceCode !== undefined
						? providerPatch.serviceCode?.trim() || null
						: (previous.serviceCode ?? null),
				serviceName:
					providerPatch.serviceName !== undefined
						? providerPatch.serviceName?.trim() || null
						: (previous.serviceName ?? null),
				fixedAmount:
					providerPatch.fixedAmount !== undefined
						? String(providerPatch.fixedAmount).trim()
							? Number.isFinite(Number(providerPatch.fixedAmount))
								? Number(providerPatch.fixedAmount)
								: null
							: null
						: (previous.fixedAmount ?? null),
				estimatedDays:
					providerPatch.estimatedDays !== undefined
						? String(providerPatch.estimatedDays).trim()
							? Number.isFinite(Number(providerPatch.estimatedDays))
								? Number(providerPatch.estimatedDays)
								: null
							: null
						: (previous.estimatedDays ?? null),
				currency:
					providerPatch.currency !== undefined
						? providerPatch.currency?.trim().toUpperCase() || null
						: (previous.currency ?? preset.defaultCurrency ?? null),
				supportedCountries:
					providerPatch.supportedCountries !== undefined
						? providerPatch.supportedCountries
								.map((entry) => entry.trim().toUpperCase())
								.filter((entry) => /^[A-Z]{2}$/.test(entry))
						: (previous.supportedCountries ?? preset.defaultSupportedCountries),
				requiresPostalCode:
					providerPatch.requiresPostalCode !== undefined
						? providerPatch.requiresPostalCode
						: (previous.requiresPostalCode ?? preset.defaultRequiresPostalCode),
				defaultWeightGrams: normalizeNumericInput(
					providerPatch.defaultWeightGrams,
					previous.defaultWeightGrams ?? 300,
				),
				defaultLengthCm: normalizeNumericInput(providerPatch.defaultLengthCm, previous.defaultLengthCm ?? 20),
				defaultWidthCm: normalizeNumericInput(providerPatch.defaultWidthCm, previous.defaultWidthCm ?? 20),
				defaultHeightCm: normalizeNumericInput(providerPatch.defaultHeightCm, previous.defaultHeightCm ?? 10),
				lastUpdatedAt: now,
				lastUpdatedBy: userId,
			};
		});
		nextShippingProviders.length = body.shippingProviders.length;
	}

	const currentPatch: SettingsDoc["current"] = {
		...(body.theme !== undefined ? { theme: body.theme } : {}),
		...(body.supportEmail !== undefined ? { supportEmail: body.supportEmail } : {}),
		...(body.defaultCountry !== undefined ? { defaultCountry: body.defaultCountry } : {}),
		...(body.defaultLocale !== undefined ? { defaultLocale: body.defaultLocale } : {}),
		...(body.oauthProviders ? { oauthProviders: nextOauthProviders } : {}),
		...(body.shippingEnabled !== undefined ? { shippingEnabled: body.shippingEnabled } : {}),
		...(body.shippingProviders ? { shippingProviders: nextShippingProviders } : {}),
	};

	// Upsert single settings document; push history entry
	const update: UpdateFilter<SettingsDoc> = {
		$set: Object.fromEntries(Object.entries(currentPatch).map(([k, v]) => [`current.${k}`, v])),
		$push: {
			history: {
				date: now,
				userId,
				changes: currentPatch as Record<string, unknown>,
			} as SettingsHistoryEntry,
		},
	};

	await db.collection<SettingsDoc>("settings").updateOne({}, update, { upsert: true });
	const latest = await db.collection<SettingsDoc>("settings").findOne({});
	return NextResponse.json(serializeSettingsForAdmin(latest));
}
