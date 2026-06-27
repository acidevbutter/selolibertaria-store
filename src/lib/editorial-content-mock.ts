import type { EditorialDocument } from "@/lib/editorial-content";
import {
	buildSeedAboutPage,
	buildSeedContactPage,
	buildSeedEditorialDocuments,
	buildSeedEditorialEvents,
	buildSeedEditorialProjects,
	buildSeedEventsPage,
	buildSeedHomePage,
	buildSeedProductPage,
	buildSeedProductsPage,
	buildSeedProjectsPage,
	buildSeedSarauPage,
	buildSeedSiteGlobal,
} from "@/lib/editorial-content-seed";

export function getMockEditorialDocuments(): EditorialDocument[] {
	return buildSeedEditorialDocuments();
}

export function getMockEditorialEvents() {
	return buildSeedEditorialEvents();
}

export function getMockEditorialProjects() {
	return buildSeedEditorialProjects();
}

export function getMockEditorialSarauPage() {
	return buildSeedSarauPage();
}

export function getMockEditorialAboutPage() {
	return buildSeedAboutPage();
}

export function getMockEditorialContactPage() {
	return buildSeedContactPage();
}

export function getMockEditorialHomePage() {
	return buildSeedHomePage();
}

export function getMockEditorialEventsPage() {
	return buildSeedEventsPage();
}

export function getMockEditorialProjectsPage() {
	return buildSeedProjectsPage();
}

export function getMockEditorialProductsPage() {
	return buildSeedProductsPage();
}

export function getMockEditorialProductPage() {
	return buildSeedProductPage();
}

export function getMockEditorialSiteGlobal() {
	return buildSeedSiteGlobal();
}
