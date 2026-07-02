export type EditorialImage = {
	src: string;
	alt?: string | null;
	caption?: string | null;
};

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
	} | null;
	manifesto?: {
		title?: string | null;
		body?: string | null;
		linkLabel?: string | null;
		linkHref?: string | null;
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
