import "server-only";

import {
	getPreSaleCampaignDefinition,
	type PreSaleCampaign,
	type PreSaleScheduleSettings,
	resolvePreSaleAvailability,
	withPreSaleLaunchAt,
} from "@/lib/pre-sale";
import { getPublicPresaleByProduct, LFBF_PRODUCT_ID, type PublicPresale } from "@/lib/presales";

/**
 * Lado servidor da pré-venda: junta a definição estática da campanha
 * (`pre-sale.ts`, isomórfico) com a `Presale` persistida no backend
 * (`@/lib/presales`, `server-only`). Componentes client importam só de
 * `@/lib/pre-sale`.
 *
 * Fonte de verdade única: antes disso, agendamento/preço viviam num blob de
 * settings do Next desconectado do backend que de fato cobra via Asaas --
 * preço e data podiam divergir entre loja e checkout. Agora ambos os lados
 * leem a mesma `Presale`.
 */

function toScheduleSettings(presale: PublicPresale | null): PreSaleScheduleSettings {
	if (!presale) return {};
	return {
		pageEnabled: presale.status !== "rascunho",
		popupEnabled: presale.modalEnabled && presale.status === "no_ar",
		launchAt: presale.launchAt,
		windowEndAt: presale.launchAt,
	};
}

function brl(cents: number) {
	return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Aplica preço, aviso e intervalo do modal vindos da `Presale` sobre a
 * definição estática da campanha -- só o texto/imagens continuam fixos. */
function withPresaleData(campaign: PreSaleCampaign, presale: PublicPresale): PreSaleCampaign {
	return {
		...campaign,
		price: brl(presale.presalePrice),
		launchAt: presale.launchAt,
		productId: presale.productId,
		variantId: presale.variantId,
		popup: {
			...campaign.popup,
			title: presale.modalTitle || campaign.popup.title,
			snoozeHours: presale.modalIntervalHours,
		},
	};
}

export async function isPreSaleModeEnabled(): Promise<boolean> {
	return (await getPreSaleAvailability()).pageActive;
}

export async function getPreSaleAvailability() {
	const presale = await getPublicPresaleByProduct(LFBF_PRODUCT_ID).catch(() => null);
	return resolvePreSaleAvailability(toScheduleSettings(presale));
}

/** Campanha ativa da pré-venda, ou `null` quando o modo está desligado / slug desconhecido. */
export async function getPreSaleCampaign(slug: string): Promise<PreSaleCampaign | null> {
	const presale = await getPublicPresaleByProduct(LFBF_PRODUCT_ID).catch(() => null);
	if (!resolvePreSaleAvailability(toScheduleSettings(presale)).pageActive) return null;
	const campaign = getPreSaleCampaignDefinition(slug);
	if (!campaign) return null;
	return presale ? withPresaleData(campaign, presale) : withPreSaleLaunchAt(campaign, null);
}

/**
 * Campanha do modal global, independente da landing estar publicada.
 * O modal é uma contagem regressiva: sem uma data de estreia válida no admin
 * (`launchAt`) não há o que contar, então não abre.
 */
export async function getPreSalePopupCampaign(): Promise<PreSaleCampaign | null> {
	const presale = await getPublicPresaleByProduct(LFBF_PRODUCT_ID).catch(() => null);
	if (!presale || !resolvePreSaleAvailability(toScheduleSettings(presale)).popupActive) return null;
	const campaign = getPreSaleCampaignDefinition("little-fish-big-fish");
	if (!campaign) return null;
	const dated = withPresaleData(campaign, presale);
	return dated.launchAt ? dated : null;
}
