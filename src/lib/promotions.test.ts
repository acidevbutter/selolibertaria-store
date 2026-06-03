// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import type { Product } from "@/lib/commerce-types";

vi.mock("server-only", () => ({}));

import { applyAutomaticPromotionsToProduct, type PromotionDoc, priceCartLines } from "@/lib/promotions";

describe("promotions", () => {
	it("aplica a melhor promoção automática na variante", () => {
		const product: Product = {
			id: "prod_1",
			name: "Produto",
			images: [],
			slug: "produto",
			price: 10000,
			currency: "BRL",
			variants: [
				{
					id: "price_1",
					price: 10000,
					currency: "BRL",
					productId: "prod_1",
				},
			],
		};
		const promotions: PromotionDoc[] = [
			{
				_id: undefined,
				name: "10%",
				status: "active",
				kind: "automatic",
				scope: "item",
				benefitType: "percentage_off",
				benefitValue: 10,
				targets: { productSlugs: ["produto"] },
				createdAt: new Date(),
				updatedAt: new Date(),
				version: 1,
			},
			{
				_id: undefined,
				name: "R$ 20",
				status: "active",
				kind: "automatic",
				scope: "item",
				benefitType: "fixed_amount_off",
				benefitValue: 2000,
				targets: { productSlugs: ["produto"] },
				createdAt: new Date(),
				updatedAt: new Date(),
				version: 1,
			},
		];

		const priced = applyAutomaticPromotionsToProduct(product, promotions);
		expect(priced.variants?.[0]?.price).toBe(8000);
		expect(priced.variants?.[0]?.pricing?.basePrice).toBe(10000);
		expect(priced.variants?.[0]?.pricing?.discountAmount).toBe(2000);
	});

	it("mantém subtotal base e total final consistentes", async () => {
		const priced = await priceCartLines({
			lines: [
				{
					item: {
						id: "price_1",
						productId: "prod_1",
						variantId: "price_1",
						quantity: 2,
						price: 8000,
						product: { id: "prod_1", name: "Produto", images: [] },
						basePrice: 10000,
						finalPrice: 8000,
						lineBaseTotal: 20000,
						lineDiscountTotal: 4000,
						lineFinalTotal: 16000,
						appliedPromotions: [
							{
								label: "Promo",
								kind: "automatic",
								discountAmount: 4000,
								currency: "BRL",
							},
						],
					},
					productSlug: "produto",
					categorySlug: "camisetas",
					baseUnitAmount: 10000,
					effectiveUnitAmount: 8000,
					currency: "BRL",
				},
			],
		});

		expect(priced.subtotal).toBe(20000);
		expect(priced.discountTotal).toBe(4000);
		expect(priced.total).toBe(16000);
	});
});
