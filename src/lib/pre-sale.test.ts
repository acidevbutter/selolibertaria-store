// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";
import { LFBF_CAMPAIGN } from "@/lib/pre-sale";

async function loadWithFetch(fetchImpl: typeof fetch) {
	vi.resetModules();
	vi.stubGlobal("fetch", fetchImpl);
	return import("@/lib/pre-sale.server");
}

function presalePublicResponse(overrides: Record<string, unknown> = {}) {
	return Response.json({
		product_id: "product_little-fish-big-fish",
		variant_id: "variant_little-fish-big-fish_impresso",
		launch_at: "2026-10-14T19:00:00Z",
		presale_price: "5760",
		full_price: "7200",
		status: "no_ar",
		modal_enabled: true,
		modal_interval_hours: 2,
		modal_title: "little fish, big fish está em pré-venda",
		modal_body: "Reserve agora com desconto.",
		...overrides,
	});
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("modo de pré-venda (backend real)", () => {
	it("está desligado quando não existe pré-venda para o produto", async () => {
		const { isPreSaleModeEnabled, getPreSaleCampaign } = await loadWithFetch(
			vi.fn(async () => Response.json(null)),
		);
		expect(await isPreSaleModeEnabled()).toBe(false);
		expect(await getPreSaleCampaign("little-fish-big-fish")).toBeNull();
	});

	it("está desligado enquanto a pré-venda é só rascunho", async () => {
		const { isPreSaleModeEnabled, getPreSaleCampaign } = await loadWithFetch(
			vi.fn(async () => presalePublicResponse({ status: "rascunho" })),
		);
		expect(await isPreSaleModeEnabled()).toBe(false);
		expect(await getPreSaleCampaign("little-fish-big-fish")).toBeNull();
	});

	it("liga a campanha com preço/data reais quando publicada", async () => {
		const { isPreSaleModeEnabled, getPreSaleCampaign } = await loadWithFetch(
			vi.fn(async () => presalePublicResponse({ status: "no_ar" })),
		);
		expect(await isPreSaleModeEnabled()).toBe(true);
		const campaign = await getPreSaleCampaign("little-fish-big-fish");
		expect(campaign?.slug).toBe("little-fish-big-fish");
		expect(campaign?.price).toBe("R$ 57,60");
		expect(campaign?.launchAt).toBe("2026-10-14T19:00:00Z");
		// Copy follows the configured date, not the "agosto de 2026" placeholder in the definition.
		expect(campaign?.launchWindow).toBe("outubro de 2026");
		expect(campaign?.title).toBe(LFBF_CAMPAIGN.title);
	});

	it("fica navegável (sem desconto ativo) depois de encerrada", async () => {
		const { isPreSaleModeEnabled } = await loadWithFetch(
			vi.fn(async () => presalePublicResponse({ status: "encerrada" })),
		);
		expect(await isPreSaleModeEnabled()).toBe(true);
	});

	it("falha fechado (desligado) quando o backend está fora do ar", async () => {
		const { isPreSaleModeEnabled } = await loadWithFetch(
			vi.fn(async () => {
				throw new Error("network error");
			}),
		);
		expect(await isPreSaleModeEnabled()).toBe(false);
	});

	it("retorna null pra slug desconhecido mesmo com pré-venda publicada", async () => {
		const { getPreSaleCampaign } = await loadWithFetch(vi.fn(async () => presalePublicResponse()));
		expect(await getPreSaleCampaign("slug-que-nao-existe")).toBeNull();
	});
});
