/**
 * Pré-venda ("modo pré-venda") — configuração e flag de ativação.
 *
 * A tela e o pop-up de pré-venda são presentational: recebem uma `PreSaleCampaign`
 * e não sabem de onde ela veio. A campanha é estática por enquanto, enquanto sua
 * ativação é uma configuração editorial persistida e alterada no admin.
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
	 * Data/hora de estreia em ISO 8601, definida no admin. É a única fonte da
	 * contagem regressiva do modal — sem ela, o modal não abre.
	 */
	launchAt?: string;
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

export type PreSaleAvailability = {
	pageActive: boolean;
	popupActive: boolean;
	inWindow: boolean;
};

export type PreSaleScheduleSettings = {
	enabled?: boolean;
	pageEnabled?: boolean;
	popupEnabled?: boolean;
	launchAt?: string | null;
	windowStartAt?: string | null;
	windowEndAt?: string | null;
};

function parseDate(value?: string | null): number | null {
	if (!value) return null;
	const timestamp = Date.parse(value);
	return Number.isNaN(timestamp) ? null : timestamp;
}

/** Resolve os dois canais públicos, sempre falhando fechado para janela inválida. */
export function resolvePreSaleAvailability(
	settings: PreSaleScheduleSettings | null | undefined,
	now: number = Date.now(),
): PreSaleAvailability {
	const startAt = parseDate(settings?.windowStartAt);
	const endAt = parseDate(settings?.windowEndAt);
	const invalidWindow =
		(settings?.windowStartAt != null && startAt === null) ||
		(settings?.windowEndAt != null && endAt === null) ||
		(startAt !== null && endAt !== null && startAt > endAt);
	const inWindow = !invalidWindow && (startAt === null || now >= startAt) && (endAt === null || now <= endAt);
	const pageEnabled = settings?.pageEnabled ?? settings?.enabled ?? false;
	return {
		pageActive: pageEnabled && inWindow,
		popupActive: (settings?.popupEnabled ?? false) && inWindow,
		inWindow,
	};
}

/** Aplica a data editorial ao countdown sem modificar a definição estática. */
export function withPreSaleLaunchAt(campaign: PreSaleCampaign, launchAt?: string | null): PreSaleCampaign {
	return parseDate(launchAt) === null ? campaign : { ...campaign, launchAt: launchAt ?? undefined };
}

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
 * Definição estática da campanha de um slug, sem qualquer checagem do "modo
 * pré-venda". O gating pela configuração do admin vive em `pre-sale.server.ts`
 * — este módulo é isomórfico e não pode tocar `settings-store` (`server-only`),
 * senão o bundle client do pop-up de contagem quebra no build.
 */
export function getPreSaleCampaignDefinition(slug: string): PreSaleCampaign | null {
	return CAMPAIGNS[slug] ?? null;
}

/** Substitui os placeholders `{price}` / `{launchWindow}` no texto da campanha. */
export function fillCampaignText(template: string, campaign: PreSaleCampaign): string {
	return template.replaceAll("{price}", campaign.price).replaceAll("{launchWindow}", campaign.launchWindow);
}

/**
 * Alvo da contagem regressiva em epoch ms: a data de estreia (`launchAt`, definida
 * no admin) quando válida, senão `null` — sem data, o modal não mostra countdown.
 */
export function resolveCountdownTarget(campaign: PreSaleCampaign): number | null {
	return parseDate(campaign.launchAt);
}
