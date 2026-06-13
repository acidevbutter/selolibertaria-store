export const LOCALE_COOKIE_NAME = "storefront_locale";

export const LOCALE_OPTIONS = [
	{
		code: "en-US",
		label: "English (United States)",
		baseLanguage: "en",
		defaultCountry: "US",
		stripeLocale: "en",
	},
	{
		code: "pt-BR",
		label: "Português (Brasil)",
		baseLanguage: "pt",
		defaultCountry: "BR",
		stripeLocale: "pt-BR",
	},
	{
		code: "es-ES",
		label: "Español (España)",
		baseLanguage: "es",
		defaultCountry: "ES",
		stripeLocale: "es",
	},
	{
		code: "de-DE",
		label: "Deutsch (Deutschland)",
		baseLanguage: "de",
		defaultCountry: "DE",
		stripeLocale: "de",
	},
	{
		code: "fr-CA",
		label: "Français (Canada)",
		baseLanguage: "fr",
		defaultCountry: "CA",
		stripeLocale: "fr",
	},
	{
		code: "jp-JP",
		label: "Japanese (Japan)",
		baseLanguage: "ja",
		defaultCountry: "JP",
		stripeLocale: "ja",
	},
	{
		code: "zh-CN",
		label: "中文 (简体)",
		baseLanguage: "zh",
		defaultCountry: "CN",
		stripeLocale: "zh",
	},
	{
		code: "zh-TW",
		label: "中文 (繁體)",
		baseLanguage: "zh",
		defaultCountry: "TW",
		stripeLocale: "zh-TW",
	},
] as const;

export type AppLocale = (typeof LOCALE_OPTIONS)[number]["code"];

export const APP_LOCALES = LOCALE_OPTIONS.map((option) => option.code) as [AppLocale, ...AppLocale[]];

export const DEFAULT_LOCALE: AppLocale = "pt-BR";

const localeByLowerCode = new Map(
	LOCALE_OPTIONS.map((option) => [option.code.toLowerCase(), option] as const),
);
const localeByBaseLanguage = new Map(
	LOCALE_OPTIONS.map((option) => [option.baseLanguage.toLowerCase(), option] as const),
);

function normalizeLocaleValue(value: string) {
	return value.trim().replace(/_/g, "-");
}

export function resolveLocale(value: string | null | undefined): AppLocale {
	if (!value) return DEFAULT_LOCALE;

	const normalized = normalizeLocaleValue(value);
	const lower = normalized.toLowerCase();
	const exactMatch = localeByLowerCode.get(lower);
	if (exactMatch) return exactMatch.code;

	const baseLanguage = lower.split("-")[0] ?? lower;
	const baseMatch = localeByBaseLanguage.get(baseLanguage);
	if (baseMatch) return baseMatch.code;

	return DEFAULT_LOCALE;
}

export function matchLocale(value: string | null | undefined): AppLocale | null {
	if (!value) return null;

	const normalized = normalizeLocaleValue(value);
	const lower = normalized.toLowerCase();
	const exactMatch = localeByLowerCode.get(lower);
	if (exactMatch) return exactMatch.code;

	const baseLanguage = lower.split("-")[0] ?? lower;
	const baseMatch = localeByBaseLanguage.get(baseLanguage);
	return baseMatch?.code ?? null;
}

export function resolveLocaleFromAcceptLanguage(headerValue: string | null | undefined): AppLocale | null {
	if (!headerValue) return null;

	const weighted = headerValue
		.split(",")
		.map((entry) => {
			const [rawLocale, ...params] = entry.trim().split(";");
			const qualityParam = params.find((param) => param.trim().startsWith("q="));
			const q = qualityParam ? Number(qualityParam.trim().slice(2)) : 1;
			return {
				locale: rawLocale?.trim() ?? "",
				q: Number.isFinite(q) ? q : 0,
			};
		})
		.filter((entry) => Boolean(entry.locale))
		.sort((a, b) => b.q - a.q);

	for (const entry of weighted) {
		const match = matchLocale(entry.locale);
		if (match) return match;
	}

	return null;
}

export function getLocaleConfig(locale: string | null | undefined) {
	const resolved = resolveLocale(locale);
	return localeByLowerCode.get(resolved.toLowerCase())!;
}

export function getDefaultCountryForLocale(locale: string | null | undefined) {
	return getLocaleConfig(locale).defaultCountry;
}

export function getStripeLocale(locale: string | null | undefined) {
	return getLocaleConfig(locale).stripeLocale;
}
