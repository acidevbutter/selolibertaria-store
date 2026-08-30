/**
 * Pré-venda ("modo pré-venda") — configuração e flag de ativação.
 *
 * A tela e o pop-up de pré-venda são presentational: recebem uma `PreSaleCampaign`
 * e não sabem de onde ela veio. Hoje a campanha é estática (ver `LFBF_CAMPAIGN`) e a
 * ativação é feita por variável de ambiente, espelhando `maintenance-mode.ts`.
 *
 * A evolução (campanha vinda do admin/editorial, janela agendada, toggle com histórico
 * de auditoria) está especificada em `docs/prompts/pre-venda-03-admin-modo-pre-venda.md`.
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
	/** preço exibido no card de pré-venda; "a definir" enquanto não houver valor */
	price: string;
	/** janela de lançamento em texto livre (ex.: "agosto de 2026") */
	launchWindow: string;
	/**
	 * Data/hora alvo do lançamento em ISO 8601. Quando presente, é a fonte da
	 * verdade da contagem regressiva. Sem ela, o pop-up cai em `countdownDays`.
	 */
	launchAt?: string;
	/** fallback da contagem regressiva quando não há `launchAt` */
	countdownDays: number;
	/** destino do botão "Comprar" (checkout / produto / link do Mercado Pago) */
	buyHref: string;
	/** link "voltar para a loja" no topo */
	backHref: string;
	/** nota de pagamento sob o card (ex.: "Pagamento via Mercado Pago · Pix ou cartão.") */
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
	popup: {
		eyebrow: string;
		title: string;
		primaryCta: PreSaleCta;
		dismissLabel: string;
		/** atraso até a abertura automática, em ms */
		autoOpenDelayMs: number;
		/** horas de silêncio após o visitante fechar o pop-up */
		snoozeHours: number;
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
	countdownDays: 45,
	buyHref: "#",
	backHref: "/",
	paymentNote: "Pagamento via Mercado Pago · Pix ou cartão.",
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
		cta: { label: "Comprar na pré-venda", href: "#" },
	},
	popup: {
		eyebrow: "Contagem regressiva",
		title: "little fish, big fish chega em:",
		primaryCta: { label: "Garantir na pré-venda", href: "#" },
		dismissLabel: "Continuar navegando",
		autoOpenDelayMs: 1500,
		snoozeHours: 24,
	},
};

const CAMPAIGNS: Record<string, PreSaleCampaign> = {
	[LFBF_CAMPAIGN.slug]: LFBF_CAMPAIGN,
};

/**
 * Flag global do "modo pré-venda". Lida direto de `process.env` (sem
 * `@t3-oss/env-nextjs`) para poder ser importada também no edge proxy,
 * do mesmo jeito que `isMaintenanceModeEnabled`.
 *
 * Ative com `PRESALE_MODE=true`. O painel admin (a construir — ver
 * `docs/prompts/pre-venda-03-admin-modo-pre-venda.md`) deve passar a ser a
 * fonte da verdade, com esta env como override de emergência.
 */
export function isPreSaleModeEnabled(): boolean {
	return process.env.PRESALE_MODE === "true";
}

/** Campanha ativa da pré-venda, ou `null` quando o modo está desligado / slug desconhecido. */
export function getPreSaleCampaign(slug: string): PreSaleCampaign | null {
	if (!isPreSaleModeEnabled()) return null;
	return CAMPAIGNS[slug] ?? null;
}

/** Substitui os placeholders `{price}` / `{launchWindow}` no texto da campanha. */
export function fillCampaignText(template: string, campaign: PreSaleCampaign): string {
	return template.replaceAll("{price}", campaign.price).replaceAll("{launchWindow}", campaign.launchWindow);
}

/** Alvo da contagem regressiva em epoch ms: `launchAt` quando válido, senão agora + `countdownDays`. */
export function resolveCountdownTarget(campaign: PreSaleCampaign, now: number = Date.now()): number {
	if (campaign.launchAt) {
		const parsed = Date.parse(campaign.launchAt);
		if (!Number.isNaN(parsed)) return parsed;
	}
	return now + campaign.countdownDays * 86_400_000;
}
