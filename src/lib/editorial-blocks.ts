import { z } from "zod";

/**
 * Structured content-node schema for fatia 02 (editor de blocos). Mirrors the
 * backend's closed list 1:1 (app/editorial `contentDoc` column) so a 12th
 * node type can't silently exist on one side only. Never render this as raw
 * HTML -- see editorial-blocks-renderer.tsx, which maps each type to a
 * design-system component instead of dangerouslySetInnerHTML.
 */
export const EDITORIAL_BLOCK_TYPES = [
	"heading",
	"paragraph",
	"list",
	"quote",
	"highlight",
	"image",
	"gallery",
	"button",
	"divider",
	"productShelf",
	"agenda",
] as const;

export type EditorialBlockType = (typeof EDITORIAL_BLOCK_TYPES)[number];

export const EDITORIAL_IMAGE_LAYOUTS = ["wide", "side", "center", "gallery"] as const;
export type EditorialImageLayout = (typeof EDITORIAL_IMAGE_LAYOUTS)[number];

export const EDITORIAL_BLOCK_WIDTHS = ["full", "half"] as const;
export type EditorialBlockWidth = (typeof EDITORIAL_BLOCK_WIDTHS)[number];

/** Every node can sit at full row width or share a row with the next
 *  half-width node -- spread into each schema below (mirrors DocumentNode's
 *  shared `width` field on the backend, since zod has no schema inheritance
 *  as clean as a shared Python base class). */
const widthField = { width: z.enum(EDITORIAL_BLOCK_WIDTHS).nullable().optional() };

const headingBlockSchema = z.object({
	id: z.string(),
	type: z.literal("heading"),
	...widthField,
	level: z.union([z.literal(2), z.literal(3)]),
	text: z.string(),
});

const paragraphBlockSchema = z.object({
	id: z.string(),
	type: z.literal("paragraph"),
	...widthField,
	text: z.string(),
});

const listBlockSchema = z.object({
	id: z.string(),
	type: z.literal("list"),
	...widthField,
	style: z.enum(["bullet", "number"]),
	items: z.array(z.string()),
});

const quoteBlockSchema = z.object({
	id: z.string(),
	type: z.literal("quote"),
	...widthField,
	text: z.string(),
	attribution: z.string().nullable().optional(),
});

const highlightBlockSchema = z.object({
	id: z.string(),
	type: z.literal("highlight"),
	...widthField,
	text: z.string(),
});

const imageBlockSchema = z.object({
	id: z.string(),
	type: z.literal("image"),
	...widthField,
	assetId: z.string(),
	cropId: z.string().nullable().optional(),
	/** Resolved by whoever serializes the doc (backend on publish, admin preview on the fly) -- the renderer never resolves assetId itself. */
	src: z.string(),
	layout: z.enum(EDITORIAL_IMAGE_LAYOUTS),
	align: z.enum(["left", "right"]).nullable().optional(),
	caption: z.string().nullable().optional(),
	/** Photographer/source attribution -- distinct from the reader-facing caption, rendered smaller/separately. */
	credit: z.string().nullable().optional(),
	href: z.string().nullable().optional(),
	alt: z.string().nullable().optional(),
});

const galleryImageSchema = z.object({
	assetId: z.string(),
	cropId: z.string().nullable().optional(),
	src: z.string(),
	caption: z.string().nullable().optional(),
	credit: z.string().nullable().optional(),
	alt: z.string().nullable().optional(),
});

const galleryBlockSchema = z.object({
	id: z.string(),
	type: z.literal("gallery"),
	...widthField,
	images: z.array(galleryImageSchema),
});

const buttonBlockSchema = z.object({
	id: z.string(),
	type: z.literal("button"),
	...widthField,
	label: z.string(),
	href: z.string(),
	variant: z.enum(["primary", "secondary"]).nullable().optional(),
});

const dividerBlockSchema = z.object({
	id: z.string(),
	type: z.literal("divider"),
	...widthField,
});

const productShelfBlockSchema = z.object({
	id: z.string(),
	type: z.literal("productShelf"),
	...widthField,
	title: z.string().nullable().optional(),
	productSlugs: z.array(z.string()),
});

const agendaBlockSchema = z.object({
	id: z.string(),
	type: z.literal("agenda"),
	...widthField,
	title: z.string().nullable().optional(),
	eventSlugs: z.array(z.string()),
});

export const editorialBlockSchema = z.discriminatedUnion("type", [
	headingBlockSchema,
	paragraphBlockSchema,
	listBlockSchema,
	quoteBlockSchema,
	highlightBlockSchema,
	imageBlockSchema,
	galleryBlockSchema,
	buttonBlockSchema,
	dividerBlockSchema,
	productShelfBlockSchema,
	agendaBlockSchema,
]);

export type EditorialBlock = z.infer<typeof editorialBlockSchema>;
export type EditorialImageBlock = z.infer<typeof imageBlockSchema>;
export type EditorialGalleryBlock = z.infer<typeof galleryBlockSchema>;

export const editorialContentDocSchema = z.array(editorialBlockSchema);
export type EditorialContentDoc = z.infer<typeof editorialContentDocSchema>;

export function isEditorialBlockType(value: unknown): value is EditorialBlockType {
	return typeof value === "string" && (EDITORIAL_BLOCK_TYPES as readonly string[]).includes(value);
}

/** Parses unknown JSON into a content doc, or returns null -- never throws. Used wherever a doc is read from storage/network. */
export function parseEditorialContentDoc(value: unknown): EditorialContentDoc | null {
	const result = editorialContentDocSchema.safeParse(value);
	return result.success ? result.data : null;
}
