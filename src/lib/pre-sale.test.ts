import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicPresale } from "@/lib/presales";

// `vi.hoisted` so the mock factory (also hoisted) can safely close over the spy.
const { getPublicPresaleByProduct } = vi.hoisted(() => ({ getPublicPresaleByProduct: vi.fn() }));

vi.mock("@/lib/presales", () => ({
	getPublicPresaleByProduct,
	LFBF_PRODUCT_ID: "product_little-fish-big-fish",
}));

import {
	LFBF_CAMPAIGN,
	resolveCountdownTarget,
	resolvePreSaleAvailability,
	withPreSaleLaunchAt,
} from "@/lib/pre-sale";
import { getPreSaleCampaign, getPreSalePopupCampaign, isPreSaleModeEnabled } from "@/lib/pre-sale.server";

function fakePresale(overrides: Partial<PublicPresale> = {}): PublicPresale {
	return {
		productId: "product_little-fish-big-fish",
		variantId: "variant_little-fish-big-fish_impresso",
		launchAt: "2026-09-30T12:00:00.000Z",
		presalePrice: 2990,
		fullPrice: 4990,
		status: "no_ar",
		modalEnabled: true,
		modalIntervalHours: 2,
		modalTitle: "little fish, big fish está em pré-venda",
		modalBody: "Reserve agora com desconto.",
		...overrides,
	};
}

beforeEach(() => {
	getPublicPresaleByProduct.mockReset();
});

describe("modo de pré-venda", () => {
	it("usa a configuração persistida no backend", async () => {
		getPublicPresaleByProduct.mockResolvedValueOnce(fakePresale());
		expect(await isPreSaleModeEnabled()).toBe(true);
	});

	it("mantém a rota indisponível enquanto a pré-venda é rascunho", async () => {
		getPublicPresaleByProduct.mockResolvedValueOnce(fakePresale({ status: "rascunho" }));
		expect(await getPreSaleCampaign("little-fish-big-fish")).toBeNull();
	});

	it("retorna a campanha com preço e data quando a pré-venda está no ar", async () => {
		getPublicPresaleByProduct.mockResolvedValueOnce(fakePresale());
		const campaign = await getPreSaleCampaign("little-fish-big-fish");
		expect(campaign?.slug).toBe("little-fish-big-fish");
		expect(campaign?.variantId).toBe("variant_little-fish-big-fish_impresso");
	});

	it("permite modal global usando o intervalo configurado", async () => {
		getPublicPresaleByProduct.mockResolvedValueOnce(fakePresale({ modalIntervalHours: 6 }));
		const campaign = await getPreSalePopupCampaign();
		expect(campaign?.launchAt).toBe("2026-09-30T12:00:00.000Z");
		expect(campaign?.popup.snoozeHours).toBe(6);
	});

	it("não abre o modal sem pré-venda configurada", async () => {
		getPublicPresaleByProduct.mockResolvedValueOnce(null);
		expect(await getPreSalePopupCampaign()).toBeNull();

		getPublicPresaleByProduct.mockResolvedValueOnce(fakePresale({ status: "rascunho" }));
		expect(await getPreSalePopupCampaign()).toBeNull();
	});
});

describe("contagem regressiva", () => {
	it("mira a data de estreia quando ela é válida", () => {
		const dated = withPreSaleLaunchAt(LFBF_CAMPAIGN, "2026-09-30T12:00:00.000Z");
		expect(resolveCountdownTarget(dated)).toBe(Date.parse("2026-09-30T12:00:00.000Z"));
	});

	it("retorna null sem data de estreia (modal não conta nada)", () => {
		expect(resolveCountdownTarget(LFBF_CAMPAIGN)).toBeNull();
	});
});

describe("janela de pré-venda", () => {
	it("ativa cada canal dentro da janela", () => {
		const availability = resolvePreSaleAvailability(
			{
				pageEnabled: true,
				popupEnabled: true,
				windowStartAt: "2026-09-01T00:00:00.000Z",
				windowEndAt: "2026-09-30T00:00:00.000Z",
			},
			Date.parse("2026-09-15T00:00:00.000Z"),
		);
		expect(availability).toEqual({ pageActive: true, popupActive: true, inWindow: true });
	});

	it("falha fechado fora ou com janela inválida", () => {
		expect(
			resolvePreSaleAvailability(
				{
					pageEnabled: true,
					popupEnabled: true,
					windowStartAt: "2026-10-01T00:00:00.000Z",
					windowEndAt: "2026-09-01T00:00:00.000Z",
				},
				Date.parse("2026-09-15T00:00:00.000Z"),
			),
		).toEqual({ pageActive: false, popupActive: false, inWindow: false });
	});

	it("aplica somente uma data de estreia válida", () => {
		expect(withPreSaleLaunchAt(LFBF_CAMPAIGN, "2026-09-30T12:00:00.000Z").launchAt).toBe(
			"2026-09-30T12:00:00.000Z",
		);
		expect(withPreSaleLaunchAt(LFBF_CAMPAIGN, "inválida")).toBe(LFBF_CAMPAIGN);
	});
});
