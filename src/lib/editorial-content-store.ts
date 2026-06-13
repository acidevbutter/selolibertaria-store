import "server-only";

import type { Filter } from "mongodb";
import type {
	EditorialAboutPage,
	EditorialContactPage,
	EditorialDocument,
	EditorialHomePage,
	EditorialSarauPage,
} from "@/lib/editorial-content";
import {
	getMockEditorialAboutPage,
	getMockEditorialContactPage,
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

export async function listEditorialEvents() {
	try {
		const items = await listEditorialFromDb("event");
		if (items.length > 0) return items;
	} catch {}
	return getMockEditorialEvents();
}

export async function listEditorialProjects() {
	try {
		const items = await listEditorialFromDb("project");
		if (items.length > 0) return items;
	} catch {}
	return getMockEditorialProjects();
}

export async function getEditorialSarauPage() {
	try {
		const db = await getDb();
		const item = await db.collection<EditorialSarauPage>(COLLECTION).findOne({
			type: "page_sarau",
			slug: "sarau-safado",
		});
		if (item) return item;
	} catch {}
	return getMockEditorialSarauPage();
}

export async function getEditorialAboutPage() {
	try {
		const db = await getDb();
		const item = await db.collection<EditorialAboutPage>(COLLECTION).findOne({
			type: "page_about",
			slug: "about",
		});
		if (item) return item;
	} catch {}
	return getMockEditorialAboutPage();
}

export async function getEditorialContactPage() {
	try {
		const db = await getDb();
		const item = await db.collection<EditorialContactPage>(COLLECTION).findOne({
			type: "page_contact",
			slug: "contact",
		});
		if (item) return item;
	} catch {}
	return getMockEditorialContactPage();
}

export async function getEditorialHomePage() {
	try {
		const db = await getDb();
		const item = await db.collection<EditorialHomePage>(COLLECTION).findOne({
			type: "page_home",
			slug: "home",
		});
		if (item) return item;
	} catch {}
	return getMockEditorialHomePage();
}
