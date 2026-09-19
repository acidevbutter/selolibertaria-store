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

export const EDITORIAL_BLOCK_COLUMNS = ["left", "right"] as const;
export type EditorialBlockColumn = (typeof EDITORIAL_BLOCK_COLUMNS)[number];

/** Every node can sit at full row width or share a row with the next
 *  half-width node, and carries admin-editor-only grouping metadata -- spread
 *  into each schema below (mirrors DocumentNode's shared fields on the
 *  backend, since zod has no schema inheritance as clean as a shared Python
 *  base class). `section`/`row`/`column` are read only by the block editor's
 *  own canvas/preview, never by the storefront: `section` labels a divider
 *  header, `row` groups blocks sharing the same id into one row split into
 *  stacked `column`s -- a flat-list alternative to a nested "row" node type. */
const groupFields = {
	width: z.enum(EDITORIAL_BLOCK_WIDTHS).nullable().optional(),
	section: z.string().nullable().optional(),
	row: z.string().nullable().optional(),
	column: z.enum(EDITORIAL_BLOCK_COLUMNS).nullable().optional(),
};

const headingBlockSchema = z.object({
	id: z.string(),
	type: z.literal("heading"),
	...groupFields,
	level: z.union([z.literal(2), z.literal(3)]),
	text: z.string(),
});

const paragraphBlockSchema = z.object({
	id: z.string(),
	type: z.literal("paragraph"),
	...groupFields,
	text: z.string(),
});

const listBlockSchema = z.object({
	id: z.string(),
	type: z.literal("list"),
	...groupFields,
	style: z.enum(["bullet", "number"]),
	items: z.array(z.string()),
});

const quoteBlockSchema = z.object({
	id: z.string(),
	type: z.literal("quote"),
	...groupFields,
	text: z.string(),
	attribution: z.string().nullable().optional(),
});

const highlightBlockSchema = z.object({
	id: z.string(),
	type: z.literal("highlight"),
	...groupFields,
	text: z.string(),
});

const imageBlockSchema = z.object({
	id: z.string(),
	type: z.literal("image"),
	...groupFields,
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
	...groupFields,
	images: z.array(galleryImageSchema),
});

const buttonBlockSchema = z.object({
	id: z.string(),
	type: z.literal("button"),
	...groupFields,
	label: z.string(),
	href: z.string(),
	variant: z.enum(["primary", "secondary"]).nullable().optional(),
});

const dividerBlockSchema = z.object({
	id: z.string(),
	type: z.literal("divider"),
	...groupFields,
});

const productShelfBlockSchema = z.object({
	id: z.string(),
	type: z.literal("productShelf"),
	...groupFields,
	title: z.string().nullable().optional(),
	productSlugs: z.array(z.string()),
});

const agendaBlockSchema = z.object({
	id: z.string(),
	type: z.literal("agenda"),
	...groupFields,
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

/** The visible sub-rectangle of a photo, in percent of the photo's displayed (cover-fit) size. */
export type EditorialCropRect = { ratio: string; left: number; top: number; width: number; height: number };

const CROP_ID_PATTERN = /^(\d+)x(\d+)-(-?\d+)-(-?\d+)-(\d+)-(\d+)$/;

/** Inverse of `encodeCropId` -- both live here so the crop UI and every renderer read the same shape. */
export function encodeCropId(ratio: string, rect: Omit<EditorialCropRect, "ratio">): string {
	return `${ratio.replace("/", "x")}-${Math.round(rect.left)}-${Math.round(rect.top)}-${Math.round(rect.width)}-${Math.round(rect.height)}`;
}

export function decodeCropId(cropId: string | null | undefined): EditorialCropRect | null {
	if (!cropId) return null;
	const match = CROP_ID_PATTERN.exec(cropId);
	if (!match) return null;
	const [, ratioW, ratioH, left, top, width, height] = match;
	return {
		ratio: `${ratioW}/${ratioH}`,
		left: Number(left),
		top: Number(top),
		width: Number(width),
		height: Number(height),
	};
}

/**
 * CSS for an <img> that fills a `{ratio}`-shaped, `overflow: hidden` box with
 * exactly the `rect` sub-region of the photo: the image is scaled up by the
 * inverse of the rect's own size and shifted so that region lands in view.
 * No distortion -- the math cancels back to the photo's own displayed size.
 */
export function cropWindowStyle(rect: Omit<EditorialCropRect, "ratio">): {
	width: string;
	height: string;
	left: string;
	top: string;
} {
	return {
		width: `${10000 / rect.width}%`,
		height: `${10000 / rect.height}%`,
		left: `${(-rect.left / rect.width) * 100}%`,
		top: `${(-rect.top / rect.height) * 100}%`,
	};
}
