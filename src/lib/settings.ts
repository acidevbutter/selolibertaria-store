import type { AppLocale } from "@/i18n/config";
import type { OAuthProviderId } from "@/lib/oauth/catalog";

export type SettingsHistoryEntry = {
	date: string;
	userId: string;
	changes: Record<string, unknown>;
};

export type OAuthProviderSettings = {
	enabled?: boolean;
	clientId?: string;
	clientIdMasked?: string | null;
	clientSecret?: string | null;
	clientSecretMasked?: string | null;
	lastUpdatedAt?: string | null;
	lastUpdatedBy?: string | null;
};

export type OAuthProvidersSettings = Partial<Record<OAuthProviderId, OAuthProviderSettings>>;

export type ShippingProviderMode = "flat" | "http";
export type ShippingProviderKind = "custom" | "correios" | "jadlog" | "easypost" | "melhorenvio";
export type ShippingProviderAuthType = "none" | "bearer" | "basic" | "query" | "custom";
export type ShippingProviderEnvironment = "sandbox" | "production";
export type ShippingProviderEndpoints = {
	quote?: string | null;
	shipment?: string | null;
	tracking?: string | null;
	token?: string | null;
};

export type ShippingProviderSettings = {
	code: string;
	label: string;
	enabled?: boolean;
	priority?: number;
	mode?: ShippingProviderMode;
	kind?: ShippingProviderKind;
	authType?: ShippingProviderAuthType;
	baseUrl?: string | null;
	environment?: ShippingProviderEnvironment | null;
	endpointUrl?: string | null;
	apiKeyEncrypted?: string | null;
	apiKeyMasked?: string | null;
	credentialsEncrypted?: string | null;
	credentialsMasked?: Record<string, string> | null;
	endpoints?: ShippingProviderEndpoints | null;
	serviceCode?: string | null;
	serviceName?: string | null;
	fixedAmount?: number | null;
	estimatedDays?: number | null;
	supportedCountries?: string[];
	requiresPostalCode?: boolean;
	defaultWeightGrams?: number | null;
	defaultLengthCm?: number | null;
	defaultWidthCm?: number | null;
	defaultHeightCm?: number | null;
	lastUpdatedAt?: string | null;
	lastUpdatedBy?: string | null;
};

export type ShippingProvidersSettings = ShippingProviderSettings[];

export type MelhorEnvioSettings = {
	environment?: ShippingProviderEnvironment | null;
	baseUrl?: string | null;
	originPostalCode?: string | null;
	defaultWeightGrams?: number | null;
	defaultLengthCm?: number | null;
	defaultWidthCm?: number | null;
	defaultHeightCm?: number | null;
	userAgent?: string | null;
	contactEmail?: string | null;
	supportedCountry?: "BR" | null;
	requiresPostalCode?: boolean;
	envTokenStatus?: "configured" | "missing" | null;
	oauthStatus?: "coming-soon" | null;
	lastUpdatedAt?: string | null;
	lastUpdatedBy?: string | null;
};

export type SettingsCurrent = {
	theme?: "light" | "dark";
	supportEmail?: string | null;
	defaultCountry?: string | null;
	defaultLocale?: AppLocale | null;
	oauthProviders?: OAuthProvidersSettings;
	shippingEnabled?: boolean;
	shippingMelhorEnvio?: MelhorEnvioSettings | null;
	shippingProviders?: ShippingProvidersSettings;
	/** Whether boleto is offered at checkout. Off by default; the backend must
	 * also accept `payment_method: { type: "boleto" }` for it to work. */
	paymentBoletoEnabled?: boolean;
};

export type SettingsDoc = {
	_id?: unknown;
	current: SettingsCurrent;
	history: Array<SettingsHistoryEntry>;
};
