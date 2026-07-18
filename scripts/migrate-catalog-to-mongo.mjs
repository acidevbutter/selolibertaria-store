import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import nextEnv from "@next/env";
import { MongoClient } from "mongodb";

nextEnv.loadEnvConfig(process.cwd());

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const valueFor = (flag) => {
	const index = args.indexOf(flag);
	return index >= 0 ? args[index + 1] : undefined;
};

function slugify(value) {
	return String(value || "")
		.normalize("NFKD")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function required(name) {
	const value = process.env[name]?.trim();
	if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
	return value;
}

function readStock(value) {
	const parsed = Number.parseInt(String(value ?? ""), 10);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function readMinorAmount(price) {
	if (!price || typeof price !== "object") return null;
	const raw = price.unit_amount ?? price.unitAmount;
	if (raw !== undefined && raw !== null && raw !== "") {
		const parsed = Number(raw);
		if (Number.isFinite(parsed) && parsed >= 0) return Math.round(parsed);
	}
	const decimal = Number(price.unit_amount_decimal ?? price.unitAmountDecimal ?? price.amount);
	return Number.isFinite(decimal) && decimal >= 0 ? Math.round(decimal * 100) : null;
}

function readImages(rawImages, inconsistencies) {
	const images = Array.isArray(rawImages) ? rawImages : [];
	return images
		.map((value) => String(value || "").trim())
		.filter(Boolean)
		.filter((value) => {
			try {
				const hostname = new URL(value).hostname;
				if (hostname !== "res.cloudinary.com") {
					inconsistencies.push({ type: "legacy_image_host", value });
					return false;
				}
			} catch {
				// Local paths are valid catalog assets.
			}
			return true;
		})
		.slice(0, 8);
}

function getMetadata(raw) {
	return raw?.metadata && typeof raw.metadata === "object" ? raw.metadata : {};
}

function getPrices(raw) {
	if (Array.isArray(raw?.prices) && raw.prices.length) return raw.prices;
	if (raw?.default_price && typeof raw.default_price === "object") return [raw.default_price];
	if (raw?.unit_amount !== undefined || raw?.unitAmount !== undefined) return [raw];
	return [];
}

function buildCatalogProducts(input, inconsistencies) {
	const source = Array.isArray(input) ? input : input?.products;
	if (!Array.isArray(source)) throw new Error("O export precisa conter uma lista products.");
	const groups = new Map();

	for (const raw of source) {
		if (!raw || typeof raw !== "object") continue;
		const metadata = getMetadata(raw);
		const rawName = String(raw.name || metadata.productName || "").trim();
		if (!rawName) {
			inconsistencies.push({ type: "missing_product_name", id: raw.id ?? null });
			continue;
		}
		const slug = slugify(metadata.slug || raw.slug || rawName);
		if (!slug) {
			inconsistencies.push({ type: "missing_product_slug", id: raw.id ?? null });
			continue;
		}
		const group = groups.get(slug) || {
			id: `product_${slug}`,
			slug,
			name: String(metadata.productName || rawName),
			description: raw.description || metadata.description || null,
			images: readImages(raw.images, inconsistencies),
			category: null,
			stock: readStock(metadata.stock ?? raw.stock),
			productType: metadata.productType || raw.productType || null,
			format: metadata.format || raw.format || null,
			order: Number.isFinite(Number(metadata.order ?? raw.order))
				? Number(metadata.order ?? raw.order)
				: null,
			published: raw.active !== false && metadata.published !== "false",
			variants: [],
			productIds: new Set(),
			priceIds: new Set(),
		};
		const categoryName = String(metadata.category || raw.category || "").trim();
		if (categoryName) group.category = { name: categoryName, slug: slugify(categoryName) };
		if (raw.id) group.productIds.add(String(raw.id));

		const prices = getPrices(raw);
		if (!prices.length) inconsistencies.push({ type: "missing_price", id: raw.id ?? null, slug });
		for (const price of prices) {
			const amount = readMinorAmount(price);
			if (amount === null) {
				inconsistencies.push({ type: "invalid_price", id: price?.id ?? raw.id ?? null, slug });
				continue;
			}
			const priceMetadata = getMetadata(price);
			const label = String(
				priceMetadata.variantLabel ||
					priceMetadata.variant ||
					metadata.variantLabel ||
					metadata.variant ||
					"",
			).trim();
			const priceId = price?.id ? String(price.id) : null;
			if (priceId) group.priceIds.add(priceId);
			const variantKey = slugify(label || priceId || "default") || "default";
			const variantId = `variant_${slug}_${variantKey}`;
			if (group.variants.some((variant) => variant.id === variantId)) {
				inconsistencies.push({ type: "duplicate_variant", id: priceId, slug, variantId });
				continue;
			}
			group.variants.push({
				id: variantId,
				label: label || null,
				slug: label ? slugify(label) : null,
				description: raw.description || group.description,
				images: readImages(price?.images || raw.images, inconsistencies),
				price: amount,
				currency: String(price?.currency || price?.currency_id || raw.currency || "BRL").toUpperCase(),
				stock: readStock(priceMetadata.stock ?? metadata.stock ?? raw.stock),
				published: group.published && price?.active !== false,
				order: Number.isFinite(Number(priceMetadata.order)) ? Number(priceMetadata.order) : null,
				legacyProviderIds: { productId: raw.id ? String(raw.id) : null, priceId },
			});
		}
		groups.set(slug, group);
	}

	return Array.from(groups.values()).map((group) => ({
		id: group.id,
		slug: group.slug,
		name: group.name,
		description: group.description,
		images: group.images,
		category: group.category,
		stock: group.stock,
		productType: group.productType,
		format: group.format,
		order: group.order,
		published: group.published && group.variants.some((variant) => variant.published),
		variants: group.variants,
		legacyProviderIds: {
			productIds: Array.from(group.productIds),
			priceIds: Array.from(group.priceIds),
		},
	}));
}

async function readJson(file) {
	return JSON.parse(await fs.readFile(path.resolve(file), "utf8"));
}

async function exportCatalog(collection, file) {
	const rows = await collection.find({}).sort({ order: 1, name: 1 }).toArray();
	await fs.writeFile(path.resolve(file), `${JSON.stringify({ catalogProducts: rows }, null, 2)}\n`);
}

async function run() {
	const rollbackFile = valueFor("--rollback");
	const inputFile = valueFor("--input");
	const exportFile = valueFor("--export");
	const apply = hasFlag("--apply");
	if (hasFlag("--help")) {
		console.log("Uso: yarn migrate:catalog --input export.json [--dry-run|--apply] [--export snapshot.json]");
		console.log("Rollback: yarn migrate:catalog --rollback snapshot.json --apply");
		return;
	}
	if (!apply) console.log("[catalog-migration] dry-run: nenhuma escrita será feita");
	if (!rollbackFile && !inputFile)
		throw new Error("Informe --input export.json ou --rollback snapshot.json.");

	const client = new MongoClient(required("MONGODB_URI"), { serverSelectionTimeoutMS: 5000 });
	await client.connect();
	try {
		const collection = client.db(required("MONGODB_DB_NAME")).collection("catalogProducts");
		await collection.createIndex({ slug: 1 }, { unique: true });
		await collection.createIndex({ "variants.id": 1 }, { unique: true });

		if (exportFile) {
			await exportCatalog(collection, exportFile);
			console.log(`[catalog-migration] snapshot exported: ${exportFile}`);
		}

		if (rollbackFile) {
			const snapshot = await readJson(rollbackFile);
			const rows = Array.isArray(snapshot) ? snapshot : snapshot.catalogProducts;
			if (!Array.isArray(rows)) throw new Error("Snapshot inválido: catalogProducts ausente.");
			console.log(`[catalog-migration] rollback rows: ${rows.length}`);
			if (apply) {
				await collection.deleteMany({});
				if (rows.length) await collection.insertMany(rows);
			}
			return;
		}

		const inconsistencies = [];
		const products = buildCatalogProducts(await readJson(inputFile), inconsistencies);
		console.log(
			JSON.stringify(
				{
					products: products.length,
					variants: products.reduce((n, p) => n + p.variants.length, 0),
					inconsistencies,
				},
				null,
				2,
			),
		);
		if (!apply) return;
		const now = new Date();
		for (const product of products) {
			await collection.updateOne(
				{ slug: product.slug },
				{ $set: { ...product, updatedAt: now }, $setOnInsert: { createdAt: now } },
				{ upsert: true },
			);
		}
		console.log(`[catalog-migration] applied: ${products.length} products`);
	} finally {
		await client.close();
	}
}

run().catch((error) => {
	console.error("[catalog-migration] failed:", error instanceof Error ? error.message : error);
	process.exit(1);
});
