import "server-only";

import {
	getPreSaleCampaignDefinition,
	type PreSaleCampaign,
	resolvePreSaleAvailability,
	withPreSaleLaunchAt,
} from "@/lib/pre-sale";
import { getPreSaleModeSettings } from "@/lib/settings-store";

/**
 * Lado servidor da pré-venda: junta a definição estática da campanha
 * (`pre-sale.ts`, isomórfico) com o "modo pré-venda" persistido no admin
 * (`settings-store.ts`, `server-only`). Componentes client importam só de
 * `@/lib/pre-sale`.
 */

/**
 * A fonte de verdade do modo pré-venda é o ajuste salvo no admin. Sem uma
 * configuração disponível, o fallback seguro é manter a página indisponível.
 */
export async function isPreSaleModeEnabled(): Promise<boolean> {
	return (await getPreSaleAvailability()).pageActive;
}

export async function getPreSaleAvailability() {
	return resolvePreSaleAvailability(await getPreSaleModeSettings());
}

/** Campanha ativa da pré-venda, ou `null` quando o modo está desligado / slug desconhecido. */
export async function getPreSaleCampaign(slug: string): Promise<PreSaleCampaign | null> {
	const settings = await getPreSaleModeSettings();
	if (!resolvePreSaleAvailability(settings).pageActive) return null;
	const campaign = getPreSaleCampaignDefinition(slug);
	return campaign ? withPreSaleLaunchAt(campaign, settings.launchAt) : null;
}

/**
 * Campanha do modal global, independente da landing estar publicada.
 * O modal é uma contagem regressiva: sem uma data de estreia válida no admin
 * (`launchAt`) não há o que contar, então não abre.
 */
export async function getPreSalePopupCampaign(): Promise<PreSaleCampaign | null> {
	const settings = await getPreSaleModeSettings();
	if (!resolvePreSaleAvailability(settings).popupActive) return null;
	const campaign = getPreSaleCampaignDefinition("little-fish-big-fish");
	if (!campaign) return null;
	const dated = withPreSaleLaunchAt(campaign, settings.launchAt);
	return dated.launchAt ? dated : null;
}
