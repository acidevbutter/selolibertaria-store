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
		label: "HTTP personalizado",
		description:
			"Provedor HTTP genérico para gateways próprios ou middleware que devolvam serviços de frete já normalizados.",
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
				label: "Chave da API",
				placeholder: "token-or-api-key",
				secret: true,
			},
			{
				key: "originPostalCode",
				label: "CEP de origem",
				placeholder: "01000-000",
				required: true,
			},
			{
				key: "originCountry",
				label: "País de origem",
				placeholder: "BR",
				required: true,
			},
		],
	},
	correios: {
		kind: "correios",
		label: "Correios",
		description: "Integração oficial dos Correios com geração de token e consulta nacional de preços.",
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
				label: "Código de acesso da API",
				placeholder: "codigo-gerado-no-cws",
				secret: true,
				required: true,
			},
			{
				key: "contract",
				label: "Número do contrato",
				placeholder: "9912345678",
				required: true,
			},
			{
				key: "postingCard",
				label: "Cartão de postagem",
				placeholder: "0076543210",
			},
			{
				key: "originPostalCode",
				label: "CEP de origem",
				placeholder: "01000-000",
				required: true,
			},
		],
	},
	jadlog: {
		kind: "jadlog",
		label: "Jadlog",
		description:
			"Transportadora privada brasileira com integração REST para cotação, criação de pedidos e rastreio.",
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
				label: "Token de integração",
				placeholder: "token-jadlog",
				secret: true,
				required: true,
			},
			{
				key: "account",
				label: "Conta do embarcador",
				placeholder: "123456",
			},
			{
				key: "originPostalCode",
				label: "CEP de origem",
				placeholder: "01000-000",
				required: true,
			},
		],
	},
	easypost: {
		kind: "easypost",
		label: "EasyPost",
		description:
			"API internacional multi-transportadora para cotação, etiquetas e rastreio sob uma única integração.",
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
				label: "Chave da API",
				placeholder: "EZAK...",
				secret: true,
				required: true,
			},
			{
				key: "fromPostalCode",
				label: "Código postal de origem",
				placeholder: "10001",
				required: true,
			},
			{
				key: "fromCountry",
				label: "País de origem",
				placeholder: "US",
				required: true,
			},
		],
	},
};

export function getShippingProviderPreset(kind?: ShippingProviderKind | null) {
	return SHIPPING_PROVIDER_PRESETS[kind ?? "custom"] ?? SHIPPING_PROVIDER_PRESETS.custom;
}
