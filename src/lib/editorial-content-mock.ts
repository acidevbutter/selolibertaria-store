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
	title: "Fale com o selo sobre livros, convites, parcerias e programação.",
	summary:
		"Use este espaço para falar sobre livros, convites culturais, oficinas, imprensa, colaborações ou programação.",
	published: true,
	order: 1,
	hero: {
		eyebrow: "Contato",
		title: "Fale com o selo sobre livros, convites, parcerias e programação.",
		body: "Use este espaço para falar sobre livros, convites culturais, oficinas, imprensa, colaborações ou programação.",
	},
	form: {
		title: "Enviar mensagem",
		description:
			"Vamos encaminhar sua mensagem para o caminho certo dentro de livros, eventos, parcerias ou suporte.",
	},
	direct: {
		title: "Canais diretos",
		description: "Fale com o selo pelos principais pontos de contato editoriais e sociais.",
		links: [
			{ label: "E-mail", href: `mailto:${seloSiteMeta.email}`, text: seloSiteMeta.email },
			{ label: "Instagram", href: seloSiteMeta.instagram, text: "@selolibertaria" },
			{ label: "YouTube", href: seloSiteMeta.youtube, text: "Selo Libertaria" },
		],
	},
	paths: {
		title: "Caminhos comuns",
		description: "Navegue rapidamente entre catálogo, programação e páginas institucionais.",
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
	title: "Uma livraria-editora para quem lê com o corpo inteiro.",
	summary:
		"O Selo Libertária reúne livros, projetos culturais, saraus e publicações autorais em uma experiência de leitura, presença e desejo.",
	published: true,
	order: 1,
	hero: {
		eyebrow: "Livros, performance e literatura erótica",
		title: "Uma livraria-editora para quem lê com o corpo inteiro.",
		description:
			"O Selo Libertária reúne livros, projetos culturais, saraus e publicações autorais em uma experiência de leitura, presença e desejo.",
		primaryCtaLabel: "Ver livros",
		primaryCtaHref: seloHomeHero.primaryCta.href,
		secondaryCtaLabel: "Explorar agenda",
		secondaryCtaHref: seloHomeHero.secondaryCta.href,
		supportingLine: "Livros impressos, edições sonoras, encontros ao vivo e projetos culturais.",
		featureEyebrow: "Site editorial",
		featureTitle:
			"Uma home híbrida onde catálogo, programação cultural e contexto autoral convivem sem fricção.",
		featureBody:
			"Uma home híbrida onde catálogo, programação cultural e contexto autoral convivem sem fricção.",
		featureQuote: "Ler também pode ser uma forma de acender presença.",
		featureImage: {
			src: seloHomeHero.featureImage.src,
			alt: seloHomeHero.featureImage.alt,
		},
	},
	manifesto: {
		title: "Literatura para incendiar linguagem, cidade e imaginação.",
		body: "Entre publicações, encontros e performance, o Selo Libertária constrói um catálogo autoral para adultos, em que o livro opera ao mesmo tempo como obra, gesto e presença cultural.",
		linkLabel: "Conheça o selo",
		linkHref: seloHomeManifesto.linkHref,
	},
	author: {
		eyebrow: "Autora e curadoria",
		title: "Natália Nolli Sasso e a órbita do Selo Libertária",
		body: "Os livros seguem no centro, mas o catálogo cresce em diálogo com programas públicos, oficinas, saraus e trabalho cultural colaborativo.",
		secondaryBody:
			"O site deve permitir que a pessoa leitora passe naturalmente de um título para o contexto artístico e cultural que o cerca.",
		primaryCtaLabel: "Sobre a autora",
		primaryCtaHref: seloHomeAuthorSpotlight.primaryCta.href,
		secondaryCtaLabel: "Conhecer o Sarau Safado",
		secondaryCtaHref: seloHomeAuthorSpotlight.secondaryCta.href,
		image: {
			src: seloHomeAuthorSpotlight.imageSrc,
			alt: seloHomeAuthorSpotlight.imageAlt,
		},
	},
	community: {
		title: "Acompanhe os próximos livros, saraus e projetos culturais.",
		body: "Receba atualizações, acompanhe as redes e entre em contato para convites, parcerias e programação.",
		primaryCtaLabel: "Entrar em contato",
		primaryCtaHref: seloHomeCommunityCta.primaryCta.href,
		secondaryLinks: [
			{ label: "Instagram", href: seloSiteMeta.instagram },
			{ label: "YouTube", href: seloSiteMeta.youtube },
			{ label: "Facebook", href: seloSiteMeta.facebook },
		],
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
