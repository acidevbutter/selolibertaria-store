"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCapability } from "@/lib/api-auth";
import { uploadImageFileToCloudinary } from "@/lib/cloudinary-upload";
import type {
	EditorialAboutPage,
	EditorialContactPage,
	EditorialEvent,
	EditorialHomePage,
	EditorialProject,
	EditorialSarauPage,
} from "@/lib/editorial-content";
import { getDb } from "@/lib/mongodb";
import { slugify } from "@/lib/utils";

const COLLECTION = "editorialContent";

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

function parseBoolean(value: FormDataEntryValue | null, defaultValue = false) {
	if (typeof value !== "string") return defaultValue;
	return value === "true" || value === "on" || value === "1";
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
	const uploadedSrc =
		fileEntry instanceof File && fileEntry.size > 0
			? (await uploadImageFileToCloudinary(fileEntry)).secure_url
			: null;
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

function parseStringList(formData: FormData, key: string) {
	return formData
		.getAll(key)
		.map((value) => (typeof value === "string" ? value.trim() : ""))
		.filter(Boolean);
}

function refreshEventPaths(slug?: string) {
	revalidatePath("/");
	revalidatePath("/events");
	if (slug) revalidatePath(`/admin/editorial/events/${slug}`);
	revalidatePath("/admin/editorial/events");
}

function refreshProjectPaths(slug?: string) {
	revalidatePath("/");
	revalidatePath("/projects");
	if (slug) revalidatePath(`/admin/editorial/projects/${slug}`);
	revalidatePath("/admin/editorial/projects");
}

function refreshSarauPaths() {
	revalidatePath("/");
	revalidatePath("/sarau-safado");
	revalidatePath("/admin/editorial/sarau-safado");
}

function refreshAboutPaths() {
	revalidatePath("/");
	revalidatePath("/about");
	revalidatePath("/admin/editorial/about");
}

function refreshContactPaths() {
	revalidatePath("/");
	revalidatePath("/contact");
	revalidatePath("/admin/editorial/contact");
}

function refreshHomePaths() {
	revalidatePath("/");
	revalidatePath("/admin/editorial/home");
}

async function moveEditorialItem(
	type: "event" | "project",
	slug: string,
	direction: "up" | "down",
	actor: string,
) {
	const db = await getDb();
	const items = await db
		.collection<EditorialEvent | EditorialProject>(COLLECTION)
		.find({ type })
		.sort({ order: 1, updatedAt: -1 })
		.toArray();

	const currentIndex = items.findIndex((item) => item.slug === slug);
	if (currentIndex === -1) return;

	const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
	const target = items[targetIndex];
	const current = items[currentIndex];
	if (!target || !current) return;

	const now = new Date().toISOString();

	await db.collection<EditorialEvent | EditorialProject>(COLLECTION).bulkWrite([
		{
			updateOne: {
				filter: { type, slug: current.slug },
				update: {
					$set: {
						order: target.order,
						updatedAt: now,
						updatedBy: actor,
					},
				},
			},
		},
		{
			updateOne: {
				filter: { type, slug: target.slug },
				update: {
					$set: {
						order: current.order,
						updatedAt: now,
						updatedBy: actor,
					},
				},
			},
		},
	]);
}

export async function createEditorialEventAction(formData: FormData) {
	const session = await requireEditorialManager();
	const db = await getDb();
	const title = requiredString(formData, "title");
	const slug = slugify(optionalString(formData.get("slug")) || title);
	const now = new Date().toISOString();

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
		updatedAt: now,
		updatedBy: String(session.sub),
		createdAt: now,
		createdBy: String(session.sub),
	};

	await db.collection<EditorialEvent>(COLLECTION).updateOne(
		{ type: "event", slug },
		{
			$set: doc,
		},
		{ upsert: true },
	);

	refreshEventPaths(slug);
	redirect(`/admin/editorial/events/${encodeURIComponent(slug)}`);
}

export async function updateEditorialEventAction(formData: FormData) {
	const session = await requireEditorialManager();
	const db = await getDb();
	const currentSlug = requiredString(formData, "currentSlug");
	const title = requiredString(formData, "title");
	const slug = slugify(optionalString(formData.get("slug")) || title);
	const now = new Date().toISOString();

	await db.collection<EditorialEvent>(COLLECTION).updateOne(
		{ type: "event", slug: currentSlug },
		{
			$set: {
				title,
				slug,
				summary: optionalString(formData.get("summary")),
				description: optionalString(formData.get("description")),
				status: optionalString(formData.get("status")),
				period: optionalString(formData.get("period")),
				location: optionalString(formData.get("location")),
				eyebrow: optionalString(formData.get("eyebrow")),
				published: parseBoolean(formData.get("published"), true),
				order: parseOrder(formData.get("order"), 1),
				image: await parseImage(formData),
				updatedAt: now,
				updatedBy: String(session.sub),
			},
		},
	);

	refreshEventPaths(currentSlug);
	if (currentSlug !== slug) refreshEventPaths(slug);
	redirect(`/admin/editorial/events/${encodeURIComponent(slug)}`);
}

export async function toggleEditorialEventPublishedAction(formData: FormData) {
	const session = await requireEditorialManager();
	const db = await getDb();
	const slug = requiredString(formData, "slug");
	const published = parseBoolean(formData.get("published"), false);

	await db.collection<EditorialEvent>(COLLECTION).updateOne(
		{ type: "event", slug },
		{
			$set: {
				published,
				updatedAt: new Date().toISOString(),
				updatedBy: String(session.sub),
			},
		},
	);

	refreshEventPaths(slug);
}

export async function moveEditorialEventAction(formData: FormData) {
	const session = await requireEditorialManager();
	const slug = requiredString(formData, "slug");
	const direction = requiredString(formData, "direction");
	if (direction !== "up" && direction !== "down") {
		throw new Error("Direção inválida.");
	}

	await moveEditorialItem("event", slug, direction, String(session.sub));
	refreshEventPaths(slug);
}

export async function deleteEditorialEventAction(formData: FormData) {
	await requireEditorialManager();
	const db = await getDb();
	const slug = requiredString(formData, "slug");

	await db.collection<EditorialEvent>(COLLECTION).deleteOne({ type: "event", slug });

	refreshEventPaths(slug);
	redirect("/admin/editorial/events");
}

export async function getEditorialEventBySlug(slug: string) {
	const db = await getDb();
	return await db.collection<EditorialEvent>(COLLECTION).findOne({ type: "event", slug });
}

export async function listEditorialEventRecords() {
	const db = await getDb();
	return await db.collection<EditorialEvent>(COLLECTION).find({ type: "event" }).sort({ order: 1 }).toArray();
}

export async function createEditorialProjectAction(formData: FormData) {
	const session = await requireEditorialManager();
	const db = await getDb();
	const title = requiredString(formData, "title");
	const slug = slugify(optionalString(formData.get("slug")) || title);
	const now = new Date().toISOString();

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
		updatedAt: now,
		updatedBy: String(session.sub),
		createdAt: now,
		createdBy: String(session.sub),
	};

	await db
		.collection<EditorialProject>(COLLECTION)
		.updateOne({ type: "project", slug }, { $set: doc }, { upsert: true });

	refreshProjectPaths(slug);
	redirect(`/admin/editorial/projects/${encodeURIComponent(slug)}`);
}

export async function updateEditorialProjectAction(formData: FormData) {
	const session = await requireEditorialManager();
	const db = await getDb();
	const currentSlug = requiredString(formData, "currentSlug");
	const title = requiredString(formData, "title");
	const slug = slugify(optionalString(formData.get("slug")) || title);
	const now = new Date().toISOString();

	await db.collection<EditorialProject>(COLLECTION).updateOne(
		{ type: "project", slug: currentSlug },
		{
			$set: {
				title,
				slug,
				summary: optionalString(formData.get("summary")),
				description: optionalString(formData.get("description")),
				period: optionalString(formData.get("period")),
				location: optionalString(formData.get("location")),
				eyebrow: optionalString(formData.get("eyebrow")),
				published: parseBoolean(formData.get("published"), true),
				order: parseOrder(formData.get("order"), 1),
				image: await parseImage(formData),
				updatedAt: now,
				updatedBy: String(session.sub),
			},
		},
	);

	refreshProjectPaths(currentSlug);
	if (currentSlug !== slug) refreshProjectPaths(slug);
	redirect(`/admin/editorial/projects/${encodeURIComponent(slug)}`);
}

export async function toggleEditorialProjectPublishedAction(formData: FormData) {
	const session = await requireEditorialManager();
	const db = await getDb();
	const slug = requiredString(formData, "slug");
	const published = parseBoolean(formData.get("published"), false);

	await db.collection<EditorialProject>(COLLECTION).updateOne(
		{ type: "project", slug },
		{
			$set: {
				published,
				updatedAt: new Date().toISOString(),
				updatedBy: String(session.sub),
			},
		},
	);

	refreshProjectPaths(slug);
}

export async function moveEditorialProjectAction(formData: FormData) {
	const session = await requireEditorialManager();
	const slug = requiredString(formData, "slug");
	const direction = requiredString(formData, "direction");
	if (direction !== "up" && direction !== "down") {
		throw new Error("Direção inválida.");
	}

	await moveEditorialItem("project", slug, direction, String(session.sub));
	refreshProjectPaths(slug);
}

export async function deleteEditorialProjectAction(formData: FormData) {
	await requireEditorialManager();
	const db = await getDb();
	const slug = requiredString(formData, "slug");

	await db.collection<EditorialProject>(COLLECTION).deleteOne({ type: "project", slug });

	refreshProjectPaths(slug);
	redirect("/admin/editorial/projects");
}

export async function getEditorialProjectBySlug(slug: string) {
	const db = await getDb();
	return await db.collection<EditorialProject>(COLLECTION).findOne({ type: "project", slug });
}

export async function listEditorialProjectRecords() {
	const db = await getDb();
	return await db
		.collection<EditorialProject>(COLLECTION)
		.find({ type: "project" })
		.sort({ order: 1 })
		.toArray();
}

export async function getEditorialSarauRecord() {
	const db = await getDb();
	return await db.collection<EditorialSarauPage>(COLLECTION).findOne({
		type: "page_sarau",
		slug: "sarau-safado",
	});
}

export async function updateEditorialSarauAction(formData: FormData) {
	const session = await requireEditorialManager();
	const db = await getDb();
	const now = new Date().toISOString();
	const title = requiredString(formData, "title");

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

	await db.collection<EditorialSarauPage>(COLLECTION).updateOne(
		{ type: "page_sarau", slug: "sarau-safado" },
		{
			$set: {
				type: "page_sarau",
				slug: "sarau-safado",
				title,
				summary: optionalString(formData.get("summary")),
				body: optionalString(formData.get("body")),
				published: parseBoolean(formData.get("published"), true),
				order: parseOrder(formData.get("order"), 1),
				hero: {
					eyebrow: optionalString(formData.get("heroEyebrow")),
					title: optionalString(formData.get("heroTitle")),
					body: optionalString(formData.get("heroBody")),
					image: await parseImageByPrefix(formData, "heroImage"),
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
					{ label: "Livros", href: "/products" },
				],
				updatedAt: now,
				updatedBy: String(session.sub),
			},
			$setOnInsert: {
				createdAt: now,
				createdBy: String(session.sub),
			},
		},
		{ upsert: true },
	);

	refreshSarauPaths();
	redirect("/admin/editorial/sarau-safado");
}

export async function getEditorialAboutRecord() {
	const db = await getDb();
	return await db.collection<EditorialAboutPage>(COLLECTION).findOne({
		type: "page_about",
		slug: "about",
	});
}

export async function updateEditorialAboutAction(formData: FormData) {
	const session = await requireEditorialManager();
	const db = await getDb();
	const now = new Date().toISOString();
	const title = requiredString(formData, "title");

	const cards = [1, 2, 3]
		.map((index) => ({
			eyebrow: optionalString(formData.get(`card${index}Eyebrow`)),
			title: optionalString(formData.get(`card${index}Title`)),
			body: optionalString(formData.get(`card${index}Body`)),
		}))
		.filter((card): card is { eyebrow?: string | null; title: string; body: string } =>
			Boolean(card.title?.trim() && card.body?.trim()),
		);

	await db.collection<EditorialAboutPage>(COLLECTION).updateOne(
		{ type: "page_about", slug: "about" },
		{
			$set: {
				type: "page_about",
				slug: "about",
				title,
				summary: optionalString(formData.get("summary")),
				body: optionalString(formData.get("body")),
				published: parseBoolean(formData.get("published"), true),
				order: parseOrder(formData.get("order"), 1),
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
				updatedAt: now,
				updatedBy: String(session.sub),
			},
			$setOnInsert: {
				createdAt: now,
				createdBy: String(session.sub),
			},
		},
		{ upsert: true },
	);

	refreshAboutPaths();
	redirect("/admin/editorial/about");
}

export async function getEditorialContactRecord() {
	const db = await getDb();
	return await db.collection<EditorialContactPage>(COLLECTION).findOne({
		type: "page_contact",
		slug: "contact",
	});
}

export async function updateEditorialContactAction(formData: FormData) {
	const session = await requireEditorialManager();
	const db = await getDb();
	const now = new Date().toISOString();
	const title = requiredString(formData, "title");

	const directLinks = [1, 2, 3]
		.map((index) => ({
			label: optionalString(formData.get(`direct${index}Label`)),
			href: optionalString(formData.get(`direct${index}Href`)),
			text: optionalString(formData.get(`direct${index}Text`)),
		}))
		.filter((link): link is { label: string; href: string; text: string } =>
			Boolean(link.label?.trim() && link.href?.trim() && link.text?.trim()),
		);

	const pathLinks = [1, 2, 3, 4, 5, 6]
		.map((index) => ({
			label: optionalString(formData.get(`path${index}Label`)),
			href: optionalString(formData.get(`path${index}Href`)),
		}))
		.filter((link): link is { label: string; href: string } =>
			Boolean(link.label?.trim() && link.href?.trim()),
		);

	await db.collection<EditorialContactPage>(COLLECTION).updateOne(
		{ type: "page_contact", slug: "contact" },
		{
			$set: {
				type: "page_contact",
				slug: "contact",
				title,
				summary: optionalString(formData.get("summary")),
				published: parseBoolean(formData.get("published"), true),
				order: parseOrder(formData.get("order"), 1),
				hero: {
					eyebrow: optionalString(formData.get("heroEyebrow")),
					title: optionalString(formData.get("heroTitle")),
					body: optionalString(formData.get("heroBody")),
				},
				form: {
					title: optionalString(formData.get("formTitle")),
					description: optionalString(formData.get("formDescription")),
				},
				direct: {
					title: optionalString(formData.get("directTitle")),
					description: optionalString(formData.get("directDescription")),
					links: directLinks,
				},
				paths: {
					title: optionalString(formData.get("pathsTitle")),
					description: optionalString(formData.get("pathsDescription")),
					links: pathLinks,
				},
				updatedAt: now,
				updatedBy: String(session.sub),
			},
			$setOnInsert: {
				createdAt: now,
				createdBy: String(session.sub),
			},
		},
		{ upsert: true },
	);

	refreshContactPaths();
	redirect("/admin/editorial/contact");
}

export async function getEditorialHomeRecord() {
	const db = await getDb();
	return await db.collection<EditorialHomePage>(COLLECTION).findOne({
		type: "page_home",
		slug: "home",
	});
}

export async function updateEditorialHomeAction(formData: FormData) {
	const session = await requireEditorialManager();
	const db = await getDb();
	const now = new Date().toISOString();
	const title = requiredString(formData, "title");

	const communityLinks = [1, 2, 3]
		.map((index) => ({
			label: optionalString(formData.get(`communityLink${index}Label`)),
			href: optionalString(formData.get(`communityLink${index}Href`)),
		}))
		.filter((link): link is { label: string; href: string } =>
			Boolean(link.label?.trim() && link.href?.trim()),
		);

	await db.collection<EditorialHomePage>(COLLECTION).updateOne(
		{ type: "page_home", slug: "home" },
		{
			$set: {
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
					primaryCtaHref: optionalString(formData.get("heroPrimaryCtaHref")),
					secondaryCtaLabel: optionalString(formData.get("heroSecondaryCtaLabel")),
					secondaryCtaHref: optionalString(formData.get("heroSecondaryCtaHref")),
					supportingLine: optionalString(formData.get("heroSupportingLine")),
					featureEyebrow: optionalString(formData.get("heroFeatureEyebrow")),
					featureTitle: optionalString(formData.get("heroFeatureTitle")),
					featureBody: optionalString(formData.get("heroFeatureBody")),
					featureQuote: optionalString(formData.get("heroFeatureQuote")),
					featureImage: await parseImageByPrefix(formData, "heroFeatureImage"),
				},
				manifesto: {
					title: optionalString(formData.get("manifestoTitle")),
					body: optionalString(formData.get("manifestoBody")),
					linkLabel: optionalString(formData.get("manifestoLinkLabel")),
					linkHref: optionalString(formData.get("manifestoLinkHref")),
				},
				author: {
					eyebrow: optionalString(formData.get("authorEyebrow")),
					title: optionalString(formData.get("authorTitle")),
					body: optionalString(formData.get("authorBody")),
					secondaryBody: optionalString(formData.get("authorSecondaryBody")),
					primaryCtaLabel: optionalString(formData.get("authorPrimaryCtaLabel")),
					primaryCtaHref: optionalString(formData.get("authorPrimaryCtaHref")),
					secondaryCtaLabel: optionalString(formData.get("authorSecondaryCtaLabel")),
					secondaryCtaHref: optionalString(formData.get("authorSecondaryCtaHref")),
					image: await parseImageByPrefix(formData, "authorImage"),
				},
				community: {
					title: optionalString(formData.get("communityTitle")),
					body: optionalString(formData.get("communityBody")),
					primaryCtaLabel: optionalString(formData.get("communityPrimaryCtaLabel")),
					primaryCtaHref: optionalString(formData.get("communityPrimaryCtaHref")),
					secondaryLinks: communityLinks,
				},
				updatedAt: now,
				updatedBy: String(session.sub),
			},
			$setOnInsert: {
				createdAt: now,
				createdBy: String(session.sub),
			},
		},
		{ upsert: true },
	);

	refreshHomePaths();
	redirect("/admin/editorial/home");
}
