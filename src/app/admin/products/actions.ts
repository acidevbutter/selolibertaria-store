"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
	productCoreSchema,
	productPricingSchema,
	variantPricingSchema,
	variantSchema,
} from "@/lib/admin-product-form-schema";
import {
	getAdminProductGroup,
	getCatalogCurrency,
	listAdminProductGroups,
	parseBoolean,
	parseCurrencyCode,
	parseDisplayOrder,
	parseImageList,
	parseOptionalString,
	parsePriceAmount,
	updateProductsCategory,
} from "@/lib/admin-products";
import { requireCapability } from "@/lib/api-auth";
import { normalizeUserRole } from "@/lib/authz";
import {
	type CatalogProductDocument,
	catalogProductId,
	catalogVariantId,
	getCatalogCollection,
	getCatalogProductBySlug,
} from "@/lib/catalog";
import { recordProductAuditEntry } from "@/lib/product-audit";
import {
	createSystemCategory,
	getSystemCategoryBySlugOrName,
	renameSystemCategory,
} from "@/lib/product-categories";
import { slugify } from "@/lib/utils";

const requireCatalogManagerSession = async () => {
	const auth = await requireCapability("catalog.write");
	if ("error" in auth) {
		if (auth.error?.status === 401) redirect("/login");
		redirect("/forbidden");
	}
	return auth.session;
};

const required = (formData: FormData, key: string) => {
	const value = parseOptionalString(formData.get(key));
	if (!value) throw new Error(`O campo ${key} é obrigatório.`);
	return value;
};

const parseSchema = <T>(schema: { parse: (input: unknown) => T }, input: unknown) => schema.parse(input);

async function resolveCategoryName(formData: FormData) {
	const selected = parseOptionalString(formData.get("category"));
	if (!selected) return "";
	const category = await getSystemCategoryBySlugOrName(selected);
	if (!category) throw new Error("A categoria selecionada não existe no sistema.");
	return category.name;
}

function refreshCatalog() {
	revalidatePath("/");
	revalidatePath("/products");
	revalidatePath("/search");
	revalidatePath("/admin/products");
}

function parseProductFields(formData: FormData) {
	const core = parseSchema(productCoreSchema, {
		name: formData.get("name"),
		slug: formData.get("slug"),
		category: formData.get("category"),
		description: formData.get("description"),
		stock: formData.get("stock"),
		order: formData.get("order"),
		productType: formData.get("productType"),
		format: formData.get("format"),
	});
	return {
		...core,
		slug: slugify(core.slug || core.name),
		productType: parseOptionalString(formData.get("productType")) || null,
		format: parseOptionalString(formData.get("format")) || null,
		images: parseImageList(formData.getAll("images")),
		published: parseBoolean(formData.get("active")),
		stock: core.stock ? Number.parseInt(core.stock, 10) : null,
		order: core.order ? Number.parseFloat(core.order.replace(",", ".")) : null,
	};
}

function parseVariantFields(formData: FormData) {
	const values = parseSchema(variantSchema, {
		variant: formData.get("variant"),
		variantOrder: formData.get("variantOrder"),
		stock: formData.get("stock"),
	});
	return {
		label: values.variant || null,
		order: values.variantOrder ? Number.parseFloat(values.variantOrder.replace(",", ".")) : null,
		stock: values.stock ? Number.parseInt(values.stock, 10) : null,
		published: parseBoolean(formData.get("active")),
	};
}

function resolveVariantAmount({
	group,
	formData,
	currency,
}: {
	group: NonNullable<Awaited<ReturnType<typeof getAdminProductGroup>>>;
	formData: FormData;
	currency: string;
}) {
	const priceMode = parseOptionalString(formData.get("priceMode")) || "inherit";
	if (priceMode === "override") return parsePriceAmount(required(formData, "priceOverride"), currency);
	const basePrice = parseOptionalString(formData.get("basePrice"));
	if (basePrice) return parsePriceAmount(basePrice, currency);
	const inherited = group.variants[0]?.priceDecimal;
	if (typeof inherited !== "number") throw new Error("O preço do produto não está disponível.");
	return parsePriceAmount(String(inherited), currency);
}

async function reorderProductGroups(targetSlug: string, targetOrder: number, excludeSlug?: string) {
	const groups = await listAdminProductGroups();
	const remaining = groups.filter((group) => group.slug !== excludeSlug && group.slug !== targetSlug);
	const boundedOrder = Math.min(Math.max(targetOrder, 1), remaining.length + 1);
	const ordered = [...remaining];
	const target = groups.find((group) => group.slug === targetSlug);
	if (target) ordered.splice(boundedOrder - 1, 0, target);
	const products = await getCatalogCollection();
	await Promise.all(
		ordered.map((group, index) =>
			products.updateOne({ slug: group.slug }, { $set: { order: index + 1, updatedAt: new Date() } }),
		),
	);
}

export async function createProductAction(formData: FormData) {
	const session = await requireCatalogManagerSession();
	const fields = parseProductFields(formData);
	const category = await resolveCategoryName(formData);
	const pricing = parseSchema(productPricingSchema, { price: formData.get("price") });
	const currency = parseCurrencyCode(null, getCatalogCurrency());
	const variantLabel = parseOptionalString(formData.get("variant")) || null;
	const variantOrder = parseOptionalString(formData.get("variantOrder"));
	const productId = catalogProductId(fields.slug);
	const variantId = catalogVariantId(fields.slug, variantLabel);
	const now = new Date();
	const product: CatalogProductDocument = {
		id: productId,
		slug: fields.slug,
		name: fields.name,
		description: fields.description || null,
		images: fields.images,
		category: category ? { name: category, slug: slugify(category) } : null,
		stock: fields.stock,
		productType: fields.productType,
		format: fields.format,
		order: fields.order,
		published: fields.published,
		variants: [
			{
				id: variantId,
				label: variantLabel,
				slug: variantLabel ? slugify(variantLabel) : null,
				description: fields.description || null,
				images: fields.images,
				price: parsePriceAmount(pricing.price, currency),
				currency,
				stock: fields.stock,
				published: fields.published,
				order: variantOrder ? Number.parseFloat(variantOrder.replace(",", ".")) : null,
			},
		],
		createdAt: now,
		updatedAt: now,
	};
	await getCatalogCollection().then((products) => products.insertOne(product));
	await reorderProductGroups(fields.slug, parseDisplayOrder(fields.order));
	await recordProductAuditEntry({
		slug: fields.slug,
		action: "product_group_created",
		actorId: String(session.sub),
		actorRole: normalizeUserRole(session.role),
		actorEmail: session.email ?? null,
		productId,
		details: { name: fields.name, category, order: fields.order, active: fields.published },
		createdAt: new Date(),
	});
	refreshCatalog();
	redirect(`/admin/products/${encodeURIComponent(fields.slug)}`);
}

export async function updateProductGroupAction(formData: FormData) {
	const session = await requireCatalogManagerSession();
	const currentSlug = required(formData, "currentSlug");
	const existing = await getCatalogProductBySlug(currentSlug);
	if (!existing) throw new Error("Produto não encontrado no catálogo administrativo.");
	const fields = parseProductFields(formData);
	const category = await resolveCategoryName(formData);
	const products = await getCatalogCollection();
	const nextVariants = existing.variants.map((variant) => ({
		...variant,
		images: fields.images,
		description: fields.description || null,
		published: fields.published && variant.published,
	}));
	await products.updateOne(
		{ _id: existing._id },
		{
			$set: {
				id: existing.id,
				slug: fields.slug,
				name: fields.name,
				description: fields.description || null,
				images: fields.images,
				category: category ? { name: category, slug: slugify(category) } : null,
				stock: fields.stock,
				productType: fields.productType,
				format: fields.format,
				order: fields.order,
				published: fields.published,
				variants: nextVariants,
				updatedAt: new Date(),
			},
		},
	);
	await reorderProductGroups(
		fields.slug,
		parseDisplayOrder(fields.order),
		currentSlug !== fields.slug ? currentSlug : undefined,
	);
	await recordProductAuditEntry({
		slug: fields.slug,
		action: "product_group_updated",
		actorId: String(session.sub),
		actorRole: normalizeUserRole(session.role),
		actorEmail: session.email ?? null,
		productId: existing.id,
		details: { previousSlug: currentSlug, name: fields.name, category, active: fields.published },
		createdAt: new Date(),
	});
	refreshCatalog();
	revalidatePath(`/product/${currentSlug}`);
	revalidatePath(`/product/${fields.slug}`);
	redirect(`/admin/products/${encodeURIComponent(fields.slug)}`);
}

export async function createVariantAction(formData: FormData) {
	const session = await requireCatalogManagerSession();
	const currentSlug = required(formData, "currentSlug");
	const group = await getAdminProductGroup(currentSlug);
	const product = await getCatalogProductBySlug(currentSlug);
	if (!group || !product) throw new Error("Produto não encontrado no catálogo administrativo.");
	const values = parseVariantFields(formData);
	parseSchema(variantPricingSchema, {
		priceMode: formData.get("priceMode"),
		priceOverride: formData.get("priceOverride"),
		basePrice: formData.get("basePrice"),
	});
	const currency = parseCurrencyCode(null, group.variants[0]?.currency || "BRL");
	const id = catalogVariantId(product.slug, values.label, `variant-${product.variants.length + 1}`);
	const variant = {
		id,
		label: values.label,
		slug: values.label ? slugify(values.label) : id,
		description: product.description ?? null,
		images: product.images,
		price: resolveVariantAmount({ group, formData, currency }),
		currency,
		stock: values.stock,
		published: values.published,
		order: values.order,
	};
	await getCatalogCollection().then((products) =>
		products.updateOne(
			{ _id: product._id },
			{ $push: { variants: variant }, $set: { updatedAt: new Date() } },
		),
	);
	await recordProductAuditEntry({
		slug: currentSlug,
		action: "product_variant_created",
		actorId: String(session.sub),
		actorRole: normalizeUserRole(session.role),
		actorEmail: session.email ?? null,
		productId: id,
		details: { variant: values.label, stock: values.stock, active: values.published, currency },
		createdAt: new Date(),
	});
	refreshCatalog();
	redirect(`/admin/products/${encodeURIComponent(currentSlug)}`);
}

export async function updateVariantAction(formData: FormData) {
	const session = await requireCatalogManagerSession();
	const variantId = required(formData, "productId");
	const currentSlug = required(formData, "currentSlug");
	const group = await getAdminProductGroup(currentSlug);
	if (!group) throw new Error("Produto não encontrado no catálogo administrativo.");
	const values = parseVariantFields(formData);
	parseSchema(variantPricingSchema, {
		priceMode: formData.get("priceMode"),
		priceOverride: formData.get("priceOverride"),
		basePrice: formData.get("basePrice"),
	});
	const currency = parseCurrencyCode(null, group.variants[0]?.currency || "BRL");
	const products = await getCatalogCollection();
	await products.updateOne(
		{ slug: currentSlug, "variants.id": variantId },
		{
			$set: {
				"variants.$.label": values.label,
				"variants.$.slug": values.label ? slugify(values.label) : variantId,
				"variants.$.stock": values.stock,
				"variants.$.published": values.published,
				"variants.$.order": values.order,
				"variants.$.price": resolveVariantAmount({ group, formData, currency }),
				"variants.$.currency": currency,
				updatedAt: new Date(),
			},
		},
	);
	await recordProductAuditEntry({
		slug: currentSlug,
		action: "product_variant_updated",
		actorId: String(session.sub),
		actorRole: normalizeUserRole(session.role),
		actorEmail: session.email ?? null,
		productId: variantId,
		details: { variant: values.label, stock: values.stock, active: values.published, currency },
		createdAt: new Date(),
	});
	refreshCatalog();
	redirect(`/admin/products/${encodeURIComponent(currentSlug)}`);
}

export async function archiveVariantAction(formData: FormData) {
	const session = await requireCatalogManagerSession();
	const variantId = required(formData, "productId");
	const currentSlug = required(formData, "currentSlug");
	await (await getCatalogCollection()).updateOne(
		{ slug: currentSlug, "variants.id": variantId },
		{ $set: { "variants.$.published": false, updatedAt: new Date() } },
	);
	await recordProductAuditEntry({
		slug: currentSlug,
		action: "product_variant_archived",
		actorId: String(session.sub),
		actorRole: normalizeUserRole(session.role),
		actorEmail: session.email ?? null,
		productId: variantId,
		details: null,
		createdAt: new Date(),
	});
	refreshCatalog();
	redirect(`/admin/products/${encodeURIComponent(currentSlug)}`);
}

export async function renameProductCategoryAction(formData: FormData) {
	await requireCatalogManagerSession();
	const oldCategory = required(formData, "oldCategory");
	const newCategory = required(formData, "newCategory");
	await renameSystemCategory(oldCategory, newCategory);
	await updateProductsCategory(oldCategory, newCategory);
	refreshCatalog();
	revalidatePath(`/category/${slugify(oldCategory)}`);
	revalidatePath(`/category/${slugify(newCategory)}`);
	redirect("/admin/products/categories");
}

export async function createSystemCategoryAction(formData: FormData) {
	await requireCatalogManagerSession();
	await createSystemCategory(required(formData, "name"));
	refreshCatalog();
	redirect("/admin/products/categories");
}

export async function renameSystemCategoryAction(formData: FormData) {
	await requireCatalogManagerSession();
	await renameSystemCategory(required(formData, "oldCategory"), required(formData, "newCategory"));
	refreshCatalog();
	redirect("/admin/products/categories");
}
