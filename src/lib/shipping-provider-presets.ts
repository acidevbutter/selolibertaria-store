import type {
	ShippingProviderAuthType,
	ShippingProviderEndpoints,
	ShippingProviderEnvironment,
	ShippingProviderKind,
} from "@/lib/settings";

export type ShippingCredentialField = {
	key: string;
	label: string;
	placeholder?: string;
	secret?: boolean;
	required?: boolean;
	helpText?: string;
};

export type ShippingProviderPreset = {
	kind: ShippingProviderKind;
	label: string;
	description: string;
	defaultAuthType: ShippingProviderAuthType;
	defaultBaseUrl: string;
	defaultEnvironment: ShippingProviderEnvironment;
	defaultEndpoints: Required<ShippingProviderEndpoints>;
	defaultSupportedCountries: string[];
	defaultRequiresPostalCode: boolean;
	defaultCurrency?: string;
	credentialFields: ShippingCredentialField[];
};

export const SHIPPING_PROVIDER_PRESETS: Record<ShippingProviderKind, ShippingProviderPreset> = {
	custom: {
		kind: "custom",
		label: "Custom HTTP",
		description:
			"Generic HTTP provider for custom gateways or middleware that return normalized shipping services.",
		defaultAuthType: "bearer",
		defaultBaseUrl: "",
		defaultEnvironment: "production",
		defaultEndpoints: {
			quote: "/quote",
			shipment: "/shipment",
			tracking: "/tracking",
			token: "",
		},
		defaultSupportedCountries: [],
		defaultRequiresPostalCode: true,
		credentialFields: [
			{
				key: "apiKey",
				label: "API key",
				placeholder: "token-or-api-key",
				secret: true,
			},
			{
				key: "originPostalCode",
				label: "Origin postal code",
				placeholder: "01000-000",
				required: true,
			},
			{
				key: "originCountry",
				label: "Origin country",
				placeholder: "BR",
				required: true,
			},
		],
	},
	correios: {
		kind: "correios",
		label: "Correios",
		description: "Official Correios integration with token generation and national price endpoint.",
		defaultAuthType: "bearer",
		defaultBaseUrl: "https://api.correios.com.br",
		defaultEnvironment: "production",
		defaultEndpoints: {
			quote: "/preco/v1/nacional",
			shipment: "",
			tracking: "/srorastro/v1/objetos",
			token: "/token/v1/autentica/contrato",
		},
		defaultSupportedCountries: ["BR"],
		defaultRequiresPostalCode: true,
		defaultCurrency: "BRL",
		credentialFields: [
			{
				key: "username",
				label: "Meu Correios login",
				placeholder: "seu.login@empresa.com",
				required: true,
			},
			{
				key: "accessCode",
				label: "API access code",
				placeholder: "codigo-gerado-no-cws",
				secret: true,
				required: true,
			},
			{
				key: "contract",
				label: "Contract number",
				placeholder: "9912345678",
				required: true,
			},
			{
				key: "postingCard",
				label: "Posting card",
				placeholder: "0076543210",
			},
			{
				key: "originPostalCode",
				label: "Origin postal code",
				placeholder: "01000-000",
				required: true,
			},
		],
	},
	jadlog: {
		kind: "jadlog",
		label: "Jadlog",
		description:
			"Brazilian private carrier with REST JSON integration for quoting, order creation and tracking.",
		defaultAuthType: "custom",
		defaultBaseUrl: "https://www.jadlog.com.br/embarcador",
		defaultEnvironment: "production",
		defaultEndpoints: {
			quote: "/api/frete/valor",
			shipment: "/api/pedido",
			tracking: "/api/tracking",
			token: "",
		},
		defaultSupportedCountries: ["BR"],
		defaultRequiresPostalCode: true,
		defaultCurrency: "BRL",
		credentialFields: [
			{
				key: "token",
				label: "Integration token",
				placeholder: "token-jadlog",
				secret: true,
				required: true,
			},
			{
				key: "account",
				label: "Shipper account",
				placeholder: "123456",
			},
			{
				key: "originPostalCode",
				label: "Origin postal code",
				placeholder: "01000-000",
				required: true,
			},
		],
	},
	easypost: {
		kind: "easypost",
		label: "EasyPost",
		description:
			"International multi-carrier API with rate shopping, labels and tracking under a single contract.",
		defaultAuthType: "basic",
		defaultBaseUrl: "https://api.easypost.com/v2",
		defaultEnvironment: "sandbox",
		defaultEndpoints: {
			quote: "/shipments",
			shipment: "/shipments",
			tracking: "/trackers",
			token: "",
		},
		defaultSupportedCountries: [],
		defaultRequiresPostalCode: true,
		defaultCurrency: "USD",
		credentialFields: [
			{
				key: "apiKey",
				label: "API key",
				placeholder: "EZAK...",
				secret: true,
				required: true,
			},
			{
				key: "fromPostalCode",
				label: "Origin postal code",
				placeholder: "10001",
				required: true,
			},
			{
				key: "fromCountry",
				label: "Origin country",
				placeholder: "US",
				required: true,
			},
		],
	},
};

export function getShippingProviderPreset(kind?: ShippingProviderKind | null) {
	return SHIPPING_PROVIDER_PRESETS[kind ?? "custom"] ?? SHIPPING_PROVIDER_PRESETS.custom;
}
