import "server-only";

import { env } from "@/env.mjs";
import type { EditorialDocument } from "@/lib/editorial-content";
import {
	getMockEditorialAboutPage,
	getMockEditorialContactPage,
	getMockEditorialDocuments,
	getMockEditorialEvents,
	getMockEditorialEventsPage,
	getMockEditorialHomePage,
	getMockEditorialProductPage,
	getMockEditorialProductsPage,
	getMockEditorialProjects,
	getMockEditorialProjectsPage,
	getMockEditorialSarauPage,
	getMockEditorialSiteGlobal,
} from "@/lib/editorial-content-mock";

type FastApiEditorial = {
	id: string;
	type: EditorialDocument["type"];
	slug: string;
	title: string;
	content: Record<string, unknown>;
	published: boolean;
	order: number;
	created_at: string;
	updated_at: string;
};

function mapEditorial<T extends EditorialDocument["type"]>(value: FastApiEditorial) {
	return {
		...value.content,
		_id: value.id,
		type: value.type,
		slug: value.slug,
		title: value.title,
		published: value.published,
		order: value.order,
		createdAt: value.created_at,
		updatedAt: value.updated_at,
	} as Extract<EditorialDocument, { type: T }>;
}

async function listEditorialFromApi<T extends EditorialDocument["type"]>(type: T, admin = false) {
	const path = admin ? `/editorial/internal/admin/${type}` : `/editorial/public/${type}`;
	const response = await fetch(`${env.FASTAPI_API_URL}${path}`, {
		headers: admin ? { "X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY } : undefined,
		cache: "no-store",
	});
	if (!response.ok) throw new Error("FastAPI editorial unavailable");
	const payload = (await response.json()) as FastApiEditorial[];
	return payload.map((item) => mapEditorial<T>(item));
}

function selectFirstPublished<T extends { published: boolean }>(items: T[]) {
	return items.find((item) => item.published) ?? null;
}

function getFallbackDocument<T extends EditorialDocument["type"]>(type: T) {
	return getMockEditorialDocuments().find(
		(item): item is Extract<EditorialDocument, { type: T }> => item.type === type,
	);
}

async function getSingleEditorialPage<T extends EditorialDocument["type"]>(
	type: T,
	fallback: () => Extract<EditorialDocument, { type: T }>,
) {
	try {
		const items = await listEditorialFromApi(type);
		const item = selectFirstPublished(items);
		if (item) return item;
	} catch {}
	return fallback();
}

export async function listEditorialEvents() {
	try {
		const items = await listEditorialFromApi("event");
		if (items.length > 0) return items;
	} catch {}
	return getMockEditorialEvents();
}

export async function getEditorialEventRecordBySlug(slug: string) {
	try {
		const items = await listEditorialFromApi("event");
		const item = items.find((entry) => entry.slug === slug);
		if (item) return item;
	} catch {}
	return getMockEditorialEvents().find((item) => item.slug === slug) ?? null;
}

export async function listEditorialProjects() {
	try {
		const items = await listEditorialFromApi("project");
		if (items.length > 0) return items;
	} catch {}
	return getMockEditorialProjects();
}

export async function getEditorialProjectRecordBySlug(slug: string) {
	try {
		const items = await listEditorialFromApi("project");
		const item = items.find((entry) => entry.slug === slug);
		if (item) return item;
	} catch {}
	return getMockEditorialProjects().find((item) => item.slug === slug) ?? null;
}

export async function getEditorialSarauPage() {
	return await getSingleEditorialPage("page_sarau", getMockEditorialSarauPage);
}

export async function getEditorialAboutPage() {
	return await getSingleEditorialPage("page_about", getMockEditorialAboutPage);
}

export async function getEditorialContactPage() {
	return await getSingleEditorialPage("page_contact", getMockEditorialContactPage);
}

export async function getEditorialHomePage() {
	return await getSingleEditorialPage("page_home", getMockEditorialHomePage);
}

export async function getEditorialEventsPage() {
	return await getSingleEditorialPage("page_events", getMockEditorialEventsPage);
}

export async function getEditorialProjectsPage() {
	return await getSingleEditorialPage("page_projects", getMockEditorialProjectsPage);
}

export async function getEditorialProductsPage() {
	return await getSingleEditorialPage("page_products", getMockEditorialProductsPage);
}

export async function getEditorialProductPage() {
	return await getSingleEditorialPage("page_product", getMockEditorialProductPage);
}

export async function getEditorialSiteGlobal() {
	return await getSingleEditorialPage("site_global", getMockEditorialSiteGlobal);
}

export async function listEditorialRecordsForAdmin<T extends EditorialDocument["type"]>(type: T) {
	try {
		const items = await listEditorialFromApi(type, true);
		if (items.length > 0) return items;
	} catch {}

	const fallback = getMockEditorialDocuments().filter(
		(item): item is Extract<EditorialDocument, { type: T }> => item.type === type,
	);

	return fallback.sort((left, right) => left.order - right.order);
}

export async function getEditorialRecordForAdmin<T extends EditorialDocument["type"]>(type: T) {
	try {
		const items = await listEditorialFromApi(type, true);
		const item = items[0] ?? null;
		if (item) return item;
	} catch {}

	return getFallbackDocument(type) ?? null;
}
