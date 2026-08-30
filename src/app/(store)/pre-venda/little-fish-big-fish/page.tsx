import { notFound } from "next/navigation";
import type { Metadata } from "next/types";
import { publicUrl } from "@/env.mjs";
import { getPreSaleCampaign, isPreSaleModeEnabled, LFBF_CAMPAIGN } from "@/lib/pre-sale";
import { PreSaleLanding } from "@/ui/pre-venda/pre-sale-landing";

export const dynamic = "force-dynamic";

const PATH = "/pre-venda/little-fish-big-fish";

export function generateMetadata(): Metadata {
	const title = "little fish, big fish — pré-venda | Selo Libertária";
	const description =
		"Pré-venda do terceiro livro de poesia de Natália Nolli Sasso pela Selo Libertária. Garanta seu exemplar antes do lançamento.";
	return {
		title,
		description,
		alternates: { canonical: `${publicUrl}${PATH}` },
		robots: isPreSaleModeEnabled() ? undefined : { index: false, follow: false },
		openGraph: {
			title,
			description,
			url: `${publicUrl}${PATH}`,
			images: [{ url: `${publicUrl}${LFBF_CAMPAIGN.images.badge}` }],
		},
	};
}

export default function LittleFishBigFishPreSalePage() {
	const campaign = getPreSaleCampaign("little-fish-big-fish");
	if (!campaign) {
		notFound();
	}
	return <PreSaleLanding campaign={campaign} />;
}
