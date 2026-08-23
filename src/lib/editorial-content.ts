export type EditorialImage = {
	src: string;
	alt?: string | null;
	caption?: string | null;
};

export const EDITORIAL_BACKGROUND_FITS = ["cover", "contain"] as const;
export const EDITORIAL_BACKGROUND_POSITIONS = ["center", "top", "bottom", "left", "right"] as const;
export const EDITORIAL_BACKGROUND_OVERLAYS = ["none", "soft", "medium", "strong"] as const;
export const EDITORIAL_BACKGROUND_CONTRASTS = ["light", "dark"] as const;

export type EditorialBackgroundFit = (typeof EDITORIAL_BACKGROUND_FITS)[number];
export type EditorialBackgroundPosition = (typeof EDITORIAL_BACKGROUND_POSITIONS)[number];
export type EditorialBackgroundOverlay = (typeof EDITORIAL_BACKGROUND_OVERLAYS)[number];
export type EditorialBackgroundContrast = (typeof EDITORIAL_BACKGROUND_CONTRASTS)[number];

export type EditorialBackground = {
	image?: EditorialImage | null;
	fit?: EditorialBackgroundFit | null;
	position?: EditorialBackgroundPosition | null;
	overlay?: EditorialBackgroundOverlay | null;
	contrast?: EditorialBackgroundContrast | null;
};

const EDITORIAL_BACKGROUND_POSITION_VALUES: Record<EditorialBackgroundPosition, string> = {
	center: "center",
	top: "center top",
	bottom: "center bottom",
	left: "left center",
	right: "right center",
};

const EDITORIAL_DARK_OVERLAYS: Record<Exclude<EditorialBackgroundOverlay, "none">, string> = {
	soft: "linear-gradient(120deg, rgba(11,11,11,0.54) 0%, rgba(11,11,11,0.34) 100%)",
	medium: "linear-gradient(120deg, rgba(11,11,11,0.72) 0%, rgba(11,11,11,0.52) 100%)",
	strong: "linear-gradient(120deg, rgba(11,11,11,0.9) 0%, rgba(11,11,11,0.74) 100%)",
};

const EDITORIAL_LIGHT_OVERLAYS: Record<Exclude<EditorialBackgroundOverlay, "none">, string> = {
	soft: "linear-gradient(120deg, rgba(247,244,239,0.58) 0%, rgba(247,244,239,0.38) 100%)",
	medium: "linear-gradient(120deg, rgba(247,244,239,0.74) 0%, rgba(247,244,239,0.54) 100%)",
	strong: "linear-gradient(120deg, rgba(247,244,239,0.88) 0%, rgba(247,244,239,0.7) 100%)",
};

export function resolveEditorialBackgroundImage(
	background?: EditorialBackground | null,
	fallbackImage?: EditorialImage | null,
) {
	return background?.image?.src ? background.image : fallbackImage?.src ? fallbackImage : null;
}

export function getEditorialBackgroundContrast(
	background?: EditorialBackground | null,
	fallback: EditorialBackgroundContrast = "light",
): EditorialBackgroundContrast {
	return background?.contrast === "dark" || background?.contrast === "light" ? background.contrast : fallback;
}

export function getEditorialBackgroundStyle(
	background?: EditorialBackground | null,
	fallbackImage?: EditorialImage | null,
	fallbackOverlay: EditorialBackgroundOverlay = "medium",
) {
	const image = resolveEditorialBackgroundImage(background, fallbackImage);
	if (!image?.src) return undefined;

	const contrast = getEditorialBackgroundContrast(background);
	const fit = background?.fit === "cover" || background?.fit === "contain" ? background.fit : "cover";
	const position =
		background?.position === "center" ||
		background?.position === "top" ||
		background?.position === "bottom" ||
		background?.position === "left" ||
		background?.position === "right"
			? background.position
			: "center";
	const overlay =
		background?.overlay === "none" ||
		background?.overlay === "soft" ||
		background?.overlay === "medium" ||
		background?.overlay === "strong"
			? background.overlay
			: fallbackOverlay;
	const overlayImage =
		overlay === "none"
			? null
			: contrast === "dark"
				? EDITORIAL_LIGHT_OVERLAYS[overlay]
				: EDITORIAL_DARK_OVERLAYS[overlay];
	const backgroundImage = [`url(${JSON.stringify(image.src)})`];

	if (overlayImage) {
		backgroundImage.unshift(overlayImage);
	}

	return {
		backgroundImage: backgroundImage.join(", "),
		backgroundPosition: EDITORIAL_BACKGROUND_POSITION_VALUES[position],
		backgroundRepeat: "no-repeat",
		backgroundSize: fit,
	};
}

export type EditorialSeo = {
	title?: string | null;
	description?: string | null;
};

export type EditorialLink = {
	label: string;
	href: string;
};

export type EditorialCalloutCard = {
	label?: string | null;
	title: string;
	body: string;
};

export type EditorialBase = {
	_id?: unknown;
	type:
		| "event"
		| "project"
		| "page_sarau"
		| "page_about"
		| "page_contact"
		| "page_home"
		| "page_events"
		| "page_projects"
		| "page_products"
		| "page_product"
		| "site_global";
	slug: string;
	title: string;
	eyebrow?: string | null;
	summary?: string | null;
	body?: string | null;
	published: boolean;
	order: number;
	seo?: EditorialSeo | null;
	createdAt?: string;
	updatedAt?: string;
	createdBy?: string | null;
	updatedBy?: string | null;
};

export type EditorialEvent = EditorialBase & {
	type: "event";
	status?: string | null;
	period?: string | null;
	location?: string | null;
	description?: string | null;
	featured?: boolean;
	image?: EditorialImage | null;
	meta?: {
		relatedProductSlugs?: string[];
		relatedProjectSlugs?: string[];
	} | null;
};

export type EditorialProject = EditorialBase & {
	type: "project";
	period?: string | null;
	location?: string | null;
	description?: string | null;
	featured?: boolean;
	image?: EditorialImage | null;
	meta?: {
		relatedProductSlugs?: string[];
		relatedEventSlugs?: string[];
	} | null;
};

export type EditorialSarauPage = EditorialBase & {
	type: "page_sarau";
	hero?: {
		eyebrow?: string | null;
		title?: string | null;
		body?: string | null;
		image?: EditorialImage | null;
		background?: EditorialBackground | null;
		primaryCtaLabel?: string | null;
		primaryCtaHref?: string | null;
		secondaryCtaLabel?: string | null;
		secondaryCtaHref?: string | null;
	} | null;
	agenda?: {
		eyebrow?: string | null;
		title?: string | null;
		body?: string | null;
	} | null;
	why?: {
		title?: string | null;
		body?: string | null;
	} | null;
	gallery?: {
		eyebrow?: string | null;
		title?: string | null;
		body?: string | null;
	} | null;
	signals?: string[];
	programNotes?: Array<{ title: string; body: string }>;
	continueLinks?: EditorialLink[];
};

export type EditorialAboutPage = EditorialBase & {
	type: "page_about";
	hero?: {
		eyebrow?: string | null;
		title?: string | null;
		body?: string | null;
		background?: EditorialBackground | null;
	} | null;
	section?: {
		eyebrow?: string | null;
		title?: string | null;
		body?: string | null;
		extended?: string | null;
		image?: EditorialImage | null;
		primaryCtaLabel?: string | null;
		primaryCtaHref?: string | null;
	} | null;
	cards?: Array<{ eyebrow?: string | null; title: string; body: string }>;
	closing?: {
		eyebrow?: string | null;
		title?: string | null;
		body?: string | null;
		coreEyebrow?: string | null;
		coreTitle?: string | null;
	} | null;
};

export type EditorialContactPage = EditorialBase & {
	type: "page_contact";
	hero?: {
		eyebrow?: string | null;
		title?: string | null;
		body?: string | null;
		featuredLabel?: string | null;
		featuredValue?: string | null;
		background?: EditorialBackground | null;
	} | null;
	form?: {
		title?: string | null;
		description?: string | null;
		subjects?: string[];
	} | null;
	direct?: {
		title?: string | null;
		description?: string | null;
		links?: Array<{ label: string; href: string; text: string }>;
	} | null;
	paths?: {
		title?: string | null;
		description?: string | null;
		links?: EditorialLink[];
	} | null;
	closing?: {
		title?: string | null;
		primaryCtaLabel?: string | null;
		primaryCtaHref?: string | null;
		secondaryCtaLabel?: string | null;
		secondaryCtaHref?: string | null;
	} | null;
};

export type EditorialHomePage = EditorialBase & {
	type: "page_home";
	hero?: {
		mode?: "custom" | "product" | null;
		productSlug?: string | null;
		eyebrow?: string | null;
		title?: string | null;
		description?: string | null;
		primaryCtaLabel?: string | null;
		primaryCtaHref?: string | null;
		secondaryCtaLabel?: string | null;
		secondaryCtaHref?: string | null;
		supportingLine?: string | null;
		featureEyebrow?: string | null;
		featureTitle?: string | null;
		featureBody?: string | null;
		featureQuote?: string | null;
		featureImage?: EditorialImage | null;
		background?: EditorialBackground | null;
	} | null;
	manifesto?: {
		title?: string | null;
		body?: string | null;
		linkLabel?: string | null;
		linkHref?: string | null;
		background?: EditorialBackground | null;
	} | null;
	featuredBook?: {
		productSlug?: string | null;
		eyebrow?: string | null;
		title?: string | null;
		body?: string | null;
		primaryCtaLabel?: string | null;
		secondaryCtaLabel?: string | null;
	} | null;
	catalog?: {
		title?: string | null;
		body?: string | null;
		primaryCardFallback?: string | null;
		defaultCardFallback?: string | null;
		viewBookLabel?: string | null;
		launchAlertLabel?: string | null;
	} | null;
	program?: {
		eyebrow?: string | null;
		title?: string | null;
		body?: string | null;
		ctaLabel?: string | null;
		ctaHref?: string | null;
		background?: EditorialBackground | null;
	} | null;
	author?: {
		eyebrow?: string | null;
		title?: string | null;
		body?: string | null;
		secondaryBody?: string | null;
		primaryCtaLabel?: string | null;
		primaryCtaHref?: string | null;
		secondaryCtaLabel?: string | null;
		secondaryCtaHref?: string | null;
		image?: EditorialImage | null;
	} | null;
	community?: {
		title?: string | null;
		body?: string | null;
		primaryCtaLabel?: string | null;
		primaryCtaHref?: string | null;
		secondaryLinks?: EditorialLink[];
	} | null;
};

export type EditorialEventsPage = EditorialBase & {
	type: "page_events";
	hero?: {
		eyebrow?: string | null;
		title?: string | null;
		body?: string | null;
		primaryCtaLabel?: string | null;
		primaryCtaHref?: string | null;
		secondaryCtaLabel?: string | null;
		secondaryCtaHref?: string | null;
		background?: EditorialBackground | null;
	} | null;
	curatorialNote?: {
		title?: string | null;
		body?: string | null;
	} | null;
	agenda?: {
		label?: string | null;
		title?: string | null;
		body?: string | null;
		emptyText?: string | null;
	} | null;
	archive?: {
		label?: string | null;
		title?: string | null;
		body?: string | null;
	} | null;
	finalCta?: {
		title?: string | null;
		body?: string | null;
		primaryCtaLabel?: string | null;
		primaryCtaHref?: string | null;
		secondaryCtaLabel?: string | null;
		secondaryCtaHref?: string | null;
	} | null;
};

export type EditorialProjectsPage = EditorialBase & {
	type: "page_projects";
	hero?: {
		eyebrow?: string | null;
		title?: string | null;
		body?: string | null;
		imageLabel?: string | null;
		background?: EditorialBackground | null;
	} | null;
	curatorialNote?: {
		title?: string | null;
		body?: string | null;
	} | null;
	listing?: {
		label?: string | null;
		title?: string | null;
		body?: string | null;
		emptyText?: string | null;
	} | null;
	finalCta?: {
		title?: string | null;
		body?: string | null;
		primaryCtaLabel?: string | null;
		primaryCtaHref?: string | null;
		secondaryCtaLabel?: string | null;
		secondaryCtaHref?: string | null;
	} | null;
};

export type EditorialProductsPage = EditorialBase & {
	type: "page_products";
	hero?: {
		eyebrow?: string | null;
		title?: string | null;
		body?: string | null;
		primaryCtaLabel?: string | null;
		primaryCtaHref?: string | null;
		secondaryCtaLabel?: string | null;
		secondaryCtaHref?: string | null;
		quote?: string | null;
	} | null;
	curatorialNote?: {
		title?: string | null;
		body?: string | null;
	} | null;
	listing?: {
		label?: string | null;
		title?: string | null;
		body?: string | null;
		emptyText?: string | null;
		cardPrimaryFallback?: string | null;
		cardSecondaryFallback?: string | null;
		viewBookLabel?: string | null;
		launchAlertLabel?: string | null;
	} | null;
	finalCta?: {
		title?: string | null;
		body?: string | null;
		primaryCtaLabel?: string | null;
		primaryCtaHref?: string | null;
	} | null;
};

export type EditorialProductPage = EditorialBase & {
	type: "page_product";
	synopsis?: {
		label?: string | null;
	} | null;
	excerpt?: {
		title?: string | null;
		bodyFallback?: string | null;
	} | null;
	details?: {
		title?: string | null;
	} | null;
	related?: {
		title?: string | null;
		body?: string | null;
		viewBookLabel?: string | null;
		fallbackSummary?: string | null;
	} | null;
	continuity?: {
		title?: string | null;
		body?: string | null;
		links?: EditorialLink[];
	} | null;
	notFound?: {
		title?: string | null;
		body?: string | null;
		primaryCtaLabel?: string | null;
		primaryCtaHref?: string | null;
	} | null;
};

export type EditorialSiteGlobal = EditorialBase & {
	type: "site_global";
	newsletter?: {
		title?: string | null;
		description?: string | null;
		placeholder?: string | null;
		buttonLabel?: string | null;
	} | null;
	footer?: {
		brandEyebrow?: string | null;
		brandDescription?: string | null;
		catalogueTitle?: string | null;
		editorialTitle?: string | null;
		supportTitle?: string | null;
		auxiliaryLinks?: EditorialLink[];
		copyrightText?: string | null;
	} | null;
};

export type EditorialDocument =
	| EditorialEvent
	| EditorialProject
	| EditorialSarauPage
	| EditorialAboutPage
	| EditorialContactPage
	| EditorialHomePage
	| EditorialEventsPage
	| EditorialProjectsPage
	| EditorialProductsPage
	| EditorialProductPage
	| EditorialSiteGlobal;
