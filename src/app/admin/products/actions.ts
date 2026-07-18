"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { env } from "@/env.mjs";
import {
	productCoreSchema,
	productPricingSchema,
	variantPricingSchema,
	variantSchema,
} from "@/lib/admin-product-form-schema";
import {
	ensureProductPrice,
	getAdminStripeClient,
	getAdminStripeProductGroup,
	listAdminStripeProductGroups,
	parseBoolean,
	parseCurrencyCode,
	parseDisplayOrder,
	parseImageList,
	parseOptionalString,
	parsePriceAmount,
	updateProductsCategory,
} from "@/lib/admin-stripe-products";
import { requireCapability } from "@/lib/api-auth";
import { normalizeUserRole } from "@/lib/authz";
import { recordProductAuditEntry } from "@/lib/product-audit";
import {
	createSystemCategory,
	getSystemCategoryBySlugOrName,
	renameSystemCategory,
} from "@/lib/product-categories";
import { slugify } from "@/lib/utils";

type StripeCategoriesCacheGlobal = typeof globalThis & {
	__stripeCategoriesCache?: unknown;
};

const requireCatalogManagerSession = async () => {
	const auth = await requireCapability("catalog.write");
	if ("error" in auth) {
		if (auth.error?.status === 401) redirect("/login");
		redirect("/forbidden");
	}
	return auth.session;
};

const getRequiredString = (formData: FormData, key: string) => {
	const value = parseOptionalString(formData.get(key));
	if (!value) {
		throw new Error(`O campo ${key} é obrigatório.`);
	}
	return value;
};

const metadataValue = (value: string) => value.trim();
const adminCurrency = parseCurrencyCode(null, env.STRIPE_CURRENCY);

const parseSchema = <T>(schema: { parse: (input: unknown) => T }, input: unknown) => schema.parse(input);

const resolveCategoryName = async (formData: FormData) => {
	const selectedCategory = parseOptionalString(formData.get("category"));
	if (!selectedCategory) return "";
	const category = await getSystemCategoryBySlugOrName(selectedCategory);
	if (!category) {
		throw new Error("A categoria selecionada não existe no sistema.");
	}
	return category.name;
};

const resolveVariantAmount = ({
	group,
	formData,
	currency,
}: {
	group: NonNullable<Awaited<ReturnType<typeof getAdminStripeProductGroup>>>;
	formData: FormData;
	currency: string;
}) => {
	const priceMode = parseOptionalString(formData.get("priceMode")) || "inherit";
	const basePrice = parseOptionalString(formData.get("basePrice"));
	const groupBasePrice =
		typeof group.variants[0]?.priceDecimal === "number" ? group.variants[0].priceDecimal : null;

	if (priceMode === "override") {
		return parsePriceAmount(getRequiredString(formData, "priceOverride"), currency);
	}

	const inherited = basePrice || (typeof groupBasePrice === "number" ? String(groupBasePrice) : "");
	if (!inherited) {
		throw new Error("O preço do produto não está disponível.");
	}
	return parsePriceAmount(inherited, currency);
};

const refreshCatalog = () => {
	(globalThis as StripeCategoriesCacheGlobal).__stripeCategoriesCache = undefined;
	revalidatePath("/");
	revalidatePath("/products");
	revalidatePath("/search");
	revalidatePath("/admin/products");
};

const reorderStripeProductGroups = async ({
	stripe,
	targetSlug,
	targetOrder,
	excludeSlug,
}: {
	stripe: ReturnType<typeof getAdminStripeClient>;
	targetSlug: string;
	targetOrder: number;
	excludeSlug?: string;
}) => {
	const groups = await listAdminStripeProductGroups();
	const remaining = groups.filter((group) => group.slug !== excludeSlug && group.slug !== targetSlug);
	const boundedOrder = Math.min(Math.max(targetOrder, 1), remaining.length + 1);
	const ordered = [...remaining];
	const targetGroup = groups.find((group) => group.slug === targetSlug);
	if (targetGroup) {
		ordered.splice(boundedOrder - 1, 0, targetGroup);
	}

	await Promise.all(
		ordered.map((group, index) =>
			Promise.all(
				group.variants.map((variant) =>
					stripe.products.update(variant.id, {
						metadata: {
							variant: metadataValue(variant.variantLabel),
							category: metadataValue(group.category),
							slug: metadataValue(group.slug),
							stock: metadataValue(variant.stock),
							order: String(index + 1),
							variant_order: metadataValue(variant.variantOrder),
						},
					}),
				),
			),
		),
	);
};

export async function createStripeProductAction(formData: FormData) {
	const session = await requireCatalogManagerSession();
	const stripe = getAdminStripeClient();

	const name = getRequiredString(formData, "name");
	const core = parseSchema(productCoreSchema, {
		name: formData.get("name"),
		slug: formData.get("slug"),
		category: formData.get("category"),
		description: formData.get("description"),
		stock: formData.get("stock"),
		order: formData.get("order"),
	});
	const pricing = parseSchema(productPricingSchema, {
		price: formData.get("price"),
	});
	const slug = slugify(core.slug || name);
	const category = await resolveCategoryName(formData);
	const description = core.description;
	const images = parseImageList(formData.getAll("images"));
	const amount = parsePriceAmount(pricing.price, adminCurrency);
	const variant = parseOptionalString(formData.get("variant"));
	const variantOrder = parseOptionalString(formData.get("variantOrder"));
	const stock = core.stock;
	const order = core.order;
	const active = parseBoolean(formData.get("active"));

	const product = await stripe.products.create({
		name,
		description,
		images,
		active,
		metadata: {
			slug,
			category: metadataValue(category),
			stock: metadataValue(stock),
			order: metadataValue(order),
			variant: metadataValue(variant),
			variant_order: metadataValue(variantOrder),
		},
	});

	const price = await stripe.prices.create({
		product: product.id,
		unit_amount: amount,
		currency: adminCurrency,
	});
	await stripe.products.update(product.id, { default_price: price.id });
	await reorderStripeProductGroups({
		stripe,
		targetSlug: slug,
		targetOrder: parseDisplayOrder(order),
	});
	await recordProductAuditEntry({
		slug,
		action: "product_group_created",
		actorId: String(session.sub),
		actorRole: normalizeUserRole(session.role),
		actorEmail: session.email ?? null,
		productId: product.id,
		details: {
			name,
			category,
			order,
			variant: variant || null,
			active,
		},
		createdAt: new Date(),
	});

	refreshCatalog();
	redirect(`/admin/products/${encodeURIComponent(slug)}`);
}

export async function updateStripeProductGroupAction(formData: FormData) {
	const session = await requireCatalogManagerSession();
	const stripe = getAdminStripeClient();

	const currentSlug = getRequiredString(formData, "currentSlug");
	const group = await getAdminStripeProductGroup(currentSlug);
	if (!group) {
		throw new Error("Produto não encontrado no catálogo administrativo.");
	}

	const name = getRequiredString(formData, "name");
	const core = parseSchema(productCoreSchema, {
		name: formData.get("name"),
		slug: formData.get("slug"),
		category: formData.get("category"),
		description: formData.get("description"),
		stock: formData.get("stock"),
		order: formData.get("order"),
	});
	const nextSlug = slugify(core.slug || name);
	const category = await resolveCategoryName(formData);
	const description = core.description;
	const images = parseImageList(formData.getAll("images"));
	const stock = core.stock;
	const order = core.order;
	const active = parseBoolean(formData.get("active"));

	await Promise.all(
		group.variants.map((variant) =>
			stripe.products.update(variant.id, {
				name,
				description,
				images,
				active,
				metadata: {
					slug: nextSlug,
					category: metadataValue(category),
					stock: metadataValue(stock),
					order: metadataValue(order),
					variant: metadataValue(variant.variantLabel),
					variant_order: metadataValue(variant.variantOrder),
				},
			}),
		),
	);
	await reorderStripeProductGroups({
		stripe,
		targetSlug: nextSlug,
		targetOrder: parseDisplayOrder(order),
		excludeSlug: currentSlug !== nextSlug ? currentSlug : undefined,
	});
	await recordProductAuditEntry({
		slug: nextSlug,
		action: "product_group_updated",
		actorId: String(session.sub),
		actorRole: normalizeUserRole(session.role),
		actorEmail: session.email ?? null,
		details: {
			previousSlug: currentSlug,
			name,
			category,
			order,
			active,
			variantCount: group.variants.length,
		},
		createdAt: new Date(),
	});

	refreshCatalog();
	revalidatePath(`/product/${currentSlug}`);
	revalidatePath(`/product/${nextSlug}`);
	revalidatePath(`/category/${slugify(group.category)}`);
	revalidatePath(`/category/${slugify(category)}`);
	redirect(`/admin/products/${encodeURIComponent(nextSlug)}`);
}

export async function createStripeVariantAction(formData: FormData) {
	const session = await requireCatalogManagerSession();
	const stripe = getAdminStripeClient();

	const currentSlug = getRequiredString(formData, "currentSlug");
	const group = await getAdminStripeProductGroup(currentSlug);
	if (!group) {
		throw new Error("Produto não encontrado no catálogo administrativo.");
	}

	const slug = group.slug;
	const name = group.name;
	const category = group.category;
	const description = group.description;
	const images = group.images;
	const variantValues = parseSchema(variantSchema, {
		variant: formData.get("variant"),
		variantOrder: formData.get("variantOrder"),
		stock: formData.get("stock"),
	});
	parseSchema(variantPricingSchema, {
		priceMode: formData.get("priceMode"),
		priceOverride: formData.get("priceOverride"),
		basePrice: formData.get("basePrice"),
	});
	const amount = resolveVariantAmount({ group, formData, currency: adminCurrency });
	const variant = variantValues.variant;
	const variantOrder = variantValues.variantOrder;
	const stock = variantValues.stock;
	const order = group.order;
	const active = parseBoolean(formData.get("active"));

	const product = await stripe.products.create({
		name,
		description,
		images,
		active,
		metadata: {
			slug,
			category: metadataValue(category),
			stock: metadataValue(stock),
			order: metadataValue(order),
			variant: metadataValue(variant),
			variant_order: metadataValue(variantOrder),
		},
	});

	const price = await stripe.prices.create({
		product: product.id,
		unit_amount: amount,
		currency: adminCurrency,
	});
	await stripe.products.update(product.id, { default_price: price.id });
	await recordProductAuditEntry({
		slug,
		action: "product_variant_created",
		actorId: String(session.sub),
		actorRole: normalizeUserRole(session.role),
		actorEmail: session.email ?? null,
		productId: product.id,
		details: {
			variant,
			variantOrder,
			stock,
			active,
			currency: adminCurrency,
		},
		createdAt: new Date(),
	});

	refreshCatalog();
	revalidatePath(`/product/${slug}`);
	redirect(`/admin/products/${encodeURIComponent(slug)}`);
}

export async function updateStripeVariantAction(formData: FormData) {
	const session = await requireCatalogManagerSession();
	const stripe = getAdminStripeClient();

	const productId = getRequiredString(formData, "productId");
	const currentSlug = getRequiredString(formData, "currentSlug");
	const group = await getAdminStripeProductGroup(currentSlug);
	if (!group) {
		throw new Error("Produto não encontrado no catálogo administrativo.");
	}

	const name = group.name;
	const slug = group.slug;
	const category = group.category;
	const description = group.description;
	const images = group.images;
	const variantValues = parseSchema(variantSchema, {
		variant: formData.get("variant"),
		variantOrder: formData.get("variantOrder"),
		stock: formData.get("stock"),
	});
	parseSchema(variantPricingSchema, {
		priceMode: formData.get("priceMode"),
		priceOverride: formData.get("priceOverride"),
		basePrice: formData.get("basePrice"),
	});
	const variant = variantValues.variant;
	const variantOrder = variantValues.variantOrder;
	const stock = variantValues.stock;
	const order = group.order;
	const active = parseBoolean(formData.get("active"));

	const product = await stripe.products.update(productId, {
		name,
		description,
		images,
		active,
		metadata: {
			slug,
			category: metadataValue(category),
			stock: metadataValue(stock),
			order: metadataValue(order),
			variant: metadataValue(variant),
			variant_order: metadataValue(variantOrder),
		},
		expand: ["default_price"],
	});

	await ensureProductPrice({
		product,
		amount: resolveVariantAmount({ group, formData, currency: adminCurrency }),
		currency: adminCurrency,
	});
	await recordProductAuditEntry({
		slug,
		action: "product_variant_updated",
		actorId: String(session.sub),
		actorRole: normalizeUserRole(session.role),
		actorEmail: session.email ?? null,
		productId,
		details: {
			variant,
			variantOrder,
			stock,
			active,
			currency: adminCurrency,
		},
		createdAt: new Date(),
	});

	refreshCatalog();
	revalidatePath(`/product/${currentSlug}`);
	revalidatePath(`/product/${slug}`);
	redirect(`/admin/products/${encodeURIComponent(slug)}`);
}

export async function archiveStripeVariantAction(formData: FormData) {
	const session = await requireCatalogManagerSession();
	const stripe = getAdminStripeClient();
	const productId = getRequiredString(formData, "productId");
	const currentSlug = getRequiredString(formData, "currentSlug");

	await stripe.products.update(productId, { active: false });
	await recordProductAuditEntry({
		slug: currentSlug,
		action: "product_variant_archived",
		actorId: String(session.sub),
		actorRole: normalizeUserRole(session.role),
		actorEmail: session.email ?? null,
		productId,
		details: null,
		createdAt: new Date(),
	});

	refreshCatalog();
	revalidatePath(`/product/${currentSlug}`);
	redirect(`/admin/products/${encodeURIComponent(currentSlug)}`);
}

export async function renameStripeCategoryAction(formData: FormData) {
	await requireCatalogManagerSession();
	const oldCategory = getRequiredString(formData, "oldCategory");
	const newCategory = getRequiredString(formData, "newCategory");
	await renameSystemCategory(oldCategory, newCategory);
	await updateProductsCategory(oldCategory, newCategory);

	refreshCatalog();
	revalidatePath(`/category/${slugify(oldCategory)}`);
	revalidatePath(`/category/${slugify(newCategory)}`);
	redirect("/admin/products/categories");
}

export async function createSystemCategoryAction(formData: FormData) {
	await requireCatalogManagerSession();
	await createSystemCategory(getRequiredString(formData, "name"));
	refreshCatalog();
	redirect("/admin/products/categories");
}

export async function renameSystemCategoryAction(formData: FormData) {
	await requireCatalogManagerSession();
	await renameSystemCategory(
		getRequiredString(formData, "oldCategory"),
		getRequiredString(formData, "newCategory"),
	);
	refreshCatalog();
	redirect("/admin/products/categories");
}
