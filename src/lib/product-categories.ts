import "server-only";

import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import { slugify } from "@/lib/utils";

export type SystemCategory = {
	name: string;
	slug: string;
	normalizedName: string;
	source: "catalog" | "system";
	createdAt: Date;
	updatedAt: Date;
};

type FastApiCategory = {
	name: string;
	slug: string;
	normalized_name: string;
	source: "catalog" | "system";
	created_at: string;
	updated_at: string;
};

function toCategory(category: FastApiCategory): SystemCategory {
	return {
		name: category.name,
		slug: category.slug,
		normalizedName: category.normalized_name,
		source: category.source === "system" ? "system" : "catalog",
		createdAt: new Date(category.created_at),
		updatedAt: new Date(category.updated_at),
	};
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
	const headers = new Headers(options?.headers);
	if (options?.body) {
		const token = (await cookies()).get("session")?.value;
		if (!token) throw new Error("Não autorizado");
		headers.set("authorization", `Bearer ${token}`);
	}
	const response = await fetch(`${env.FASTAPI_API_URL}${path}`, { ...options, headers, cache: "no-store" });
	if (!response.ok) throw new Error("Categorias indisponíveis");
	return (await response.json()) as T;
}

export async function syncSystemCategoriesFromCatalog() {
	return 0;
}

export async function listSystemCategories(_options: { syncCatalog?: boolean } = {}) {
	const categories = await request<FastApiCategory[]>("/catalog/categories/");
	return categories.map(toCategory);
}

export async function listSystemCategoriesWithProducts(options: { syncCatalog?: boolean } = {}) {
	const [categories, products] = await Promise.all([
		listSystemCategories(options),
		request<{ items: Array<{ category_slug?: string | null }> }>("/catalog/?page_size=100"),
	]);
	const used = new Set(products.items.map((product) => product.category_slug).filter(Boolean));
	return categories.filter((category) => used.has(category.slug));
}

export async function getSystemCategoryBySlugOrName(value: string) {
	const normalized = value.trim();
	if (!normalized) return null;
	const categories = await listSystemCategories();
	const slug = slugify(normalized);
	return (
		categories.find(
			(category) => category.slug === slug || category.normalizedName === normalized.toLowerCase(),
		) ?? null
	);
}

export async function createSystemCategory(name: string) {
	const trimmed = name.trim();
	if (!trimmed) throw new Error("O nome da categoria é obrigatório.");
	const created = await request<FastApiCategory>("/catalog/categories/", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ name: trimmed }),
	});
	return toCategory(created);
}

export async function renameSystemCategory(oldValue: string, newName: string) {
	const oldCategory = await getSystemCategoryBySlugOrName(oldValue);
	if (!oldCategory) throw new Error("Categoria não encontrada.");
	const trimmed = newName.trim();
	if (!trimmed) throw new Error("O novo nome da categoria é obrigatório.");
	const next = await request<FastApiCategory>(`/catalog/categories/${encodeURIComponent(oldCategory.slug)}`, {
		method: "PATCH",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ name: trimmed }),
	});
	return { oldCategory, nextCategory: toCategory(next) };
}
