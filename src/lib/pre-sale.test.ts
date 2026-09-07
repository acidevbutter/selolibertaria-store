import { beforeEach, describe, expect, it, vi } from "vitest";

// `vi.hoisted` so the mock factory (also hoisted) can safely close over the spy.
const { getPreSaleModeSettings } = vi.hoisted(() => ({ getPreSaleModeSettings: vi.fn() }));

vi.mock("@/lib/settings-store", () => ({ getPreSaleModeSettings }));

import {
	LFBF_CAMPAIGN,
	resolveCountdownTarget,
	resolvePreSaleAvailability,
	withPreSaleLaunchAt,
} from "@/lib/pre-sale";
import { getPreSaleCampaign, getPreSalePopupCampaign, isPreSaleModeEnabled } from "@/lib/pre-sale.server";

beforeEach(() => {
	getPreSaleModeSettings.mockReset();
});

describe("modo de pré-venda", () => {
	it("usa a configuração persistida do admin", async () => {
		getPreSaleModeSettings.mockResolvedValueOnce({ pageEnabled: true });
		expect(await isPreSaleModeEnabled()).toBe(true);
	});

	it("mantém a rota indisponível quando o admin desativa o modo", async () => {
		getPreSaleModeSettings.mockResolvedValueOnce({ pageEnabled: false });
		expect(await getPreSaleCampaign("little-fish-big-fish")).toBeNull();
	});

	it("retorna a campanha estática quando o admin ativa o modo", async () => {
		getPreSaleModeSettings.mockResolvedValueOnce({ pageEnabled: true });
		const campaign = await getPreSaleCampaign("little-fish-big-fish");
		expect(campaign?.slug).toBe("little-fish-big-fish");
	});

	it("permite modal global sem publicar a landing", async () => {
		getPreSaleModeSettings.mockResolvedValueOnce({
			popupEnabled: true,
			launchAt: "2026-09-30T12:00:00.000Z",
		});
		const campaign = await getPreSalePopupCampaign();
		expect(campaign?.launchAt).toBe("2026-09-30T12:00:00.000Z");
	});

	it("não abre o modal sem data de estreia no admin", async () => {
		getPreSaleModeSettings.mockResolvedValueOnce({ popupEnabled: true });
		expect(await getPreSalePopupCampaign()).toBeNull();

		getPreSaleModeSettings.mockResolvedValueOnce({ popupEnabled: true, launchAt: "não é data" });
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
