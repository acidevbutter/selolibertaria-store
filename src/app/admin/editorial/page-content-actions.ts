"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCapability } from "@/lib/api-auth";
import type {
	EditorialDocument,
	EditorialEventsPage,
	EditorialHomePage,
	EditorialProductPage,
	EditorialProductsPage,
	EditorialProjectsPage,
	EditorialSiteGlobal,
} from "@/lib/editorial-content";
import { getEditorialRecordForAdmin } from "@/lib/editorial-content-store";
import { getDb } from "@/lib/mongodb";

const COLLECTION = "editorialContent";

type PageCopyType =
	| "page_home"
	| "page_events"
	| "page_projects"
	| "page_products"
	| "page_product"
	| "site_global";

async function requireEditorialManager() {
	const auth = await requireCapability("editorial.write");
	if ("error" in auth) {
		if (auth.error?.status === 401) redirect("/login");
		redirect("/forbidden");
	}
	return auth.session;
}

function optionalString(value: FormDataEntryValue | null) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed ? trimmed : null;
}

function parseOrder(value: FormDataEntryValue | null, fallback = 1) {
	if (typeof value !== "string") return fallback;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBoolean(value: FormDataEntryValue | null, defaultValue = false) {
	if (typeof value !== "string") return defaultValue;
	return value === "true" || value === "on" || value === "1";
}

function readLinks(formData: FormData, prefix: string, count: number) {
	return Array.from({ length: count }, (_, index) => ({
		label: optionalString(formData.get(`${prefix}${index + 1}Label`)),
		href: optionalString(formData.get(`${prefix}${index + 1}Href`)),
	}))
		.filter((item): item is { label: string; href: string } => Boolean(item.label && item.href));
}

function readStrings(formData: FormData, key: string, count: number) {
	return Array.from({ length: count }, (_, index) => optionalString(formData.get(`${key}${index + 1}`))).filter(
		(value): value is string => Boolean(value),
	);
}

function refreshPaths(type: PageCopyType) {
	revalidatePath("/");
	revalidatePath("/products");
	revalidatePath("/events");
	revalidatePath("/projects");
	revalidatePath("/sarau-safado");
	revalidatePath("/about");
	revalidatePath("/contact");
	revalidatePath("/faq");
	revalidatePath("/terms");
	revalidatePath("/privacy");
	revalidatePath("/admin/editorial");
	revalidatePath("/admin/editorial/home");
	revalidatePath("/admin/editorial/events");
	revalidatePath("/admin/editorial/projects");
	revalidatePath("/admin/editorial/products");
	revalidatePath("/admin/editorial/pagina-do-livro");
	revalidatePath("/admin/editorial/global");
	if (type === "page_product") revalidatePath("/product/[slug]", "page");
}

async function upsertPageRecord<T extends EditorialDocument>(type: T["type"], doc: T) {
	const db = await getDb();
	await db.collection<T>(COLLECTION).updateOne({ type, slug: doc.slug } as Partial<T>, { $set: doc }, { upsert: true });
}

function buildHomePageDoc(formData: FormData, actor: string, current: EditorialHomePage | null): EditorialHomePage {
	const now = new Date().toISOString();
	return {
		type: "page_home",
		slug: "home",
		title: optionalString(formData.get("title")) ?? current?.title ?? "Página inicial",
		summary: optionalString(formData.get("summary")),
		published: parseBoolean(formData.get("published"), current?.published ?? true),
		order: parseOrder(formData.get("order"), current?.order ?? 1),
		hero: {
			eyebrow: optionalString(formData.get("heroEyebrow")),
			title: optionalString(formData.get("heroTitle")),
			description: optionalString(formData.get("heroDescription")),
			primaryCtaLabel: optionalString(formData.get("heroPrimaryCtaLabel")),
			primaryCtaHref: optionalString(formData.get("heroPrimaryCtaHref")),
			secondaryCtaLabel: optionalString(formData.get("heroSecondaryCtaLabel")),
			secondaryCtaHref: optionalString(formData.get("heroSecondaryCtaHref")),
			supportingLine: optionalString(formData.get("heroSupportingLine")),
			featureEyebrow: optionalString(formData.get("heroFeatureEyebrow")),
			featureTitle: optionalString(formData.get("heroFeatureTitle")),
			featureBody: optionalString(formData.get("heroFeatureBody")),
			featureQuote: optionalString(formData.get("heroFeatureQuote")),
		},
		manifesto: {
			title: optionalString(formData.get("manifestoTitle")),
			body: optionalString(formData.get("manifestoBody")),
			linkLabel: optionalString(formData.get("manifestoLinkLabel")),
			linkHref: optionalString(formData.get("manifestoLinkHref")),
		},
		featuredBook: {
			eyebrow: optionalString(formData.get("featuredEyebrow")),
			title: optionalString(formData.get("featuredTitle")),
			body: optionalString(formData.get("featuredBody")),
			primaryCtaLabel: optionalString(formData.get("featuredPrimaryCtaLabel")),
			secondaryCtaLabel: optionalString(formData.get("featuredSecondaryCtaLabel")),
		},
		catalog: {
			title: optionalString(formData.get("catalogTitle")),
			body: optionalString(formData.get("catalogBody")),
			primaryCardFallback: optionalString(formData.get("catalogPrimaryFallback")),
			defaultCardFallback: optionalString(formData.get("catalogDefaultFallback")),
			viewBookLabel: optionalString(formData.get("catalogViewBookLabel")),
			launchAlertLabel: optionalString(formData.get("catalogLaunchAlertLabel")),
		},
		program: {
			eyebrow: optionalString(formData.get("programEyebrow")),
			title: optionalString(formData.get("programTitle")),
			body: optionalString(formData.get("programBody")),
			ctaLabel: optionalString(formData.get("programCtaLabel")),
			ctaHref: optionalString(formData.get("programCtaHref")),
		},
		author: current?.author ?? null,
		community: current?.community ?? null,
		createdAt: current?.createdAt ?? now,
		createdBy: current?.createdBy ?? actor,
		updatedAt: now,
		updatedBy: actor,
	};
}

function buildEventsPageDoc(
	formData: FormData,
	actor: string,
	current: EditorialEventsPage | null,
): EditorialEventsPage {
	const now = new Date().toISOString();
	return {
		type: "page_events",
		slug: "events",
		title: optionalString(formData.get("title")) ?? current?.title ?? "Página de eventos",
		summary: optionalString(formData.get("summary")),
		published: parseBoolean(formData.get("published"), current?.published ?? true),
		order: parseOrder(formData.get("order"), current?.order ?? 1),
		hero: {
			eyebrow: optionalString(formData.get("heroEyebrow")),
			title: optionalString(formData.get("heroTitle")),
			body: optionalString(formData.get("heroBody")),
			primaryCtaLabel: optionalString(formData.get("heroPrimaryCtaLabel")),
			primaryCtaHref: optionalString(formData.get("heroPrimaryCtaHref")),
			secondaryCtaLabel: optionalString(formData.get("heroSecondaryCtaLabel")),
			secondaryCtaHref: optionalString(formData.get("heroSecondaryCtaHref")),
		},
		curatorialNote: {
			title: optionalString(formData.get("curatorialTitle")),
			body: optionalString(formData.get("curatorialBody")),
		},
		agenda: {
			label: optionalString(formData.get("agendaLabel")),
			title: optionalString(formData.get("agendaTitle")),
			body: optionalString(formData.get("agendaBody")),
			emptyText: optionalString(formData.get("agendaEmptyText")),
		},
		archive: {
			label: optionalString(formData.get("archiveLabel")),
			title: optionalString(formData.get("archiveTitle")),
			body: optionalString(formData.get("archiveBody")),
		},
		finalCta: {
			title: optionalString(formData.get("finalTitle")),
			body: optionalString(formData.get("finalBody")),
			primaryCtaLabel: optionalString(formData.get("finalPrimaryCtaLabel")),
			primaryCtaHref: optionalString(formData.get("finalPrimaryCtaHref")),
			secondaryCtaLabel: optionalString(formData.get("finalSecondaryCtaLabel")),
			secondaryCtaHref: optionalString(formData.get("finalSecondaryCtaHref")),
		},
		createdAt: current?.createdAt ?? now,
		createdBy: current?.createdBy ?? actor,
		updatedAt: now,
		updatedBy: actor,
	};
}

function buildProjectsPageDoc(
	formData: FormData,
	actor: string,
	current: EditorialProjectsPage | null,
): EditorialProjectsPage {
	const now = new Date().toISOString();
	return {
		type: "page_projects",
		slug: "projects",
		title: optionalString(formData.get("title")) ?? current?.title ?? "Página de projetos",
		summary: optionalString(formData.get("summary")),
		published: parseBoolean(formData.get("published"), current?.published ?? true),
		order: parseOrder(formData.get("order"), current?.order ?? 1),
		hero: {
			eyebrow: optionalString(formData.get("heroEyebrow")),
			title: optionalString(formData.get("heroTitle")),
			body: optionalString(formData.get("heroBody")),
			imageLabel: optionalString(formData.get("heroImageLabel")),
		},
		curatorialNote: {
			title: optionalString(formData.get("curatorialTitle")),
			body: optionalString(formData.get("curatorialBody")),
		},
		listing: {
			label: optionalString(formData.get("listingLabel")),
			title: optionalString(formData.get("listingTitle")),
			body: optionalString(formData.get("listingBody")),
			emptyText: optionalString(formData.get("listingEmptyText")),
		},
		finalCta: {
			title: optionalString(formData.get("finalTitle")),
			body: optionalString(formData.get("finalBody")),
			primaryCtaLabel: optionalString(formData.get("finalPrimaryCtaLabel")),
			primaryCtaHref: optionalString(formData.get("finalPrimaryCtaHref")),
			secondaryCtaLabel: optionalString(formData.get("finalSecondaryCtaLabel")),
			secondaryCtaHref: optionalString(formData.get("finalSecondaryCtaHref")),
		},
		createdAt: current?.createdAt ?? now,
		createdBy: current?.createdBy ?? actor,
		updatedAt: now,
		updatedBy: actor,
	};
}

function buildProductsPageDoc(
	formData: FormData,
	actor: string,
	current: EditorialProductsPage | null,
): EditorialProductsPage {
	const now = new Date().toISOString();
	return {
		type: "page_products",
		slug: "products",
		title: optionalString(formData.get("title")) ?? current?.title ?? "Página de livros",
		summary: optionalString(formData.get("summary")),
		published: parseBoolean(formData.get("published"), current?.published ?? true),
		order: parseOrder(formData.get("order"), current?.order ?? 1),
		hero: {
			eyebrow: optionalString(formData.get("heroEyebrow")),
			title: optionalString(formData.get("heroTitle")),
			body: optionalString(formData.get("heroBody")),
			primaryCtaLabel: optionalString(formData.get("heroPrimaryCtaLabel")),
			primaryCtaHref: optionalString(formData.get("heroPrimaryCtaHref")),
			secondaryCtaLabel: optionalString(formData.get("heroSecondaryCtaLabel")),
			secondaryCtaHref: optionalString(formData.get("heroSecondaryCtaHref")),
			quote: optionalString(formData.get("heroQuote")),
		},
		curatorialNote: {
			title: optionalString(formData.get("curatorialTitle")),
			body: optionalString(formData.get("curatorialBody")),
		},
		listing: {
			label: optionalString(formData.get("listingLabel")),
			title: optionalString(formData.get("listingTitle")),
			body: optionalString(formData.get("listingBody")),
			emptyText: optionalString(formData.get("listingEmptyText")),
			cardPrimaryFallback: optionalString(formData.get("listingCardPrimaryFallback")),
			cardSecondaryFallback: optionalString(formData.get("listingCardSecondaryFallback")),
			viewBookLabel: optionalString(formData.get("listingViewBookLabel")),
			launchAlertLabel: optionalString(formData.get("listingLaunchAlertLabel")),
		},
		finalCta: {
			title: optionalString(formData.get("finalTitle")),
			body: optionalString(formData.get("finalBody")),
			primaryCtaLabel: optionalString(formData.get("finalPrimaryCtaLabel")),
			primaryCtaHref: optionalString(formData.get("finalPrimaryCtaHref")),
		},
		createdAt: current?.createdAt ?? now,
		createdBy: current?.createdBy ?? actor,
		updatedAt: now,
		updatedBy: actor,
	};
}

function buildProductPageDoc(
	formData: FormData,
	actor: string,
	current: EditorialProductPage | null,
): EditorialProductPage {
	const now = new Date().toISOString();
	return {
		type: "page_product",
		slug: "product",
		title: optionalString(formData.get("title")) ?? current?.title ?? "Página do livro",
		summary: optionalString(formData.get("summary")),
		published: parseBoolean(formData.get("published"), current?.published ?? true),
		order: parseOrder(formData.get("order"), current?.order ?? 1),
		synopsis: {
			label: optionalString(formData.get("synopsisLabel")),
		},
		excerpt: {
			title: optionalString(formData.get("excerptTitle")),
			bodyFallback: optionalString(formData.get("excerptBodyFallback")),
		},
		details: {
			title: optionalString(formData.get("detailsTitle")),
		},
		related: {
			title: optionalString(formData.get("relatedTitle")),
			body: optionalString(formData.get("relatedBody")),
			viewBookLabel: optionalString(formData.get("relatedViewBookLabel")),
			fallbackSummary: optionalString(formData.get("relatedFallbackSummary")),
		},
		continuity: {
			title: optionalString(formData.get("continuityTitle")),
			body: optionalString(formData.get("continuityBody")),
			links: readLinks(formData, "continuityLink", 3),
		},
		notFound: {
			title: optionalString(formData.get("notFoundTitle")),
			body: optionalString(formData.get("notFoundBody")),
			primaryCtaLabel: optionalString(formData.get("notFoundPrimaryCtaLabel")),
			primaryCtaHref: optionalString(formData.get("notFoundPrimaryCtaHref")),
		},
		createdAt: current?.createdAt ?? now,
		createdBy: current?.createdBy ?? actor,
		updatedAt: now,
		updatedBy: actor,
	};
}

function buildSiteGlobalDoc(
	formData: FormData,
	actor: string,
	current: EditorialSiteGlobal | null,
): EditorialSiteGlobal {
	const now = new Date().toISOString();
	return {
		type: "site_global",
		slug: "public-global",
		title: optionalString(formData.get("title")) ?? current?.title ?? "Conteúdo global público",
		summary: optionalString(formData.get("summary")),
		published: parseBoolean(formData.get("published"), current?.published ?? true),
		order: parseOrder(formData.get("order"), current?.order ?? 1),
		newsletter: {
			title: optionalString(formData.get("newsletterTitle")),
			description: optionalString(formData.get("newsletterDescription")),
			placeholder: optionalString(formData.get("newsletterPlaceholder")),
			buttonLabel: optionalString(formData.get("newsletterButtonLabel")),
		},
		footer: {
			brandEyebrow: optionalString(formData.get("footerBrandEyebrow")),
			brandDescription: optionalString(formData.get("footerBrandDescription")),
			catalogueTitle: optionalString(formData.get("footerCatalogueTitle")),
			editorialTitle: optionalString(formData.get("footerEditorialTitle")),
			supportTitle: optionalString(formData.get("footerSupportTitle")),
			auxiliaryLinks: readLinks(formData, "footerAuxLink", 4),
			copyrightText: optionalString(formData.get("footerCopyrightText")),
		},
		createdAt: current?.createdAt ?? now,
		createdBy: current?.createdBy ?? actor,
		updatedAt: now,
		updatedBy: actor,
	};
}

export async function updateEditorialHomeCopyAction(formData: FormData) {
	const session = await requireEditorialManager();
	const current = (await getEditorialRecordForAdmin("page_home")) as EditorialHomePage | null;
	const doc = buildHomePageDoc(formData, String(session.sub), current);
	await upsertPageRecord("page_home", doc);
	refreshPaths("page_home");
}

export async function updateEditorialEventsPageCopyAction(formData: FormData) {
	const session = await requireEditorialManager();
	const current = (await getEditorialRecordForAdmin("page_events")) as EditorialEventsPage | null;
	const doc = buildEventsPageDoc(formData, String(session.sub), current);
	await upsertPageRecord("page_events", doc);
	refreshPaths("page_events");
}

export async function updateEditorialProjectsPageCopyAction(formData: FormData) {
	const session = await requireEditorialManager();
	const current = (await getEditorialRecordForAdmin("page_projects")) as EditorialProjectsPage | null;
	const doc = buildProjectsPageDoc(formData, String(session.sub), current);
	await upsertPageRecord("page_projects", doc);
	refreshPaths("page_projects");
}

export async function updateEditorialProductsPageCopyAction(formData: FormData) {
	const session = await requireEditorialManager();
	const current = (await getEditorialRecordForAdmin("page_products")) as EditorialProductsPage | null;
	const doc = buildProductsPageDoc(formData, String(session.sub), current);
	await upsertPageRecord("page_products", doc);
	refreshPaths("page_products");
}

export async function updateEditorialProductPageCopyAction(formData: FormData) {
	const session = await requireEditorialManager();
	const current = (await getEditorialRecordForAdmin("page_product")) as EditorialProductPage | null;
	const doc = buildProductPageDoc(formData, String(session.sub), current);
	await upsertPageRecord("page_product", doc);
	refreshPaths("page_product");
}

export async function updateEditorialSiteGlobalCopyAction(formData: FormData) {
	const session = await requireEditorialManager();
	const current = (await getEditorialRecordForAdmin("site_global")) as EditorialSiteGlobal | null;
	const doc = buildSiteGlobalDoc(formData, String(session.sub), current);
	await upsertPageRecord("site_global", doc);
	refreshPaths("site_global");
}

export async function getEditorialHomeCopyRecord() {
	return (await getEditorialRecordForAdmin("page_home")) as EditorialHomePage | null;
}

export async function getEditorialEventsPageCopyRecord() {
	return (await getEditorialRecordForAdmin("page_events")) as EditorialEventsPage | null;
}

export async function getEditorialProjectsPageCopyRecord() {
	return (await getEditorialRecordForAdmin("page_projects")) as EditorialProjectsPage | null;
}

export async function getEditorialProductsPageCopyRecord() {
	return (await getEditorialRecordForAdmin("page_products")) as EditorialProductsPage | null;
}

export async function getEditorialProductPageCopyRecord() {
	return (await getEditorialRecordForAdmin("page_product")) as EditorialProductPage | null;
}

export async function getEditorialSiteGlobalCopyRecord() {
	return (await getEditorialRecordForAdmin("site_global")) as EditorialSiteGlobal | null;
}
