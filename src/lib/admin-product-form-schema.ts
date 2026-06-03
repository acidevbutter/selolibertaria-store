import { z } from "zod";

const kebabCaseRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const integerStringRegex = /^\d+$/;
const decimalStringRegex = /^\d+(?:[.,]\d+)?$/;
const currencyRegex = /^[a-zA-Z]{3}$/;

const optionalTrimmedString = z.preprocess(
	(value) => {
		if (typeof value === "string") return value;
		if (value == null) return "";
		return value;
	},
	z
		.string()
		.transform((value) => value.trim())
		.optional()
		.default(""),
);

export const productSlugSchema = z
	.string()
	.trim()
	.min(1, "Slug is required.")
	.regex(kebabCaseRegex, "Slug must use kebab-case, for example camiseta-preta.");

export const productNameSchema = z.string().trim().min(2, "Name is required.");

export const categorySelectionSchema = z.string().trim().min(1, "Category is required.");

export const descriptionSchema = optionalTrimmedString;

export const imageUrlListSchema = z
	.array(z.string().trim().url("Each image must be a valid URL."))
	.max(8, "You can add up to 8 images.")
	.default([]);

export const stockSchema = z
	.string()
	.trim()
	.refine((value) => value === "" || integerStringRegex.test(value), "Stock must be a whole number.")
	.transform((value) => value.trim());

export const orderSchema = z
	.string()
	.trim()
	.refine((value) => value === "" || decimalStringRegex.test(value), "Display order must be a valid number.")
	.transform((value) => value.trim());

export const priceSchema = z
	.string()
	.trim()
	.min(1, "Price is required.")
	.refine((value) => decimalStringRegex.test(value), "Price must be a valid positive number.");

export const currencySchema = z
	.string()
	.trim()
	.min(1, "Currency is required.")
	.regex(currencyRegex, "Currency must be a valid 3-letter code, such as usd or brl.");

export const variantLabelSchema = optionalTrimmedString;

export const variantOrderSchema = z
	.string()
	.trim()
	.refine((value) => value === "" || decimalStringRegex.test(value), "Variant order must be a valid number.")
	.transform((value) => value.trim());

export const productCoreSchema = z.object({
	name: productNameSchema,
	slug: z
		.string()
		.trim()
		.optional()
		.default("")
		.refine((value) => value === "" || kebabCaseRegex.test(value), {
			message: "Slug must use kebab-case, for example camiseta-preta.",
		}),
	category: categorySelectionSchema,
	description: descriptionSchema,
	stock: stockSchema,
	order: orderSchema,
});

export const productPricingSchema = z.object({
	price: priceSchema,
	currency: currencySchema,
});

export const variantSchema = z.object({
	variant: variantLabelSchema,
	variantOrder: variantOrderSchema,
	stock: stockSchema,
});

export const variantPricingSchema = z
	.object({
		priceMode: z.enum(["inherit", "override"]).default("inherit"),
		priceOverride: optionalTrimmedString,
		basePrice: optionalTrimmedString,
		currency: currencySchema,
	})
	.superRefine((value, ctx) => {
		if (value.priceMode === "override" && !decimalStringRegex.test(value.priceOverride)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["priceOverride"],
				message: "Custom price must be a valid positive number.",
			});
		}
	});

export const fieldPatterns = {
	kebabCase: kebabCaseRegex.source,
	integer: integerStringRegex.source,
	decimal: decimalStringRegex.source,
	currency: currencyRegex.source,
};
