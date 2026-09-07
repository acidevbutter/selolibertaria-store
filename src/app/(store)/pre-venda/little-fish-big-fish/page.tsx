import { notFound } from "next/navigation";
import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { LFBF_CAMPAIGN } from "@/lib/pre-sale";
import { getPreSaleCampaign, isPreSaleModeEnabled } from "@/lib/pre-sale.server";
import { PreSaleLanding } from "@/ui/pre-venda/pre-sale-landing";

export const dynamic = "force-dynamic";

const PATH = "/pre-venda/little-fish-big-fish";

export async function generateMetadata(): Promise<Metadata> {
	const title = "little fish, big fish — pré-venda | Selo Libertária";
	const description =
		"Pré-venda do terceiro livro de poesia de Natália Nolli Sasso pela Selo Libertária. Garanta seu exemplar antes do lançamento.";
	return {
		title,
		description,
		alternates: { canonical: `${publicUrl}${PATH}` },
		robots: (await isPreSaleModeEnabled()) ? undefined : { index: false, follow: false },
		openGraph: {
			title,
			description,
			url: `${publicUrl}${PATH}`,
			images: [{ url: `${publicUrl}${LFBF_CAMPAIGN.images.badge}` }],
		},
	};
}

export default async function LittleFishBigFishPreSalePage() {
	const campaign = await getPreSaleCampaign("little-fish-big-fish");
	if (!campaign) {
		notFound();
	}
	return <PreSaleLanding campaign={campaign} />;
}
