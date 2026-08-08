export const EDITORIAL_TEXT_FONTS = ["serif", "sans"] as const;
export const EDITORIAL_TEXT_SCALES = ["sm", "base", "lg"] as const;
export const EDITORIAL_TEXT_COLORS = ["ink", "muted", "wine", "paper"] as const;
export const EDITORIAL_TEXT_EMPHASES = ["normal", "strong"] as const;

export type EditorialTextStyle = {
	font: (typeof EDITORIAL_TEXT_FONTS)[number];
	scale: (typeof EDITORIAL_TEXT_SCALES)[number];
	color: (typeof EDITORIAL_TEXT_COLORS)[number];
	emphasis: (typeof EDITORIAL_TEXT_EMPHASES)[number];
};

export const DEFAULT_EDITORIAL_TEXT_STYLE: EditorialTextStyle = {
	font: "serif",
	scale: "base",
	color: "ink",
	emphasis: "normal",
};

const MARKER = /^<!--\s*editorial-style:([\w=-]+(?:;[\w=-]+)*)\s*-->\s*/;

export function normalizeEditorialTextStyle(value: unknown): EditorialTextStyle {
	const source =
		typeof value === "string"
			? Object.fromEntries(value.split(";").map((part) => part.split("=", 2)))
			: value;
	const candidate = typeof source === "object" && source ? (source as Partial<EditorialTextStyle>) : {};
	return {
		font: EDITORIAL_TEXT_FONTS.includes(candidate.font as EditorialTextStyle["font"])
			? (candidate.font as EditorialTextStyle["font"])
			: DEFAULT_EDITORIAL_TEXT_STYLE.font,
		scale: EDITORIAL_TEXT_SCALES.includes(candidate.scale as EditorialTextStyle["scale"])
			? (candidate.scale as EditorialTextStyle["scale"])
			: DEFAULT_EDITORIAL_TEXT_STYLE.scale,
		color: EDITORIAL_TEXT_COLORS.includes(candidate.color as EditorialTextStyle["color"])
			? (candidate.color as EditorialTextStyle["color"])
			: DEFAULT_EDITORIAL_TEXT_STYLE.color,
		emphasis: EDITORIAL_TEXT_EMPHASES.includes(candidate.emphasis as EditorialTextStyle["emphasis"])
			? (candidate.emphasis as EditorialTextStyle["emphasis"])
			: DEFAULT_EDITORIAL_TEXT_STYLE.emphasis,
	};
}

export function readEditorialText(source?: string | null) {
	const value = source ?? "";
	const match = value.match(MARKER);
	return {
		source: match ? value.slice(match[0].length) : value,
		style: normalizeEditorialTextStyle(match?.[1]),
	};
}

export function serializeEditorialText(source: string, style: unknown) {
	const normalized = normalizeEditorialTextStyle(style);
	const text = readEditorialText(source).source.trim();
	if (!text) return "";
	if (JSON.stringify(normalized) === JSON.stringify(DEFAULT_EDITORIAL_TEXT_STYLE)) return text;
	return `<!-- editorial-style:font=${normalized.font};scale=${normalized.scale};color=${normalized.color};emphasis=${normalized.emphasis} -->\n${text}`;
}
