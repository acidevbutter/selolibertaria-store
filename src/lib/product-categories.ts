import { listAdminStripeCategories } from "@/lib/admin-stripe-products";
import { getDb } from "@/lib/mongodb";
import { slugify } from "@/lib/utils";

export type SystemCategory = {
	name: string;
	slug: string;
	normalizedName: string;
	source: "stripe" | "system";
	createdAt: Date;
	updatedAt: Date;
	lastSyncedAt?: Date;
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
	await db.collection<SystemCategory>("productCategories").createIndex({ slug: 1 }, { unique: true });
	await db
		.collection<SystemCategory>("productCategories")
		.createIndex({ normalizedName: 1 }, { unique: true });
}

async function upsertCategories(
	categories: Array<{ name: string; slug?: string }>,
	source: SystemCategory["source"],
) {
	if (!categories.length) return 0;
	await ensureCategoryIndexes();
	const db = await getDb();
	const collection = db.collection<SystemCategory>("productCategories");
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
				{ slug: existing.slug },
				{
					$set: {
						name: existing.name || name,
						lastSyncedAt: source === "stripe" ? now : existing.lastSyncedAt,
						updatedAt: now,
					},
				},
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
			lastSyncedAt: source === "stripe" ? now : undefined,
		});
		writes += 1;
	}

	return writes;
}

export async function syncSystemCategoriesFromStripe() {
	try {
		const stripeCategories = await listAdminStripeCategories();
		return await upsertCategories(
			stripeCategories.map((category) => ({ name: category.name, slug: category.slug })),
			"stripe",
		);
	} catch {
		return 0;
	}
}

export async function listSystemCategories({ syncStripe = true }: { syncStripe?: boolean } = {}) {
	if (syncStripe) {
		await syncSystemCategoriesFromStripe();
	}

	const db = await getDb();
	return await db
		.collection<SystemCategory>("productCategories")
		.find({}, { projection: { _id: 0 } })
		.sort({ name: 1 })
		.toArray();
}

export async function getSystemCategoryBySlugOrName(value: string) {
	const normalized = normalizeCategoryName(value);
	if (!normalized) return null;
	const db = await getDb();
	return await db.collection<SystemCategory>("productCategories").findOne({
		$or: [{ slug: slugify(normalized) }, { normalizedName: normalized.toLowerCase() }],
	});
}

export async function createSystemCategory(name: string) {
	const normalizedName = normalizeCategoryName(name);
	if (!normalizedName) {
		throw new Error("Category name is required.");
	}
	await upsertCategories([{ name: normalizedName }], "system");
	return await getSystemCategoryBySlugOrName(normalizedName);
}

export async function renameSystemCategory(oldValue: string, newName: string) {
	const oldCategory = await getSystemCategoryBySlugOrName(oldValue);
	if (!oldCategory) {
		throw new Error("Category not found.");
	}

	const normalizedName = normalizeCategoryName(newName);
	if (!normalizedName) {
		throw new Error("New category name is required.");
	}

	const nextName = formatCategoryName(normalizedName);
	const nextSlug = slugify(nextName);
	const db = await getDb();
	await ensureCategoryIndexes();
	await db.collection<SystemCategory>("productCategories").updateOne(
		{ slug: oldCategory.slug },
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
