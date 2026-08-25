"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { env } from "@/env.mjs";
import { assertAdminImageUploadFile } from "@/lib/admin-image-upload";
import { requireCapability } from "@/lib/api-auth";
import type {
	EditorialBackground,
	EditorialBackgroundContrast,
	EditorialBackgroundFit,
	EditorialBackgroundOverlay,
	EditorialBackgroundPosition,
	EditorialDocument,
	EditorialEventsPage,
	EditorialHomePage,
	EditorialProductPage,
	EditorialProductsPage,
	EditorialProjectsPage,
	EditorialSiteGlobal,
} from "@/lib/editorial-content";
import { getEditorialRecordForAdmin } from "@/lib/editorial-content-store";
import { parseEditorialHrefChoice } from "@/lib/editorial-link-policy";
import { uploadImageFileToFastAPI } from "@/lib/media-upload";

type PageCopyType =
	| "page_home"
	| "page_events"
	| "page_projects"
	| "page_products"
	| "page_product"
	| "site_global";

export type PageCopyActionState = {
	status: "idle" | "success";
	message: string | null;
	savedAt: string | null;
};

type PageCopyRecordMap = {
	page_home: EditorialHomePage;
	page_events: EditorialEventsPage;
	page_projects: EditorialProjectsPage;
	page_products: EditorialProductsPage;
	page_product: EditorialProductPage;
	site_global: EditorialSiteGlobal;
};

async function requireEditorialManager() {
	const auth = await requireCapability("editorial.write");

	if ("error" in auth) {
		if (auth.error?.status === 401) {
			redirect("/login");
		}

		redirect("/forbidden");
	}

	return auth.session;
}

function optionalString(value: FormDataEntryValue | null) {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	return trimmed ? trimmed : null;
}

function parseOrder(value: FormDataEntryValue | null, fallback = 1) {
	if (typeof value !== "string") {
		return fallback;
	}

	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBoolean(value: FormDataEntryValue | null, defaultValue = false) {
	if (typeof value !== "string") {
		return defaultValue;
	}

	return value === "true" || value === "on" || value === "1";
}

function parseBackgroundFit(
	value: FormDataEntryValue | null,
	fallback: EditorialBackgroundFit = "cover",
): EditorialBackgroundFit {
	return value === "cover" || value === "contain" ? value : fallback;
}

function parseBackgroundPosition(
	value: FormDataEntryValue | null,
	fallback: EditorialBackgroundPosition = "center",
): EditorialBackgroundPosition {
	if (value === "center" || value === "top" || value === "bottom" || value === "left" || value === "right") {
		return value;
	}

	return fallback;
}

function parseBackgroundOverlay(
	value: FormDataEntryValue | null,
	fallback: EditorialBackgroundOverlay = "medium",
): EditorialBackgroundOverlay {
	if (value === "none" || value === "soft" || value === "medium" || value === "strong") {
		return value;
	}

	return fallback;
}

function parseBackgroundContrast(
	value: FormDataEntryValue | null,
	fallback: EditorialBackgroundContrast = "light",
): EditorialBackgroundContrast {
	return value === "light" || value === "dark" ? value : fallback;
}

async function resolveImageField(
	formData: FormData,
	srcField: string,
	altField: string,
	captionField: string,
) {
	const fileEntry = formData.get(`${srcField}File`);
	const existingSrc = optionalString(formData.get(srcField));
	let src = existingSrc;

	if (fileEntry instanceof File && fileEntry.size > 0) {
		assertAdminImageUploadFile(fileEntry);
		const upload = await uploadImageFileToFastAPI(fileEntry);
		src = upload.secure_url;
	}

	if (!src) return null;

	return {
		src,
		alt: optionalString(formData.get(altField)),
		caption: optionalString(formData.get(captionField)),
	};
}

async function parseBackgroundByPrefix(
	formData: FormData,
	prefix: string,
	current?: EditorialBackground | null,
): Promise<EditorialBackground | null> {
	const srcField = `${prefix}Src`;
	const hasBackgroundFields =
		formData.has(srcField) ||
		formData.has(`${srcField}File`) ||
		formData.has(`${prefix}Fit`) ||
		formData.has(`${prefix}Position`) ||
		formData.has(`${prefix}Overlay`) ||
		formData.has(`${prefix}Contrast`);

	if (!hasBackgroundFields) return current ?? null;

	const image = await resolveImageField(formData, srcField, `${prefix}Alt`, `${prefix}Caption`);
	if (!image) return null;

	return {
		image,
		fit: parseBackgroundFit(formData.get(`${prefix}Fit`), current?.fit ?? "cover"),
		position: parseBackgroundPosition(formData.get(`${prefix}Position`), current?.position ?? "center"),
		overlay: parseBackgroundOverlay(formData.get(`${prefix}Overlay`), current?.overlay ?? "medium"),
		contrast: parseBackgroundContrast(formData.get(`${prefix}Contrast`), current?.contrast ?? "light"),
	};
}

function readLinks(formData: FormData, prefix: string, count: number) {
	return Array.from({ length: count }, (_, index) => ({
		label: optionalString(formData.get(`${prefix}${index + 1}Label`)),
		href: parseEditorialHrefChoice(formData, `${prefix}${index + 1}Href`, `Link ${index + 1}`),
	})).filter((link): link is { label: string; href: string } => Boolean(link.label && link.href));
}

async function upsertPageRecord<T extends EditorialDocument>(type: T["type"], doc: T) {
	const response = await fetch(`${env.FASTAPI_API_URL}/editorial/internal/admin`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			"X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY,
			"X-Actor-User-ID": String(doc.updatedBy ?? doc.createdBy ?? "next-internal"),
		},
		body: JSON.stringify({
			type,
			slug: doc.slug,
			title: doc.title,
			content: doc,
			published: doc.published,
			order: doc.order,
		}),
		cache: "no-store",
	});
	if (!response.ok) throw new Error("Não foi possível salvar o conteúdo editorial no FastAPI.");
}

function revalidateEditorialPaths() {
	for (const path of [
		"/",
		"/products",
		"/product/[slug]",
		"/events",
		"/projects",
		"/about",
		"/contact",
		"/admin/editorial",
		"/admin/editorial/home",
		"/admin/editorial/events",
		"/admin/editorial/projects",
		"/admin/editorial/products",
		"/admin/editorial/pagina-do-produto",
		"/admin/editorial/global",
	]) {
		revalidatePath(path, path.includes("[slug]") ? "page" : undefined);
	}
}

async function buildHomePageDoc(
	formData: FormData,
	actor: string,
	current: EditorialHomePage | null,
): Promise<EditorialHomePage> {
	const now = new Date().toISOString();
	const featureTitle = formData.has("heroFeatureTitle")
		? optionalString(formData.get("heroFeatureTitle"))
		: (current?.hero?.featureTitle ?? null);
	const featureBody = formData.has("heroFeatureBody")
		? optionalString(formData.get("heroFeatureBody"))
		: (current?.hero?.featureBody ?? null);
	const featuredTitle = formData.has("featuredTitle")
		? optionalString(formData.get("featuredTitle"))
		: (current?.featuredBook?.title ?? null);
	const heroModeValue = formData.has("heroMode")
		? optionalString(formData.get("heroMode"))
		: (current?.hero?.mode ?? "custom");
	const heroMode = heroModeValue === "product" ? "product" : "custom";
	const heroProductSlug = formData.has("heroProductSlug")
		? optionalString(formData.get("heroProductSlug"))
		: (current?.hero?.productSlug ?? null);
	const heroField = (name: string, currentValue?: string | null) =>
		formData.has(name) ? optionalString(formData.get(name)) : (currentValue ?? null);

	return {
		type: "page_home",
		slug: "home",
		title: optionalString(formData.get("title")) ?? current?.title ?? "Página inicial",
		summary: optionalString(formData.get("summary")) ?? current?.summary ?? null,
		published: parseBoolean(formData.get("published"), current?.published ?? true),
		order: parseOrder(formData.get("order"), current?.order ?? 1),
		hero: {
			mode: heroMode,
			productSlug: heroProductSlug,
			eyebrow: heroField("heroEyebrow", current?.hero?.eyebrow),
			title: heroField("heroTitle", current?.hero?.title),
			description: heroField("heroDescription", current?.hero?.description),
			primaryCtaLabel: heroField("heroPrimaryCtaLabel", current?.hero?.primaryCtaLabel),
			primaryCtaHref: formData.has("heroPrimaryCtaHref")
				? parseEditorialHrefChoice(formData, "heroPrimaryCtaHref", "Home · CTA principal")
				: (current?.hero?.primaryCtaHref ?? null),
			secondaryCtaLabel: heroField("heroSecondaryCtaLabel", current?.hero?.secondaryCtaLabel),
			secondaryCtaHref: formData.has("heroSecondaryCtaHref")
				? parseEditorialHrefChoice(formData, "heroSecondaryCtaHref", "Home · CTA secundário")
				: (current?.hero?.secondaryCtaHref ?? null),
			supportingLine: heroField("heroSupportingLine", current?.hero?.supportingLine),
			featureEyebrow: heroField("heroFeatureEyebrow", current?.hero?.featureEyebrow),
			featureTitle,
			featureBody,
			featureQuote: heroField("heroFeatureQuote", current?.hero?.featureQuote),
			featureImage: current?.hero?.featureImage ?? null,
			background: await parseBackgroundByPrefix(formData, "heroBackground", current?.hero?.background),
		},
		manifesto: {
			title: optionalString(formData.get("manifestoTitle")),
			body: optionalString(formData.get("manifestoBody")),
			linkLabel: optionalString(formData.get("manifestoLinkLabel")),
			linkHref: parseEditorialHrefChoice(formData, "manifestoLinkHref", "Home · manifesto"),
			background: await parseBackgroundByPrefix(
				formData,
				"manifestoBackground",
				current?.manifesto?.background,
			),
		},
		featuredBook: {
			productSlug: optionalString(formData.get("featuredProductSlug")),
			eyebrow: optionalString(formData.get("featuredEyebrow")),
			title: featuredTitle,
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
			ctaHref: parseEditorialHrefChoice(formData, "programCtaHref", "Home · programação"),
			background: await parseBackgroundByPrefix(formData, "programBackground", current?.program?.background),
		},
		createdAt: current?.createdAt ?? now,
		createdBy: current?.createdBy ?? actor,
		updatedAt: now,
		updatedBy: actor,
	};
}

async function buildEventsPageDoc(
	formData: FormData,
	actor: string,
	current: EditorialEventsPage | null,
): Promise<EditorialEventsPage> {
	const now = new Date().toISOString();

	return {
		type: "page_events",
		slug: "events",
		title: optionalString(formData.get("title")) ?? current?.title ?? "Página de eventos",
		summary: optionalString(formData.get("summary")) ?? current?.summary ?? null,
		published: parseBoolean(formData.get("published"), current?.published ?? true),
		order: parseOrder(formData.get("order"), current?.order ?? 1),
		hero: {
			eyebrow: optionalString(formData.get("heroEyebrow")),
			title: optionalString(formData.get("heroTitle")),
			body: optionalString(formData.get("heroBody")),
			primaryCtaLabel: optionalString(formData.get("heroPrimaryCtaLabel")),
			primaryCtaHref: parseEditorialHrefChoice(formData, "heroPrimaryCtaHref", "Eventos · CTA principal"),
			secondaryCtaLabel: optionalString(formData.get("heroSecondaryCtaLabel")),
			secondaryCtaHref: parseEditorialHrefChoice(
				formData,
				"heroSecondaryCtaHref",
				"Eventos · CTA secundário",
			),
			background: await parseBackgroundByPrefix(formData, "heroBackground", current?.hero?.background),
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
			primaryCtaHref: parseEditorialHrefChoice(
				formData,
				"finalPrimaryCtaHref",
				"Eventos · CTA final principal",
			),
			secondaryCtaLabel: optionalString(formData.get("finalSecondaryCtaLabel")),
			secondaryCtaHref: parseEditorialHrefChoice(
				formData,
				"finalSecondaryCtaHref",
				"Eventos · CTA final secundário",
			),
		},
		createdAt: current?.createdAt ?? now,
		createdBy: current?.createdBy ?? actor,
		updatedAt: now,
		updatedBy: actor,
	};
}

async function buildProjectsPageDoc(
	formData: FormData,
	actor: string,
	current: EditorialProjectsPage | null,
): Promise<EditorialProjectsPage> {
	const now = new Date().toISOString();

	return {
		type: "page_projects",
		slug: "projects",
		title: optionalString(formData.get("title")) ?? current?.title ?? "Página de projetos",
		summary: optionalString(formData.get("summary")) ?? current?.summary ?? null,
		published: parseBoolean(formData.get("published"), current?.published ?? true),
		order: parseOrder(formData.get("order"), current?.order ?? 1),
		hero: {
			eyebrow: optionalString(formData.get("heroEyebrow")),
			title: optionalString(formData.get("heroTitle")),
			body: optionalString(formData.get("heroBody")),
			imageLabel: optionalString(formData.get("heroImageLabel")),
			background: await parseBackgroundByPrefix(formData, "heroBackground", current?.hero?.background),
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
			primaryCtaHref: parseEditorialHrefChoice(
				formData,
				"finalPrimaryCtaHref",
				"Projetos · CTA final principal",
			),
			secondaryCtaLabel: optionalString(formData.get("finalSecondaryCtaLabel")),
			secondaryCtaHref: parseEditorialHrefChoice(
				formData,
				"finalSecondaryCtaHref",
				"Projetos · CTA final secundário",
			),
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
		title: optionalString(formData.get("title")) ?? current?.title ?? "Página de produtos",
		summary: optionalString(formData.get("summary")) ?? current?.summary ?? null,
		published: parseBoolean(formData.get("published"), current?.published ?? true),
		order: parseOrder(formData.get("order"), current?.order ?? 1),
		hero: {
			eyebrow: optionalString(formData.get("heroEyebrow")),
			title: optionalString(formData.get("heroTitle")),
			body: optionalString(formData.get("heroBody")),
			primaryCtaLabel: optionalString(formData.get("heroPrimaryCtaLabel")),
			primaryCtaHref: parseEditorialHrefChoice(formData, "heroPrimaryCtaHref", "Produtos · CTA principal"),
			secondaryCtaLabel: optionalString(formData.get("heroSecondaryCtaLabel")),
			secondaryCtaHref: parseEditorialHrefChoice(
				formData,
				"heroSecondaryCtaHref",
				"Produtos · CTA secundário",
			),
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
			primaryCtaHref: parseEditorialHrefChoice(
				formData,
				"finalPrimaryCtaHref",
				"Produtos · CTA final principal",
			),
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
		title: optionalString(formData.get("title")) ?? current?.title ?? "Página do produto",
		summary: optionalString(formData.get("summary")) ?? current?.summary ?? null,
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
			primaryCtaHref: parseEditorialHrefChoice(
				formData,
				"notFoundPrimaryCtaHref",
				"Produto não encontrado · CTA",
			),
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
		summary: optionalString(formData.get("summary")) ?? current?.summary ?? null,
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

async function savePageCopy<T extends PageCopyType>(
	type: T,
	buildDoc: (
		formData: FormData,
		actor: string,
		current: PageCopyRecordMap[T] | null,
	) => PageCopyRecordMap[T] | Promise<PageCopyRecordMap[T]>,
	formData: FormData,
): Promise<PageCopyActionState> {
	const session = await requireEditorialManager();
	const actor = session.email || session.sub;
	const current = (await getEditorialRecordForAdmin(type)) as PageCopyRecordMap[T] | null;
	const doc = await buildDoc(formData, actor, current);
	await upsertPageRecord(type, doc);
	revalidateEditorialPaths();

	return {
		status: "success",
		message: "Alterações salvas no admin editorial.",
		savedAt: new Date().toISOString(),
	};
}

export async function updateEditorialHomeCopyAction(_state: PageCopyActionState, formData: FormData) {
	return savePageCopy("page_home", buildHomePageDoc, formData);
}

export async function updateEditorialEventsPageCopyAction(_state: PageCopyActionState, formData: FormData) {
	return savePageCopy("page_events", buildEventsPageDoc, formData);
}

export async function updateEditorialProjectsPageCopyAction(_state: PageCopyActionState, formData: FormData) {
	return savePageCopy("page_projects", buildProjectsPageDoc, formData);
}

export async function updateEditorialProductsPageCopyAction(_state: PageCopyActionState, formData: FormData) {
	return savePageCopy("page_products", buildProductsPageDoc, formData);
}

export async function updateEditorialProductPageCopyAction(_state: PageCopyActionState, formData: FormData) {
	return savePageCopy("page_product", buildProductPageDoc, formData);
}

export async function updateEditorialSiteGlobalCopyAction(_state: PageCopyActionState, formData: FormData) {
	return savePageCopy("site_global", buildSiteGlobalDoc, formData);
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
