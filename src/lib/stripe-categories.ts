import { listSystemCategories } from "@/lib/product-categories";

interface CachedCategories {
	at: number;
	data: { name: string; slug: string }[];
}

const formatName = (value: string) =>
	value
		.toLowerCase()
		.replace(/-/g, " ")
		.split(/\s+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

declare global {
	// eslint-disable-next-line no-var
	var __stripeCategoriesCache: CachedCategories | undefined;
}

const readCache = (): { name: string; slug: string }[] | null => {
	const cached = globalThis.__stripeCategoriesCache;
	if (!cached) return null;
	if (Date.now() - cached.at > CACHE_TTL_MS) return null;
	const needsFormat = cached.data.some((c) => /-|[A-Z]{2,}|^[a-z]/.test(c.name));
	if (needsFormat) {
		const formatted = cached.data.map((c) => ({ ...c, name: formatName(c.name) }));
		writeCache(formatted);
		return formatted;
	}
	return cached.data;
};

const writeCache = (data: { name: string; slug: string }[]) => {
	globalThis.__stripeCategoriesCache = { at: Date.now(), data };
};

export async function getStripeCategories(): Promise<{ name: string; slug: string }[]> {
	try {
		const cached = readCache();
		if (cached) return cached;
		const categories = (await listSystemCategories()).map((category) => ({
			name: formatName(category.name),
			slug: category.slug,
		}));
		categories.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
		writeCache(categories);
		return categories;
	} catch {
		return [];
	}
}

export default getStripeCategories;
