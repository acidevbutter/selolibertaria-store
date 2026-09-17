export type CountryOption = {
	code: string;
	name: string;
	dialCode: string;
	postalLabel: string;
};

export const COUNTRY_OPTIONS: CountryOption[] = [
	{ code: "BR", name: "Brazil", dialCode: "+55", postalLabel: "CEP" },
	{ code: "US", name: "United States", dialCode: "+1", postalLabel: "ZIP code" },
	{ code: "CA", name: "Canada", dialCode: "+1", postalLabel: "Postal code" },
	{ code: "PT", name: "Portugal", dialCode: "+351", postalLabel: "Postal code" },
	{ code: "ES", name: "Spain", dialCode: "+34", postalLabel: "Postal code" },
	{ code: "FR", name: "France", dialCode: "+33", postalLabel: "Postal code" },
	{ code: "DE", name: "Germany", dialCode: "+49", postalLabel: "Postal code" },
	{ code: "GB", name: "United Kingdom", dialCode: "+44", postalLabel: "Postcode" },
	{ code: "IT", name: "Italy", dialCode: "+39", postalLabel: "Postal code" },
	{ code: "AR", name: "Argentina", dialCode: "+54", postalLabel: "Postal code" },
	{ code: "MX", name: "Mexico", dialCode: "+52", postalLabel: "Postal code" },
	{ code: "CL", name: "Chile", dialCode: "+56", postalLabel: "Postal code" },
	{ code: "CO", name: "Colombia", dialCode: "+57", postalLabel: "Postal code" },
];

export function getCountryOption(code: string | undefined | null) {
	return (
		COUNTRY_OPTIONS.find((country) => country.code === String(code || "").toUpperCase()) ??
		COUNTRY_OPTIONS[0]!
	);
}

export function getCountryFlag(code: string) {
	return code.toUpperCase().replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export function getCountryDisplayName(code: string, locale: string) {
	try {
		const displayNames = new Intl.DisplayNames([locale], { type: "region" });
		return displayNames.of(code.toUpperCase()) ?? getCountryOption(code).name;
	} catch {
		return getCountryOption(code).name;
	}
}

export function getPostalCodeLabel(countryCode: string, locale: string) {
	const baseLanguage = locale.toLowerCase().split("-")[0] ?? "en";
	const labels: Record<string, Partial<Record<string, string>>> = {
		BR: {
			default: "CEP",
		},
		US: {
			en: "ZIP code",
			pt: "ZIP code",
			es: "Código ZIP",
			default: "ZIP code",
		},
		CA: {
			en: "Postal code",
			pt: "Código postal",
			es: "Código postal",
			default: "Postal code",
		},
		GB: {
			en: "Postcode",
			pt: "Código postal",
			es: "Código postal",
			default: "Postcode",
		},
	};
	const countryLabels = labels[countryCode.toUpperCase()];
	if (!countryLabels) {
		if (baseLanguage === "pt") return "Código postal";
		if (baseLanguage === "es") return "Código postal";
		return "Postal code";
	}
	return countryLabels[baseLanguage] ?? countryLabels.default ?? getCountryOption(countryCode).postalLabel;
}

function formatGroupedDigits(digits: string, groups: number[]) {
	let cursor = 0;
	const parts: string[] = [];
	for (const group of groups) {
		if (cursor >= digits.length) break;
		parts.push(digits.slice(cursor, cursor + group));
		cursor += group;
	}
	if (cursor < digits.length) parts.push(digits.slice(cursor));
	return parts.filter(Boolean).join(" ");
}

export function formatNationalPhone(countryCode: string, digits: string) {
	const raw = digits.replace(/\D+/g, "");
	if (!raw) return "";

	switch (countryCode.toUpperCase()) {
		case "BR": {
			const ddd = raw.slice(0, 2);
			const body = raw.slice(2, 11);
			if (!ddd) return raw;
			if (body.length <= 4) return `(${ddd}) ${body}`.trim();
			if (body.length <= 8) return `(${ddd}) ${body.slice(0, 4)}-${body.slice(4)}`.trimEnd();
			return `(${ddd}) ${body.slice(0, 5)}-${body.slice(5, 9)}`.trimEnd();
		}
		case "US":
		case "CA": {
			const area = raw.slice(0, 3);
			const prefix = raw.slice(3, 6);
			const line = raw.slice(6, 10);
			if (!prefix) return area ? `(${area}` : "";
			if (!line) return `(${area}) ${prefix}`;
			return `(${area}) ${prefix}-${line}`;
		}
		case "PT":
			return formatGroupedDigits(raw, [3, 3, 3]);
		default:
			return formatGroupedDigits(raw, [3, 3, 4, 4]);
	}
}

export function normalizePostalCode(countryCode: string, raw: string) {
	const value = raw.toUpperCase().trim();
	switch (countryCode.toUpperCase()) {
		case "BR": {
			const digits = value.replace(/\D+/g, "").slice(0, 8);
			if (digits.length <= 5) return digits;
			return `${digits.slice(0, 5)}-${digits.slice(5)}`;
		}
		case "US": {
			const digits = value.replace(/\D+/g, "").slice(0, 9);
			if (digits.length <= 5) return digits;
			return `${digits.slice(0, 5)}-${digits.slice(5)}`;
		}
		case "CA": {
			const alnum = value.replace(/[^A-Z0-9]+/g, "").slice(0, 6);
			if (alnum.length <= 3) return alnum;
			return `${alnum.slice(0, 3)} ${alnum.slice(3)}`;
		}
		default:
			return value.replace(/\s+/g, " ");
	}
}

export function normalizePhoneParts(countryCode: string, rawNational: string) {
	const country = getCountryOption(countryCode);
	const national = rawNational.replace(/\D+/g, "");
	const dialDigits = country.dialCode.replace(/\D+/g, "");
	const e164 = national ? `+${dialDigits}${national}` : "";
	return {
		country: country.code,
		dialCode: country.dialCode,
		national,
		e164,
		display: national ? `${country.dialCode} ${formatNationalPhone(country.code, national)}` : "",
	};
}
