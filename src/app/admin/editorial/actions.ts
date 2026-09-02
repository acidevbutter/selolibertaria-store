"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminImageUploadFile } from "@/lib/admin-image-upload";
import { requireCapability } from "@/lib/api-auth";
import {
	deleteEditorial,
	reorderEditorial,
	setEditorialPublished,
	upsertEditorial,
} from "@/lib/editorial-admin-api";
import type {
	EditorialAboutPage,
	EditorialBackground,
	EditorialBackgroundContrast,
	EditorialBackgroundFit,
	EditorialBackgroundOverlay,
	EditorialBackgroundPosition,
	EditorialContactPage,
	EditorialEvent,
	EditorialHomePage,
	EditorialProject,
	EditorialSarauPage,
} from "@/lib/editorial-content";
import {
	getEditorialEventRecordBySlug,
	getEditorialProjectRecordBySlug,
	getEditorialRecordForAdmin,
	listEditorialRecordsForAdmin,
} from "@/lib/editorial-content-store";
import { parseEditorialHrefChoice } from "@/lib/editorial-link-policy";
import { uploadImageFileToFastAPI } from "@/lib/media-upload";
import { slugify } from "@/lib/utils";

export type EditorialItemFormActionState = {
	status: "idle" | "error";
	message: string | null;
	fieldErrors: {
		title?: string;
		order?: string;
	};
};

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

function requiredString(formData: FormData, key: string) {
	const value = optionalString(formData.get(key));
	if (!value) throw new Error(`${key} é obrigatório.`);
	return value;
}

function isNavigationError(error: unknown) {
	if (error instanceof Error && error.message.startsWith("NEXT_")) return true;

	return (
		typeof error === "object" &&
		error !== null &&
		"digest" in error &&
		typeof error.digest === "string" &&
		error.digest.startsWith("NEXT_")
	);
}

function validateEditorialItemForm(formData: FormData): EditorialItemFormActionState | null {
	const title = optionalString(formData.get("title"));
	const order = formData.get("order");
	const fieldErrors: EditorialItemFormActionState["fieldErrors"] = {};

	if (!title) fieldErrors.title = "Informe o título do evento.";
	if (typeof order === "string" && order.trim() && (!/^\d+$/.test(order) || Number(order) < 1)) {
		fieldErrors.order = "Informe uma ordem inteira maior ou igual a 1.";
	}

	if (!Object.keys(fieldErrors).length) return null;
	return {
		status: "error",
		message: "Revise os campos destacados antes de salvar.",
		fieldErrors,
	};
}

function toEditorialItemFormError(error: unknown): EditorialItemFormActionState {
	return {
		status: "error",
		message:
			error instanceof Error && error.message
				? error.message
				: "Não foi possível salvar o evento. Tente novamente.",
		fieldErrors: {},
	};
}

function parseBoolean(value: FormDataEntryValue | null, defaultValue = false) {
	if (typeof value !== "string") return defaultValue;
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

function parseOrder(value: FormDataEntryValue | null, fallback = 1) {
	if (typeof value !== "string") return fallback;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function firstNonEmptyString(values: FormDataEntryValue[]) {
	for (const value of values) {
		if (typeof value !== "string") continue;
		const trimmed = value.trim();
		if (trimmed) return trimmed;
	}
	return null;
}

async function resolveImageField({
	formData,
	srcField,
	altField,
	captionField,
}: {
	formData: FormData;
	srcField: string;
	altField: string;
	captionField: string;
}) {
	const fileEntry = formData.get(`${srcField}File`);
	const existingSrc = firstNonEmptyString(formData.getAll(srcField));
	let uploadedSrc: string | null = null;
	if (fileEntry instanceof File && fileEntry.size > 0) {
		assertAdminImageUploadFile(fileEntry);
		uploadedSrc = (await uploadImageFileToFastAPI(fileEntry)).secure_url;
	}
	const src = uploadedSrc ?? existingSrc;
	if (process.env.NODE_ENV !== "production") {
		console.info("[editorial image field]", {
			srcField,
			hasFile: fileEntry instanceof File && fileEntry.size > 0,
			fileName: fileEntry instanceof File ? fileEntry.name : null,
			fileSize: fileEntry instanceof File ? fileEntry.size : null,
			existingSrc,
			resolvedSrc: src,
		});
	}
	if (!src) return null;
	return {
		src,
		alt: optionalString(formData.get(altField)),
		caption: optionalString(formData.get(captionField)),
	};
}

async function parseImage(formData: FormData) {
	return await resolveImageField({
		formData,
		srcField: "imageSrc",
		altField: "imageAlt",
		captionField: "imageCaption",
	});
}

async function parseImageByPrefix(formData: FormData, prefix: string) {
	return await resolveImageField({
		formData,
		srcField: `${prefix}Src`,
		altField: `${prefix}Alt`,
		captionField: `${prefix}Caption`,
	});
}

async function parseBackgroundByPrefix(
	formData: FormData,
	prefix: string,
	current?: EditorialBackground | null,
	resolvedImage?: Awaited<ReturnType<typeof parseImageByPrefix>> | null,
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

	const image = resolvedImage ?? (await parseImageByPrefix(formData, prefix));
	if (!image) return null;

	return {
		image,
		fit: parseBackgroundFit(formData.get(`${prefix}Fit`), current?.fit ?? "cover"),
		position: parseBackgroundPosition(formData.get(`${prefix}Position`), current?.position ?? "center"),
		overlay: parseBackgroundOverlay(formData.get(`${prefix}Overlay`), current?.overlay ?? "medium"),
		contrast: parseBackgroundContrast(formData.get(`${prefix}Contrast`), current?.contrast ?? "light"),
	};
}

function parseStringList(formData: FormData, key: string) {
	return formData
		.getAll(key)
		.map((value) => (typeof value === "string" ? value.trim() : ""))
		.filter(Boolean);
}

function refreshEventPaths(slug?: string) {
	revalidatePath("/");
	revalidatePath("/events");
	revalidatePath("/admin/editorial");
	if (slug) revalidatePath(`/admin/editorial/events/${slug}`);
	revalidatePath("/admin/editorial/events");
}

function refreshProjectPaths(slug?: string) {
	revalidatePath("/");
	revalidatePath("/projects");
	revalidatePath("/admin/editorial");
	if (slug) revalidatePath(`/admin/editorial/projects/${slug}`);
	revalidatePath("/admin/editorial/projects");
}

function refreshSarauPaths() {
	revalidatePath("/");
	revalidatePath("/sarau-safado");
	revalidatePath("/admin/editorial");
	revalidatePath("/admin/editorial/sarau-safado");
}

function refreshAboutPaths() {
	revalidatePath("/");
	revalidatePath("/about");
	revalidatePath("/admin/editorial");
	revalidatePath("/admin/editorial/about");
}

function refreshContactPaths() {
	revalidatePath("/");
	revalidatePath("/contact");
	revalidatePath("/admin/editorial");
	revalidatePath("/admin/editorial/contact");
}

function refreshHomePaths() {
	revalidatePath("/");
	revalidatePath("/admin/editorial");
	revalidatePath("/admin/editorial/home");
}

export async function createEditorialEventAction(
	_previousState: EditorialItemFormActionState,
	formData: FormData,
): Promise<EditorialItemFormActionState> {
	const validationError = validateEditorialItemForm(formData);
	if (validationError) return validationError;

	try {
		const session = await requireEditorialManager();
		const title = requiredString(formData, "title");
		const slug = slugify(optionalString(formData.get("slug")) || title);

		const doc: EditorialEvent = {
			type: "event",
			slug,
			title,
			summary: optionalString(formData.get("summary")),
			description: optionalString(formData.get("description")),
			status: optionalString(formData.get("status")),
			period: optionalString(formData.get("period")),
			location: optionalString(formData.get("location")),
			eyebrow: optionalString(formData.get("eyebrow")),
			published: parseBoolean(formData.get("published"), true),
			order: parseOrder(formData.get("order"), 1),
			image: await parseImage(formData),
		};

		await upsertEditorial(
			{
				type: "event",
				slug,
				title,
				content: doc,
				published: doc.published ?? true,
				order: doc.order ?? 1,
			},
			String(session.sub),
		);

		refreshEventPaths(slug);
		redirect(`/admin/editorial/events/${encodeURIComponent(slug)}`);
	} catch (error) {
		if (isNavigationError(error)) throw error;
		return toEditorialItemFormError(error);
	}
}

export async function updateEditorialEventAction(
	_previousState: EditorialItemFormActionState,
	formData: FormData,
): Promise<EditorialItemFormActionState> {
	const validationError = validateEditorialItemForm(formData);
	if (validationError) return validationError;

	try {
		const session = await requireEditorialManager();
		const currentSlug = requiredString(formData, "currentSlug");
		const title = requiredString(formData, "title");
		const slug = slugify(optionalString(formData.get("slug")) || title);

		const doc: EditorialEvent = {
			type: "event",
			slug,
			title,
			summary: optionalString(formData.get("summary")),
			description: optionalString(formData.get("description")),
			status: optionalString(formData.get("status")),
			period: optionalString(formData.get("period")),
			location: optionalString(formData.get("location")),
			eyebrow: optionalString(formData.get("eyebrow")),
			published: parseBoolean(formData.get("published"), true),
			order: parseOrder(formData.get("order"), 1),
			image: await parseImage(formData),
		};

		await upsertEditorial(
			{
				type: "event",
				slug,
				title,
				content: doc,
				published: doc.published ?? true,
				order: doc.order ?? 1,
				previousSlug: currentSlug,
			},
			String(session.sub),
		);

		refreshEventPaths(currentSlug);
		if (currentSlug !== slug) refreshEventPaths(slug);
		redirect(`/admin/editorial/events/${encodeURIComponent(slug)}`);
	} catch (error) {
		if (isNavigationError(error)) throw error;
		return toEditorialItemFormError(error);
	}
}

export async function toggleEditorialEventPublishedAction(formData: FormData) {
	const session = await requireEditorialManager();
	const slug = requiredString(formData, "slug");
	const published = parseBoolean(formData.get("published"), false);

	await setEditorialPublished("event", slug, published, String(session.sub));

	refreshEventPaths(slug);
}

export async function moveEditorialEventAction(formData: FormData) {
	const session = await requireEditorialManager();
	const slug = requiredString(formData, "slug");
	const direction = requiredString(formData, "direction");
	if (direction !== "up" && direction !== "down") {
		throw new Error("Direção inválida.");
	}

	await reorderEditorial("event", slug, direction, String(session.sub));
	refreshEventPaths(slug);
}

export async function deleteEditorialEventAction(formData: FormData) {
	await requireEditorialManager();
	const slug = requiredString(formData, "slug");

	await deleteEditorial("event", slug);

	refreshEventPaths(slug);
	redirect("/admin/editorial/events");
}

export async function getEditorialEventBySlug(slug: string) {
	return await getEditorialEventRecordBySlug(slug);
}

export async function listEditorialEventRecords() {
	return await listEditorialRecordsForAdmin("event");
}

export async function createEditorialProjectAction(formData: FormData) {
	const session = await requireEditorialManager();
	const title = requiredString(formData, "title");
	const slug = slugify(optionalString(formData.get("slug")) || title);

	const doc: EditorialProject = {
		type: "project",
		slug,
		title,
		summary: optionalString(formData.get("summary")),
		description: optionalString(formData.get("description")),
		period: optionalString(formData.get("period")),
		location: optionalString(formData.get("location")),
		eyebrow: optionalString(formData.get("eyebrow")),
		published: parseBoolean(formData.get("published"), true),
		order: parseOrder(formData.get("order"), 1),
		image: await parseImage(formData),
	};

	await upsertEditorial(
		{
			type: "project",
			slug,
			title,
			content: doc,
			published: doc.published ?? true,
			order: doc.order ?? 1,
		},
		String(session.sub),
	);

	refreshProjectPaths(slug);
	redirect(`/admin/editorial/projects/${encodeURIComponent(slug)}`);
}

export async function updateEditorialProjectAction(formData: FormData) {
	const session = await requireEditorialManager();
	const currentSlug = requiredString(formData, "currentSlug");
	const title = requiredString(formData, "title");
	const slug = slugify(optionalString(formData.get("slug")) || title);

	const doc: EditorialProject = {
		type: "project",
		slug,
		title,
		summary: optionalString(formData.get("summary")),
		description: optionalString(formData.get("description")),
		period: optionalString(formData.get("period")),
		location: optionalString(formData.get("location")),
		eyebrow: optionalString(formData.get("eyebrow")),
		published: parseBoolean(formData.get("published"), true),
		order: parseOrder(formData.get("order"), 1),
		image: await parseImage(formData),
	};

	await upsertEditorial(
		{
			type: "project",
			slug,
			title,
			content: doc,
			published: doc.published ?? true,
			order: doc.order ?? 1,
			previousSlug: currentSlug,
		},
		String(session.sub),
	);

	refreshProjectPaths(currentSlug);
	if (currentSlug !== slug) refreshProjectPaths(slug);
	redirect(`/admin/editorial/projects/${encodeURIComponent(slug)}`);
}

export async function toggleEditorialProjectPublishedAction(formData: FormData) {
	const session = await requireEditorialManager();
	const slug = requiredString(formData, "slug");
	const published = parseBoolean(formData.get("published"), false);

	await setEditorialPublished("project", slug, published, String(session.sub));

	refreshProjectPaths(slug);
}

export async function moveEditorialProjectAction(formData: FormData) {
	const session = await requireEditorialManager();
	const slug = requiredString(formData, "slug");
	const direction = requiredString(formData, "direction");
	if (direction !== "up" && direction !== "down") {
		throw new Error("Direção inválida.");
	}

	await reorderEditorial("project", slug, direction, String(session.sub));
	refreshProjectPaths(slug);
}

export async function deleteEditorialProjectAction(formData: FormData) {
	await requireEditorialManager();
	const slug = requiredString(formData, "slug");

	await deleteEditorial("project", slug);

	refreshProjectPaths(slug);
	redirect("/admin/editorial/projects");
}

export async function getEditorialProjectBySlug(slug: string) {
	return await getEditorialProjectRecordBySlug(slug);
}

export async function listEditorialProjectRecords() {
	return await listEditorialRecordsForAdmin("project");
}

export async function getEditorialSarauRecord() {
	return await getEditorialRecordForAdmin("page_sarau");
}

export async function updateEditorialSarauAction(formData: FormData) {
	const session = await requireEditorialManager();
	const current = await getEditorialRecordForAdmin("page_sarau");
	const title = optionalString(formData.get("title")) ?? current?.title ?? "Sarau Safado";

	const programNotes = [
		{
			title: optionalString(formData.get("note1Title")),
			body: optionalString(formData.get("note1Body")),
		},
		{
			title: optionalString(formData.get("note2Title")),
			body: optionalString(formData.get("note2Body")),
		},
		{
			title: optionalString(formData.get("note3Title")),
			body: optionalString(formData.get("note3Body")),
		},
	].filter((note): note is { title: string; body: string } =>
		Boolean(note.title?.trim() && note.body?.trim()),
	);

	const heroImage = await parseImageByPrefix(formData, "heroImage");
	const heroBackground = await parseBackgroundByPrefix(
		formData,
		"heroImage",
		current?.hero?.background,
		heroImage,
	);

	const doc: EditorialSarauPage = {
		type: "page_sarau",
		slug: "sarau-safado",
		title,
		summary: optionalString(formData.get("summary")) ?? current?.summary ?? null,
		body: optionalString(formData.get("body")) ?? current?.body ?? null,
		published: parseBoolean(formData.get("published"), current?.published ?? true),
		order: parseOrder(formData.get("order"), current?.order ?? 1),
		hero: {
			eyebrow: optionalString(formData.get("heroEyebrow")),
			title: optionalString(formData.get("heroTitle")),
			body: optionalString(formData.get("heroBody")),
			primaryCtaLabel: optionalString(formData.get("heroPrimaryCtaLabel")),
			primaryCtaHref: parseEditorialHrefChoice(formData, "heroPrimaryCtaHref", "Hero · CTA principal"),
			secondaryCtaLabel: optionalString(formData.get("heroSecondaryCtaLabel")),
			secondaryCtaHref: parseEditorialHrefChoice(formData, "heroSecondaryCtaHref", "Hero · CTA secundário"),
			image: heroImage,
			background: heroBackground,
		},
		why: {
			title: optionalString(formData.get("whyTitle")),
			body: optionalString(formData.get("whyBody")),
		},
		signals: parseStringList(formData, "signals"),
		programNotes,
		continueLinks: [
			{ label: "Eventos", href: "/events" },
			{ label: "Projetos", href: "/projects" },
			{ label: "Loja", href: "/products" },
		],
	};

	await upsertEditorial(
		{
			type: "page_sarau",
			slug: "sarau-safado",
			title,
			content: doc,
			published: doc.published ?? true,
			order: doc.order ?? 1,
		},
		String(session.sub),
	);

	refreshSarauPaths();
	redirect("/admin/editorial/sarau-safado");
}

export async function getEditorialAboutRecord() {
	return await getEditorialRecordForAdmin("page_about");
}

export async function updateEditorialAboutAction(formData: FormData) {
	const session = await requireEditorialManager();
	const current = await getEditorialRecordForAdmin("page_about");
	const title = optionalString(formData.get("title")) ?? current?.title ?? "Sobre";

	const cards = [1, 2, 3]
		.map((index) => ({
			eyebrow: optionalString(formData.get(`card${index}Eyebrow`)),
			title: optionalString(formData.get(`card${index}Title`)),
			body: optionalString(formData.get(`card${index}Body`)),
		}))
		.filter((card): card is { eyebrow: string | null; title: string; body: string } =>
			Boolean(card.title?.trim() && card.body?.trim()),
		);

	const doc: EditorialAboutPage = {
		type: "page_about",
		slug: "about",
		title,
		summary: optionalString(formData.get("summary")) ?? current?.summary ?? null,
		body: optionalString(formData.get("body")) ?? current?.body ?? null,
		published: parseBoolean(formData.get("published"), current?.published ?? true),
		order: parseOrder(formData.get("order"), current?.order ?? 1),
		hero: {
			eyebrow: optionalString(formData.get("heroEyebrow")),
			title: optionalString(formData.get("heroTitle")),
			body: optionalString(formData.get("heroBody")),
		},
		section: {
			eyebrow: optionalString(formData.get("sectionEyebrow")),
			title: optionalString(formData.get("sectionTitle")),
			body: optionalString(formData.get("sectionBody")),
			extended: optionalString(formData.get("sectionExtended")),
			primaryCtaLabel: optionalString(formData.get("sectionPrimaryCtaLabel")),
			primaryCtaHref: parseEditorialHrefChoice(formData, "sectionPrimaryCtaHref", "Sobre · CTA principal"),
			image: await parseImageByPrefix(formData, "sectionImage"),
		},
		cards,
		closing: {
			eyebrow: optionalString(formData.get("closingEyebrow")),
			title: optionalString(formData.get("closingTitle")),
			body: optionalString(formData.get("closingBody")),
			coreEyebrow: optionalString(formData.get("coreEyebrow")),
			coreTitle: optionalString(formData.get("coreTitle")),
		},
	};

	await upsertEditorial(
		{
			type: "page_about",
			slug: "about",
			title,
			content: doc,
			published: doc.published ?? true,
			order: doc.order ?? 1,
		},
		String(session.sub),
	);

	refreshAboutPaths();
	redirect("/admin/editorial/about");
}

export async function getEditorialContactRecord() {
	return await getEditorialRecordForAdmin("page_contact");
}

export async function updateEditorialContactAction(formData: FormData) {
	const session = await requireEditorialManager();
	const current = await getEditorialRecordForAdmin("page_contact");
	const title = optionalString(formData.get("title")) ?? current?.title ?? "Contato";
	const subjects = [1, 2, 3, 4, 5, 6]
		.map((index) => optionalString(formData.get(`subject${index}`)))
		.filter((value): value is string => Boolean(value));

	const pathLinks = [1, 2, 3, 4, 5, 6]
		.map((index) => ({
			label: optionalString(formData.get(`path${index}Label`)),
			href: parseEditorialHrefChoice(formData, `path${index}Href`, `Contato · Link ${index}`),
		}))
		.filter((link): link is { label: string; href: string } =>
			Boolean(link.label?.trim() && link.href?.trim()),
		);

	const doc: EditorialContactPage = {
		type: "page_contact",
		slug: "contact",
		title,
		summary: optionalString(formData.get("summary")) ?? current?.summary ?? null,
		published: parseBoolean(formData.get("published"), current?.published ?? true),
		order: parseOrder(formData.get("order"), current?.order ?? 1),
		hero: {
			eyebrow: optionalString(formData.get("heroEyebrow")),
			title: optionalString(formData.get("heroTitle")),
			body: optionalString(formData.get("heroBody")),
			featuredLabel: current?.hero?.featuredLabel ?? "Email",
			featuredValue: current?.hero?.featuredValue ?? null,
		},
		form: {
			title: optionalString(formData.get("formTitle")),
			description: optionalString(formData.get("formDescription")),
			subjects,
		},
		direct: {
			title: optionalString(formData.get("directTitle")),
			description: optionalString(formData.get("directDescription")),
			links: current?.direct?.links ?? [],
		},
		paths: {
			title: optionalString(formData.get("pathsTitle")),
			description: optionalString(formData.get("pathsDescription")),
			links: pathLinks,
		},
		closing: {
			title: optionalString(formData.get("closingTitle")),
		},
	};

	await upsertEditorial(
		{
			type: "page_contact",
			slug: "contact",
			title,
			content: doc,
			published: doc.published ?? true,
			order: doc.order ?? 1,
		},
		String(session.sub),
	);

	refreshContactPaths();
	redirect("/admin/editorial/contact");
}

export async function getEditorialHomeRecord() {
	return await getEditorialRecordForAdmin("page_home");
}

export async function updateEditorialHomeAction(formData: FormData) {
	const session = await requireEditorialManager();
	const title = requiredString(formData, "title");
	const current = await getEditorialRecordForAdmin("page_home");

	const communityLinks = [1, 2, 3]
		.map((index) => ({
			label: optionalString(formData.get(`communityLink${index}Label`)),
			href: parseEditorialHrefChoice(formData, `communityLink${index}Href`, `CTA final · Link ${index}`),
		}))
		.filter((link): link is { label: string; href: string } =>
			Boolean(link.label?.trim() && link.href?.trim()),
		);

	const doc: EditorialHomePage = {
		type: "page_home",
		slug: "home",
		title,
		summary: optionalString(formData.get("summary")),
		published: parseBoolean(formData.get("published"), true),
		order: parseOrder(formData.get("order"), 1),
		hero: {
			eyebrow: optionalString(formData.get("heroEyebrow")),
			title: optionalString(formData.get("heroTitle")),
			description: optionalString(formData.get("heroDescription")),
			primaryCtaLabel: optionalString(formData.get("heroPrimaryCtaLabel")),
			primaryCtaHref: parseEditorialHrefChoice(formData, "heroPrimaryCtaHref", "Hero · CTA principal"),
			secondaryCtaLabel: optionalString(formData.get("heroSecondaryCtaLabel")),
			secondaryCtaHref: parseEditorialHrefChoice(formData, "heroSecondaryCtaHref", "Hero · CTA secundária"),
			supportingLine: optionalString(formData.get("heroSupportingLine")),
			featureEyebrow: optionalString(formData.get("heroFeatureEyebrow")),
			featureTitle: optionalString(formData.get("heroFeatureTitle")),
			featureBody: optionalString(formData.get("heroFeatureBody")),
			featureQuote: optionalString(formData.get("heroFeatureQuote")),
			featureImage: await parseImageByPrefix(formData, "heroFeatureImage"),
			background: await parseBackgroundByPrefix(formData, "heroBackground", current?.hero?.background),
		},
		manifesto: {
			title: optionalString(formData.get("manifestoTitle")),
			body: optionalString(formData.get("manifestoBody")),
			linkLabel: optionalString(formData.get("manifestoLinkLabel")),
			linkHref: parseEditorialHrefChoice(formData, "manifestoLinkHref", "Manifesto · Link"),
			background: await parseBackgroundByPrefix(
				formData,
				"manifestoBackground",
				current?.manifesto?.background,
			),
		},
		author: {
			eyebrow: optionalString(formData.get("authorEyebrow")),
			title: optionalString(formData.get("authorTitle")),
			body: optionalString(formData.get("authorBody")),
			secondaryBody: optionalString(formData.get("authorSecondaryBody")),
			primaryCtaLabel: optionalString(formData.get("authorPrimaryCtaLabel")),
			primaryCtaHref: parseEditorialHrefChoice(formData, "authorPrimaryCtaHref", "Autoria · CTA principal"),
			secondaryCtaLabel: optionalString(formData.get("authorSecondaryCtaLabel")),
			secondaryCtaHref: parseEditorialHrefChoice(
				formData,
				"authorSecondaryCtaHref",
				"Autoria · CTA secundária",
			),
			image: await parseImageByPrefix(formData, "authorImage"),
		},
		community: {
			title: optionalString(formData.get("communityTitle")),
			body: optionalString(formData.get("communityBody")),
			primaryCtaLabel: optionalString(formData.get("communityPrimaryCtaLabel")),
			primaryCtaHref: parseEditorialHrefChoice(
				formData,
				"communityPrimaryCtaHref",
				"CTA final · CTA principal",
			),
			secondaryLinks: communityLinks,
		},
	};

	await upsertEditorial(
		{
			type: "page_home",
			slug: "home",
			title,
			content: doc,
			published: doc.published ?? true,
			order: doc.order ?? 1,
		},
		String(session.sub),
	);

	refreshHomePaths();
	redirect("/admin/editorial/home");
}
