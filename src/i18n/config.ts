export const DEFAULT_LOCALE = "pt-BR" as const;

export type AppLocale = typeof DEFAULT_LOCALE;

export const APP_LOCALES = [DEFAULT_LOCALE] as const satisfies readonly [AppLocale];

export const LOCALE_OPTIONS = [
	{
		code: DEFAULT_LOCALE,
		label: "Português (Brasil)",
		baseLanguage: "pt",
		defaultCountry: "BR",
		stripeLocale: "pt-BR",
	},
] as const;

const LEGACY_LOCALE_TOKENS = new Set([
	"pt",
	"pt-br",
	"en",
	"en-us",
	"es",
	"es-es",
	"de",
	"de-de",
	"fr",
	"fr-ca",
	"ja",
	"jp",
	"jp-jp",
	"zh",
	"zh-cn",
	"zh-tw",
]);

function normalizeLocaleValue(value: string) {
	return value.trim().replace(/_/g, "-").toLowerCase();
}

export function resolveLocale(_value: string | null | undefined): AppLocale {
	return DEFAULT_LOCALE;
}

export function matchLocale(value: string | null | undefined): AppLocale | null {
	if (!value) return null;
	return LEGACY_LOCALE_TOKENS.has(normalizeLocaleValue(value)) ? DEFAULT_LOCALE : null;
}

export function getLocaleConfig(_locale: string | null | undefined) {
	return LOCALE_OPTIONS[0];
}

export function getDefaultCountryForLocale(_locale: string | null | undefined) {
	return "BR";
}

export function getStripeLocale(_locale: string | null | undefined): "pt-BR" {
	return "pt-BR";
}
