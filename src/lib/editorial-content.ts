export type EditorialImage = {
	src: string;
	alt?: string | null;
	caption?: string | null;
};

export type EditorialSeo = {
	title?: string | null;
	description?: string | null;
};

export type EditorialBase = {
	_id?: unknown;
	type: "event" | "project" | "page_sarau" | "page_about" | "page_contact" | "page_home";
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
	} | null;
	why?: {
		title?: string | null;
		body?: string | null;
	} | null;
	signals?: string[];
	programNotes?: Array<{ title: string; body: string }>;
	continueLinks?: Array<{ label: string; href: string }>;
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
	} | null;
	form?: {
		title?: string | null;
		description?: string | null;
	} | null;
	direct?: {
		title?: string | null;
		description?: string | null;
		links?: Array<{ label: string; href: string; text: string }>;
	} | null;
	paths?: {
		title?: string | null;
		description?: string | null;
		links?: Array<{ label: string; href: string }>;
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
		secondaryLinks?: Array<{ label: string; href: string }>;
	} | null;
};

export type EditorialDocument =
	| EditorialEvent
	| EditorialProject
	| EditorialSarauPage
	| EditorialAboutPage
	| EditorialContactPage
	| EditorialHomePage;
