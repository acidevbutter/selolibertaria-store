export const EDITORIAL_HOME_LINK_OPTIONS = [
	{ label: "Livros", href: "/products" },
	{ label: "Projetos", href: "/projects" },
	{ label: "Sarau Safado", href: "/sarau-safado" },
	{ label: "Sobre", href: "/about" },
	{ label: "Contato", href: "/contact" },
	{ label: "Eventos", href: "/events" },
] as const;

const EDITORIAL_HOME_ALLOWED_PATHS = EDITORIAL_HOME_LINK_OPTIONS.map((option) => option.href);

const EDITORIAL_ALLOWED_CUSTOM_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"] as const;

const CUSTOM_LINK_VALUE = "__custom__";

export const EDITORIAL_HOME_CUSTOM_LINK_VALUE = CUSTOM_LINK_VALUE;

export const EDITORIAL_HOME_LINK_HINT =
	"Escolha uma rota pública do site ou use Personalizado para link externo/outra rota.";

function normalizeInternalHref(value: string, fieldLabel: string) {
	if (!value.startsWith("/") || value.startsWith("//")) {
		throw new Error(`${fieldLabel}: use uma rota interna. ${EDITORIAL_HOME_LINK_HINT}`);
	}

	const parsed = new URL(value, "https://selolibertaria.local");
	const pathname = parsed.pathname.replace(/\/$/, "") || "/";

	if (!EDITORIAL_HOME_ALLOWED_PATHS.includes(pathname as (typeof EDITORIAL_HOME_ALLOWED_PATHS)[number])) {
		throw new Error(`${fieldLabel}: rota não permitida. ${EDITORIAL_HOME_LINK_HINT}`);
	}

	return `${pathname}${parsed.search}${parsed.hash}`;
}

function normalizeCustomHref(value: string, fieldLabel: string) {
	if (value.startsWith("/")) {
		if (value.startsWith("//")) {
			throw new Error(`${fieldLabel}: links personalizados devem usar rota interna ou URL completa.`);
		}

		const parsed = new URL(value, "https://selolibertaria.local");
		const pathname = parsed.pathname.replace(/\/$/, "") || "/";
		return `${pathname}${parsed.search}${parsed.hash}`;
	}

	const parsed = new URL(value);
	if (
		!EDITORIAL_ALLOWED_CUSTOM_PROTOCOLS.includes(
			parsed.protocol as (typeof EDITORIAL_ALLOWED_CUSTOM_PROTOCOLS)[number],
		)
	) {
		throw new Error(`${fieldLabel}: use URL externa com http, https, mailto ou tel.`);
	}

	return parsed.toString();
}

export function isEditorialHomePresetHref(value?: string | null) {
	if (!value) return false;
	const trimmed = value.trim();
	if (!trimmed) return false;

	try {
		return normalizeInternalHref(trimmed, "Link") === trimmed.replace(/\/$/, "");
	} catch {
		return false;
	}
}

export function parseEditorialHomeHrefChoice(
	formData: FormData,
	fieldName: string,
	fieldLabel: string,
): string | null {
	const presetValue = formData.get(`${fieldName}Preset`);
	const customValue = formData.get(`${fieldName}Custom`);

	if (typeof presetValue !== "string") {
		return parseEditorialHomeHref(formData.get(fieldName), fieldLabel);
	}

	const preset = presetValue.trim();
	if (!preset) return null;

	if (preset === CUSTOM_LINK_VALUE) {
		const custom = typeof customValue === "string" ? customValue.trim() : "";
		if (!custom) throw new Error(`${fieldLabel}: informe o link personalizado.`);
		return normalizeCustomHref(custom, fieldLabel);
	}

	return normalizeInternalHref(preset, fieldLabel);
}

export function parseEditorialHomeHref(value: FormDataEntryValue | null, fieldLabel: string): string | null {
	if (typeof value !== "string") return null;

	const trimmed = value.trim();
	if (!trimmed) return null;

	return normalizeInternalHref(trimmed, fieldLabel);
}
