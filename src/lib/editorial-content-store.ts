import "server-only";

import type { Filter } from "mongodb";
import type { EditorialDocument } from "@/lib/editorial-content";
import {
	getMockEditorialAboutPage,
	getMockEditorialContactPage,
	getMockEditorialDocuments,
	getMockEditorialEvents,
	getMockEditorialHomePage,
	getMockEditorialProjects,
	getMockEditorialSarauPage,
} from "@/lib/editorial-content-mock";
import { getDb } from "@/lib/mongodb";

const COLLECTION = "editorialContent";

async function listEditorialFromDb<T extends EditorialDocument["type"]>(type: T) {
	const db = await getDb();
	const filter: Filter<Extract<EditorialDocument, { type: T }>> = { type } as Filter<
		Extract<EditorialDocument, { type: T }>
	>;
	return await db
		.collection<Extract<EditorialDocument, { type: T }>>(COLLECTION)
		.find(filter)
		.sort({ order: 1, updatedAt: -1 })
		.toArray();
}

function selectFirstPublished<T extends { published: boolean }>(items: T[]) {
	return items.find((item) => item.published) ?? null;
}

function getFallbackDocument<T extends EditorialDocument["type"]>(type: T) {
	return getMockEditorialDocuments().find(
		(item): item is Extract<EditorialDocument, { type: T }> => item.type === type,
	);
}

export async function listEditorialEvents() {
	try {
		const items = await listEditorialFromDb("event");
		if (items.length > 0) return items;
	} catch {}
	return getMockEditorialEvents();
}

export async function getEditorialEventRecordBySlug(slug: string) {
	try {
		const items = await listEditorialFromDb("event");
		const item = items.find((entry) => entry.slug === slug);
		if (item) return item;
	} catch {}
	return getMockEditorialEvents().find((item) => item.slug === slug) ?? null;
}

export async function listEditorialProjects() {
	try {
		const items = await listEditorialFromDb("project");
		if (items.length > 0) return items;
	} catch {}
	return getMockEditorialProjects();
}

export async function getEditorialProjectRecordBySlug(slug: string) {
	try {
		const items = await listEditorialFromDb("project");
		const item = items.find((entry) => entry.slug === slug);
		if (item) return item;
	} catch {}
	return getMockEditorialProjects().find((item) => item.slug === slug) ?? null;
}

export async function getEditorialSarauPage() {
	try {
		const items = await listEditorialFromDb("page_sarau");
		const item = selectFirstPublished(items);
		if (item) return item;
	} catch {}
	return getMockEditorialSarauPage();
}

export async function getEditorialAboutPage() {
	try {
		const items = await listEditorialFromDb("page_about");
		const item = selectFirstPublished(items);
		if (item) return item;
	} catch {}
	return getMockEditorialAboutPage();
}

export async function getEditorialContactPage() {
	try {
		const items = await listEditorialFromDb("page_contact");
		const item = selectFirstPublished(items);
		if (item) return item;
	} catch {}
	return getMockEditorialContactPage();
}

export async function getEditorialHomePage() {
	try {
		const items = await listEditorialFromDb("page_home");
		const item = selectFirstPublished(items);
		if (item) return item;
	} catch {}
	return getMockEditorialHomePage();
}

export async function listEditorialRecordsForAdmin<T extends EditorialDocument["type"]>(type: T) {
	try {
		const items = await listEditorialFromDb(type);
		if (items.length > 0) return items;
	} catch {}

	const fallback = getMockEditorialDocuments().filter(
		(item): item is Extract<EditorialDocument, { type: T }> => item.type === type,
	);

	return fallback.sort((left, right) => left.order - right.order);
}

export async function getEditorialRecordForAdmin<T extends EditorialDocument["type"]>(type: T) {
	try {
		const items = await listEditorialFromDb(type);
		const item = items[0] ?? null;
		if (item) return item;
	} catch {}

	return getFallbackDocument(type) ?? null;
}
