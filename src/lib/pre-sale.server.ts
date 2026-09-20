import "server-only";

import { getPreSaleCampaignDefinition, type PreSaleCampaign } from "@/lib/pre-sale";
import { formatBRL, LITTLE_FISH_BIG_FISH_PRODUCT_ID } from "@/lib/presales";
import { getPublicPresaleByProduct } from "@/lib/presales.server";

/**
 * Lado servidor da pré-venda: junta a definição estática da campanha
 * (`pre-sale.ts`, isomórfico) com o estado real vindo do backend
 * (`app/presales/`, via `presales.server.ts`). Componentes client importam
 * só de `@/lib/pre-sale`.
 */

/** A landing e o "modo pré-venda" ficam disponíveis assim que a pré-venda
 * existir e não estiver mais em rascunho (publicada ou já encerrada — uma
 * pré-venda encerrada ainda deve ser navegável, só sem o desconto ativo). */
export async function isPreSaleModeEnabled(): Promise<boolean> {
	const presale = await getPublicPresaleByProduct(LITTLE_FISH_BIG_FISH_PRODUCT_ID);
	return presale !== null && presale.status !== "rascunho";
}

/** Campanha ativa da pré-venda, com preço/data reais, ou `null` quando ainda
 * não há pré-venda publicada / slug desconhecido. */
export async function getPreSaleCampaign(slug: string): Promise<PreSaleCampaign | null> {
	const presale = await getPublicPresaleByProduct(LITTLE_FISH_BIG_FISH_PRODUCT_ID);
	if (!presale || presale.status === "rascunho") return null;
	const campaign = getPreSaleCampaignDefinition(slug);
	if (!campaign) return null;
	return { ...campaign, price: formatBRL(presale.presalePrice), launchAt: presale.launchAt };
}
