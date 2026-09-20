/**
 * Conteúdo editorial estático da campanha de pré-venda (landing page).
 *
 * A tela é presentational: recebe uma `PreSaleCampaign` e não sabe de onde
 * vieram os dados. A cópia (hero, sobre, autora) é estática; o que é real
 * (preço, disponibilidade, data de estreia) vem do backend real
 * (`app/presales/`) via `pre-sale.server.ts` — ver `lib/presales.server.ts`.
 */

export type PreSaleCta = {
	label: string;
	href: string;
};

export type PreSaleCampaign = {
	/** slug usado na rota /pre-venda/[slug] e em analytics */
	slug: string;
	/** rótulo curto acima do título (ex.: "Pré-venda · Selo Libertária") */
	eyebrow: string;
	/** título de exibição, pode conter \n para quebra */
	title: string;
	/** linha de autoria / subtítulo (ex.: "poesia de Natália Nolli Sasso") */
	byline: string;
	/** parágrafo de abertura no hero */
	intro: string;
	/** preço exibido no card de pré-venda; "a definir" enquanto não houver pré-venda publicada */
	price: string;
	/** janela de lançamento em texto livre (ex.: "agosto de 2026") */
	launchWindow: string;
	/** Data/hora de estreia em ISO 8601, vinda de `Presale.launch_at`. */
	launchAt?: string;
	/** destino do botão "Comprar" — a página real do produto */
	buyHref: string;
	/** link "voltar para a loja" no topo */
	backHref: string;
	/** nota de pagamento sob o card (ex.: "Pagamento via Asaas · Pix.") */
	paymentNote: string;
	/** imagens da campanha, relativas a /public */
	images: {
		badge: string;
		band: string;
		circle: string;
	};
	about: {
		eyebrow: string;
		lead: string;
		paragraphs: string[];
		colophon: string;
	};
	author: {
		eyebrow: string;
		name: string;
		bio: string;
		cta: PreSaleCta;
	};
	closing: {
		eyebrow: string;
		title: string;
		cta: PreSaleCta;
	};
};

/**
 * Campanha "little fish, big fish" — Natália Nolli Sasso.
 * Importada de Claude Design: "Pre-venda Little Fish Big Fish.dc.html".
 */
export const LFBF_CAMPAIGN: PreSaleCampaign = {
	slug: "little-fish-big-fish",
	eyebrow: "Pré-venda · Selo Libertária",
	title: "little fish,\nbig fish",
	byline: "poesia de Natália Nolli Sasso",
	intro:
		"Tanto a poeta quanto as poesias deste livro parecem nadar por rotas eróticas — ora se afogam, ora trafegam por fluxos estranhos. Aliás, tudo que é estranho parece interessar para a autora.",
	price: "a definir",
	launchWindow: "agosto de 2026",
	launchAt: undefined,
	buyHref: "/product/little-fish-big-fish",
	backHref: "/",
	paymentNote: "Pagamento via Asaas · Pix.",
	images: {
		badge: "/images/selolibertaria/lfbf-fish-badge.png",
		band: "/images/selolibertaria/lfbf-fish-band.png",
		circle: "/images/selolibertaria/lfbf-fish-circle-tight.png",
	},
	about: {
		eyebrow: "Sobre o livro",
		lead: "Estranhamente little fish, big fish mergulha onde sons e luzes chegam dispersos, onde corpos se confundem com o meio ambiente.",
		paragraphs: [
			"Terceiro livro de poesia de Natália Nolli Sasso, little fish, big fish dá continuidade a uma obra que já atravessou Ninfas do Tietê e Vírus do Beijo — sempre com peixes, corpos e cidade se confundindo em imagens híbridas entre o humano e o animal.",
			"A imagem de peixes presente no livro evoca zonas imaginárias, abissais, combinatórias para o erotismo fora de áreas convencionais. Tanto a poeta quanto as poesias do livro parecem nadar por rotas eróticas, e ora se afogam, ora trafegam por fluxos estranhos.",
		],
		colophon: "São Paulo, Selo Libertária, {launchWindow}.",
	},
	author: {
		eyebrow: "Autora",
		name: "Natália Nolli Sasso",
		bio: "Desde o primeiro livro, Ninfas do Tietê, peixes reaparecem entre mesas, calçadas e ruídos de uma São Paulo noturna, ao lado de sereias, dragões, libélulas e ninfas. Em Vírus do Beijo, um peixe anônimo atravessa as páginas de forma quase imperceptível. little fish, big fish é o terceiro capítulo dessa obra.",
		cta: { label: "Conhecer os outros livros da autora →", href: "/products" },
	},
	closing: {
		eyebrow: "Pré-venda aberta",
		title: "Garanta seu exemplar antes do lançamento",
		cta: { label: "Comprar na pré-venda", href: "/product/little-fish-big-fish" },
	},
};

const CAMPAIGNS: Record<string, PreSaleCampaign> = {
	[LFBF_CAMPAIGN.slug]: LFBF_CAMPAIGN,
};

/**
 * Definição estática da campanha de um slug. Este módulo é isomórfico e não
 * pode tocar `presales.server`/`settings-store` (`server-only`), senão o
 * bundle client quebra no build.
 */
export function getPreSaleCampaignDefinition(slug: string): PreSaleCampaign | null {
	return CAMPAIGNS[slug] ?? null;
}

/** Substitui os placeholders `{price}` / `{launchWindow}` no texto da campanha. */
export function fillCampaignText(template: string, campaign: PreSaleCampaign): string {
	return template.replaceAll("{price}", campaign.price).replaceAll("{launchWindow}", campaign.launchWindow);
}
