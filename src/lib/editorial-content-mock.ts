import type {
	EditorialAboutPage,
	EditorialContactPage,
	EditorialDocument,
	EditorialEvent,
	EditorialHomePage,
	EditorialProject,
	EditorialSarauPage,
} from "@/lib/editorial-content";
import {
	seloAbout,
	seloContactPage,
	seloEvents,
	seloHomeAuthorSpotlight,
	seloHomeCommunityCta,
	seloHomeHero,
	seloHomeManifesto,
	seloProjects,
	seloSarauSafado,
	seloSiteMeta,
} from "@/lib/selolibertaria-content";

const buildMockEvents = (): EditorialEvent[] =>
	seloEvents.map((event, index) => ({
		type: "event",
		slug: event.slug,
		title: event.title,
		summary: event.summary,
		description: event.description,
		status: event.status,
		period: event.period,
		location: event.location,
		published: true,
		order: index + 1,
		createdBy: "system:mock",
		updatedBy: "system:mock",
	}));

const buildMockProjects = (): EditorialProject[] =>
	seloProjects.map((project, index) => ({
		type: "project",
		slug: project.slug,
		title: project.title,
		summary: project.summary,
		description: project.description,
		period: project.period,
		location: project.location,
		published: true,
		order: index + 1,
		createdBy: "system:mock",
		updatedBy: "system:mock",
	}));

const buildMockSarauPage = (): EditorialSarauPage => ({
	type: "page_sarau",
	slug: "sarau-safado",
	title: seloSarauSafado.title,
	summary: seloSarauSafado.intro,
	body: seloSarauSafado.body,
	published: true,
	order: 1,
	hero: {
		eyebrow: "Sarau Safado",
		title: seloSarauSafado.title,
		body: seloSarauSafado.intro,
	},
	why: {
		title: "Por que esse programa existe",
		body: seloSarauSafado.body,
	},
	signals: seloSarauSafado.details,
	programNotes: [
		{
			title: "O Sarau Safado existe como ritual recorrente de leitura, presença e escuta.",
			body: "Em vez de um evento avulso, ele sustenta continuidade: cria público, prolonga o catálogo e abre espaço para vozes convidadas dentro de uma linha curatorial nítida.",
		},
		{
			title: "Origem",
			body: "O programa nasce da literatura erótica como campo de leitura e encontro, não como tema ornamental da marca.",
		},
		{
			title: "Continuidade",
			body: "Cada edição reforça a circulação entre livros, artistas convidadas, bibliotecas, instituições e leitoras recorrentes.",
		},
		{
			title: "Presença",
			body: "O sarau transforma leitura em acontecimento público e ajuda a dar corpo ao imaginário do selo fora da prateleira.",
		},
	],
	continueLinks: [
		{ label: "Eventos", href: "/events" },
		{ label: "Projetos", href: "/projects" },
		{ label: "Livros", href: "/products" },
	],
	createdBy: "system:mock",
	updatedBy: "system:mock",
});

const buildMockAboutPage = (): EditorialAboutPage => ({
	type: "page_about",
	slug: "about",
	title: seloAbout.title,
	summary: seloAbout.body,
	body: seloAbout.extended,
	published: true,
	order: 1,
	hero: {
		eyebrow: "Sobre",
		title: seloAbout.title,
		body: "O site não é apenas um lugar para comprar livros. Ele também é a face pública de uma prática editorial e cultural autoral.",
	},
	section: {
		eyebrow: "Sobre o selo",
		title: seloAbout.title,
		body: seloAbout.body,
		extended: seloAbout.extended,
		image: {
			src: seloAbout.imageSrc,
			alt: seloAbout.imageAlt,
		},
	},
	cards: [
		{
			eyebrow: "Publicação",
			title: "Os livros seguem como âncora do catálogo.",
			body: "O catálogo deve manter páginas de produto, preços, variantes, carrinho e checkout, enquanto ganha um enquadramento editorial mais forte para cada lançamento.",
		},
		{
			eyebrow: "Programação",
			title: "Os eventos ampliam a vida do catálogo.",
			body: "Leituras, laboratórios, festivais e performances devem viver ao lado da loja para que o público entenda o selo como plataforma cultural, e não apenas como uma lista de produtos.",
		},
		{
			eyebrow: "Direção",
			title: "A voz autoral guia a interface.",
			body: "O site deve parecer intencionalmente curado, literário e íntimo, sem sacrificar clareza, velocidade ou a confiabilidade esperada de um fluxo de e-commerce.",
		},
	],
	closing: {
		eyebrow: "Por que isso importa",
		title: "A camada comercial e a camada cultural devem se reforçar mutuamente.",
		body: "Ler um livro, descobrir uma programação, entrar num arquivo e voltar ao catálogo. A experiência deve parecer um único ecossistema, não páginas paralelas e desconectadas.",
		coreEyebrow: "Princípio central",
		coreTitle:
			"Uma livraria para adultos pode ser quente, literária e sensual sem se tornar visualmente óbvia.",
	},
	createdBy: "system:mock",
	updatedBy: "system:mock",
});

const buildMockContactPage = (): EditorialContactPage => ({
	type: "page_contact",
	slug: "contact",
	title: seloContactPage.title,
	summary: seloContactPage.description,
	published: true,
	order: 1,
	hero: {
		eyebrow: seloContactPage.eyebrow,
		title: seloContactPage.title,
		body: seloContactPage.description,
	},
	form: {
		title: seloContactPage.formTitle,
		description: seloContactPage.formDescription,
	},
	direct: {
		title: seloContactPage.directTitle,
		description: seloContactPage.directDescription,
		links: [
			{ label: "E-mail", href: `mailto:${seloSiteMeta.email}`, text: seloSiteMeta.email },
			{ label: "Instagram", href: seloSiteMeta.instagram, text: "@selolibertaria" },
			{ label: "YouTube", href: seloSiteMeta.youtube, text: "Selo Libertaria" },
		],
	},
	paths: {
		title: seloContactPage.pathsTitle,
		description: seloContactPage.pathsDescription,
		links: [
			{ label: "Projetos", href: "/projects" },
			{ label: "Eventos", href: "/events" },
			{ label: "Sarau Safado", href: "/sarau-safado" },
			{ label: "FAQ", href: "/faq" },
			{ label: "Termos", href: "/terms" },
			{ label: "Privacidade", href: "/privacy" },
		],
	},
	createdBy: "system:mock",
	updatedBy: "system:mock",
});

const buildMockHomePage = (): EditorialHomePage => ({
	type: "page_home",
	slug: "home",
	title: seloHomeHero.title,
	summary: seloHomeHero.description,
	published: true,
	order: 1,
	hero: {
		eyebrow: seloHomeHero.eyebrow,
		title: seloHomeHero.title,
		description: seloHomeHero.description,
		primaryCtaLabel: seloHomeHero.primaryCta.label,
		primaryCtaHref: seloHomeHero.primaryCta.href,
		secondaryCtaLabel: seloHomeHero.secondaryCta.label,
		secondaryCtaHref: seloHomeHero.secondaryCta.href,
		supportingLine: seloHomeHero.supportingLine,
		featureEyebrow: seloHomeHero.featureEyebrow,
		featureTitle: seloHomeHero.featureTitle,
		featureBody: seloHomeHero.featureBody,
		featureQuote: seloHomeHero.featureQuote,
		featureImage: {
			src: seloHomeHero.featureImage.src,
			alt: seloHomeHero.featureImage.alt,
		},
	},
	manifesto: {
		title: seloHomeManifesto.title,
		body: seloHomeManifesto.body,
		linkLabel: seloHomeManifesto.linkLabel,
		linkHref: seloHomeManifesto.linkHref,
	},
	author: {
		eyebrow: seloHomeAuthorSpotlight.eyebrow,
		title: seloHomeAuthorSpotlight.title,
		body: seloHomeAuthorSpotlight.body,
		secondaryBody: seloHomeAuthorSpotlight.secondaryBody,
		primaryCtaLabel: seloHomeAuthorSpotlight.primaryCta.label,
		primaryCtaHref: seloHomeAuthorSpotlight.primaryCta.href,
		secondaryCtaLabel: seloHomeAuthorSpotlight.secondaryCta.label,
		secondaryCtaHref: seloHomeAuthorSpotlight.secondaryCta.href,
		image: {
			src: seloHomeAuthorSpotlight.imageSrc,
			alt: seloHomeAuthorSpotlight.imageAlt,
		},
	},
	community: {
		title: seloHomeCommunityCta.title,
		body: seloHomeCommunityCta.body,
		primaryCtaLabel: seloHomeCommunityCta.primaryCta.label,
		primaryCtaHref: seloHomeCommunityCta.primaryCta.href,
		secondaryLinks: seloHomeCommunityCta.secondaryLinks,
	},
	createdBy: "system:mock",
	updatedBy: "system:mock",
});

export function getMockEditorialDocuments(): EditorialDocument[] {
	return [
		...buildMockEvents(),
		...buildMockProjects(),
		buildMockSarauPage(),
		buildMockAboutPage(),
		buildMockContactPage(),
		buildMockHomePage(),
	];
}

export function getMockEditorialEvents() {
	return buildMockEvents();
}

export function getMockEditorialProjects() {
	return buildMockProjects();
}

export function getMockEditorialSarauPage() {
	return buildMockSarauPage();
}

export function getMockEditorialAboutPage() {
	return buildMockAboutPage();
}

export function getMockEditorialContactPage() {
	return buildMockContactPage();
}

export function getMockEditorialHomePage() {
	return buildMockHomePage();
}
