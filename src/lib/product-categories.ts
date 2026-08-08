import { getCatalogCollection } from "@/lib/catalog";
import { getDb } from "@/lib/mongodb";
import { slugify } from "@/lib/utils";

export type SystemCategory = {
	name: string;
	slug: string;
	normalizedName: string;
	source: "catalog" | "system";
	createdAt: Date;
	updatedAt: Date;
};

const normalizeCategoryName = (value: string) => value.trim().replace(/\s+/g, " ");

const formatCategoryName = (value: string) =>
	normalizeCategoryName(value)
		.toLowerCase()
		.split(" ")
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");

async function ensureCategoryIndexes() {
	const db = await getDb();
	const categories = db.collection<SystemCategory>("productCategories");
	await categories.createIndex({ slug: 1 }, { unique: true });
	await categories.createIndex({ normalizedName: 1 }, { unique: true });
}

async function upsertCategories(
	categories: Array<{ name: string; slug?: string }>,
	source: SystemCategory["source"],
) {
	if (!categories.length) return 0;
	await ensureCategoryIndexes();
	const collection = (await getDb()).collection<SystemCategory>("productCategories");
	let writes = 0;

	for (const category of categories) {
		const normalizedName = normalizeCategoryName(category.name);
		if (!normalizedName) continue;
		const name = formatCategoryName(normalizedName);
		const slug = slugify(category.slug || name);
		const now = new Date();
		const existing = await collection.findOne({
			$or: [{ slug }, { normalizedName: normalizedName.toLowerCase() }],
		});
		if (existing) {
			await collection.updateOne(
				{ _id: existing._id },
				{ $set: { name, slug, normalizedName: normalizedName.toLowerCase(), source, updatedAt: now } },
			);
			continue;
		}
		await collection.insertOne({
			name,
			slug,
			normalizedName: normalizedName.toLowerCase(),
			source,
			createdAt: now,
			updatedAt: now,
		});
		writes += 1;
	}
	return writes;
}

export async function syncSystemCategoriesFromCatalog() {
	const db = await getDb();
	const products = await db
		.collection<{ category?: { name?: string; slug?: string } | null }>("catalogProducts")
		.find({ "category.name": { $exists: true } }, { projection: { category: 1 } })
		.toArray();
	return upsertCategories(
		products.flatMap((product) =>
			product.category?.name ? [{ name: product.category.name, slug: product.category.slug }] : [],
		),
		"catalog",
	);
}

export async function listSystemCategories({ syncCatalog = true }: { syncCatalog?: boolean } = {}) {
	if (syncCatalog) {
		await syncSystemCategoriesFromCatalog().catch(() => 0);
	}
	return (await getDb())
		.collection<SystemCategory>("productCategories")
		.find({}, { projection: { _id: 0 } })
		.sort({ name: 1 })
		.toArray();
}

/**
 * Categories with zero published products resolve to a 404 on /category/[slug],
 * so public surfaces (e.g. the footer) should only link to categories that
 * currently have at least one published product attached.
 */
export async function listSystemCategoriesWithProducts({
	syncCatalog = true,
}: {
	syncCatalog?: boolean;
} = {}) {
	const [categories, catalogProducts] = await Promise.all([
		listSystemCategories({ syncCatalog }),
		(await getCatalogCollection())
			.find({ published: true, "category.slug": { $exists: true } }, { projection: { category: 1 } })
			.toArray(),
	]);
	const slugsWithProducts = new Set(catalogProducts.map((product) => product.category?.slug).filter(Boolean));
	return categories.filter((category) => slugsWithProducts.has(category.slug));
}

export async function getSystemCategoryBySlugOrName(value: string) {
	const normalized = normalizeCategoryName(value);
	if (!normalized) return null;
	return (await getDb()).collection<SystemCategory>("productCategories").findOne({
		$or: [{ slug: slugify(normalized) }, { normalizedName: normalized.toLowerCase() }],
	});
}

export async function createSystemCategory(name: string) {
	const normalizedName = normalizeCategoryName(name);
	if (!normalizedName) throw new Error("O nome da categoria é obrigatório.");
	await upsertCategories([{ name: normalizedName }], "system");
	return getSystemCategoryBySlugOrName(normalizedName);
}

export async function renameSystemCategory(oldValue: string, newName: string) {
	const oldCategory = await getSystemCategoryBySlugOrName(oldValue);
	if (!oldCategory) throw new Error("Categoria não encontrada.");
	const normalizedName = normalizeCategoryName(newName);
	if (!normalizedName) throw new Error("O novo nome da categoria é obrigatório.");
	const nextName = formatCategoryName(normalizedName);
	const nextSlug = slugify(nextName);
	await ensureCategoryIndexes();
	await (await getDb()).collection<SystemCategory>("productCategories").updateOne(
		{ _id: oldCategory._id },
		{
			$set: {
				name: nextName,
				slug: nextSlug,
				normalizedName: normalizedName.toLowerCase(),
				updatedAt: new Date(),
			},
		},
	);
	return { oldCategory, nextCategory: { ...oldCategory, name: nextName, slug: nextSlug } };
}
