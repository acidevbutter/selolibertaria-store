import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
	catalogProductId,
	catalogVariantId,
	deterministicCatalogId,
	normalizeCatalogProductDocument,
	normalizeCatalogStock,
} from "@/lib/catalog";

describe("catalog Mongo contract", () => {
	it("creates stable internal product and variant ids", () => {
		expect(catalogProductId("Virus do Beijo")).toBe("product_virus-do-beijo");
		expect(catalogVariantId("virus-do-beijo", "Impresso")).toBe("variant_virus-do-beijo_impresso");
		expect(deterministicCatalogId("prod_123:price_123", "variant")).toMatch(/^variant_[a-f0-9]{20}$/);
	});

	it("normalizes stock and removes unpublished variants from public reads", () => {
		const normalized = normalizeCatalogProductDocument({
			id: "product_book",
			slug: "book",
			name: "Book",
			description: null,
			images: ["https://res.cloudinary.com/demo/image/upload/book.jpg"],
			stock: "4" as unknown as number,
			published: true,
			variants: [
				{
					id: "variant_public",
					label: "Impresso",
					images: [],
					price: 4200,
					currency: "brl",
					stock: "2" as unknown as number,
					published: true,
				},
				{
					id: "variant_hidden",
					images: [],
					price: 0,
					currency: "BRL",
					published: false,
				},
			],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		expect(normalized.stock).toBe(4);
		expect(normalized.variants).toHaveLength(1);
		expect(normalized.variants[0]).toMatchObject({ currency: "BRL", stock: 2 });
	});

	it("rejects invalid or negative stock values", () => {
		expect(normalizeCatalogStock("-1")).toBeNull();
		expect(normalizeCatalogStock("not-a-number")).toBeNull();
		expect(normalizeCatalogStock(3)).toBe(3);
	});
});
