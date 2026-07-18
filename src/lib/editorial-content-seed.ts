import type {
	EditorialAboutPage,
	EditorialContactPage,
	EditorialDocument,
	EditorialEvent,
	EditorialEventsPage,
	EditorialHomePage,
	EditorialProductPage,
	EditorialProductsPage,
	EditorialProject,
	EditorialProjectsPage,
	EditorialSarauPage,
	EditorialSiteGlobal,
} from "@/lib/editorial-content";
import { seloEvents, seloProjects, seloSiteMeta } from "@/lib/selolibertaria-content";

const MOCK_ACTOR = "system:mock";

const baseMeta = {
	published: true,
	order: 1,
	createdBy: MOCK_ACTOR,
	updatedBy: MOCK_ACTOR,
} as const;

export function buildSeedEditorialEvents(): EditorialEvent[] {
	return seloEvents.map((event, index) => ({
		type: "event",
		slug: event.slug,
		title: event.title,
		summary: event.summary,
		description: event.description,
		status: event.status,
		period: event.period,
		location: event.location,
		image: event.imageSrc
			? {
					src: event.imageSrc,
					alt: event.imageAlt,
				}
			: undefined,
		published: true,
		order: index + 1,
		createdBy: MOCK_ACTOR,
		updatedBy: MOCK_ACTOR,
	}));
}

export function buildSeedEditorialProjects(): EditorialProject[] {
	return seloProjects.map((project, index) => ({
		type: "project",
		slug: project.slug,
		title: project.title,
		summary: project.summary,
		description: project.description,
		period: project.period,
		location: project.location,
		image: project.imageSrc
			? {
					src: project.imageSrc,
					alt: project.imageAlt,
				}
			: undefined,
		published: true,
		order: index + 1,
		createdBy: MOCK_ACTOR,
		updatedBy: MOCK_ACTOR,
	}));
}

export function buildSeedHomePage(): EditorialHomePage {
	return {
		type: "page_home",
		slug: "home",
		title: "O Selo Libertária publica corpos, cidades, desejos e linguagens que escapam das margens.",
		summary: "Home do selo com manifesto, publicações em destaque e programação cultural.",
		...baseMeta,
		hero: {
			eyebrow: "Lançamento",
			title: "Ninfas do Tietê",
			description:
				"Livro, presença e linguagem em uma página que assume o catálogo como gesto editorial, não como grade genérica.",
			primaryCtaLabel: "Comprar",
			primaryCtaHref: "/products",
			secondaryCtaLabel: "Ler trecho",
			secondaryCtaHref: "/products",
			supportingLine: "poemas, corpos e margens",
			featureEyebrow: "Produto em destaque",
			featureTitle: "Ninfas do Tietê",
			featureBody: "Produto com cara de página literária: sinopse curta, preço claro, amostra e compra.",
			featureQuote: "O livro como objeto, presença e faísca.",
		},
		manifesto: {
			title: "O Selo Libertária publica corpos, cidades, desejos e linguagens que escapam das margens.",
			body: "Entre publicações, encontros e performance, o selo constrói uma leitura autoral em que livro, presença e imaginação cultural continuam a mesma conversa.",
			linkLabel: "Conhecer o selo",
			linkHref: "/about",
		},
		featuredBook: {
			productSlug: "ninfas-do-tiete",
			eyebrow: "Produto em destaque",
			title: "Ninfas do Tietê",
			body: "Produto com cara de página literária: sinopse curta, preço claro, amostra e compra.",
			primaryCtaLabel: "Comprar agora",
			secondaryCtaLabel: "Ver produto",
		},
		catalog: {
			title: "Catálogo",
			body: "Uma prateleira curta e curada para entrar no universo do selo pela leitura.",
			primaryCardFallback: "Poesia erótica em trânsito pela cidade, com corpo e linguagem em tensão.",
			defaultCardFallback: "Produto em preparação dentro do mesmo universo literário do selo.",
			viewBookLabel: "Ver produto",
			launchAlertLabel: "Avise-me",
		},
		program: {
			eyebrow: "Sarau Safado",
			title: "Agenda, memória e presença pública em torno das literaturas eróticas.",
			body: "O programa conecta livro, performance e encontro ao vivo sem se tornar um bloco lateral genérico.",
			ctaLabel: "Conhecer o Sarau Safado",
			ctaHref: "/sarau-safado",
		},
		author: {
			eyebrow: "Autoria e curadoria",
			title: "Natália Nolli Sasso e a órbita do Selo Libertária",
			body: "Os livros seguem no centro, mas o catálogo cresce em diálogo com programas públicos, oficinas, saraus e trabalho cultural colaborativo.",
			secondaryBody:
				"O site deve permitir que a pessoa leitora passe naturalmente de um título para o contexto artístico e cultural que o cerca.",
			primaryCtaLabel: "Sobre a autora",
			primaryCtaHref: "/about",
			secondaryCtaLabel: "Conhecer o Sarau Safado",
			secondaryCtaHref: "/sarau-safado",
		},
		community: {
			title: "Receba lançamentos, saraus e textos do selo.",
			body: "Acompanhe próximos livros, saraus e projetos culturais sem depender de ajustes no código.",
			primaryCtaLabel: "Entrar em contato",
			primaryCtaHref: "/contact",
			secondaryLinks: [
				{ label: "Instagram", href: seloSiteMeta.instagram },
				{ label: "Projetos", href: "/projects" },
				{ label: "Livros", href: "/products" },
			],
		},
	};
}

export function buildSeedEventsPage(): EditorialEventsPage {
	return {
		type: "page_events",
		slug: "events",
		title: "Eventos, encontros e aparições públicas.",
		summary: "Página auxiliar para consultar agenda, arquivo e memória das ações do selo.",
		...baseMeta,
		hero: {
			eyebrow: "Agenda do selo",
			title: "Eventos, encontros e aparições públicas.",
			body: "Uma página auxiliar para consultar agenda, arquivo e memória das ações do Selo Libertária. O menu principal continua priorizando Sarau Safado.",
			primaryCtaLabel: "Ver próxima edição",
			primaryCtaHref: "/sarau-safado",
			secondaryCtaLabel: "Conhecer Sarau",
			secondaryCtaHref: "/sarau-safado",
		},
		curatorialNote: {
			title: "Eventos não entram no menu principal, mas continuam existindo como rota pública.",
			body: "Use esta página para agenda, arquivo e registros. Ela deve apontar para Sarau Safado, Projetos e Contato, mantendo a navegação pública enxuta.",
		},
		agenda: {
			label: "Próximos eventos",
			title: "Agenda pública",
			body: "A agenda mistura próxima edição, programação e memória sem perder clareza operacional.",
			emptyText:
				"A agenda pública será atualizada em breve. Enquanto isso, você pode acompanhar o Sarau Safado, conhecer os projetos e falar com o selo.",
		},
		archive: {
			label: "Arquivo / memória",
			title: "Registros de encontros, leituras e aparições.",
			body: "A agenda não termina na data. Ela também organiza memória, fotos, textos e continuidade para a atuação cultural do selo.",
		},
		finalCta: {
			title: "A agenda continua no Sarau Safado e nos projetos.",
			body: "O caminho público segue para o programa central do selo e para o portfólio cultural.",
			primaryCtaLabel: "Ver Sarau Safado",
			primaryCtaHref: "/sarau-safado",
			secondaryCtaLabel: "Ver projetos",
			secondaryCtaHref: "/projects",
		},
	};
}

export function buildSeedProjectsPage(): EditorialProjectsPage {
	return {
		type: "page_projects",
		slug: "projects",
		title: "Uma atuação que atravessa livro, palco e formação.",
		summary: "Portfólio cultural do selo em diálogo com cidade, erotismo e escrita.",
		...baseMeta,
		hero: {
			eyebrow: "Projetos",
			title: "Uma atuação que atravessa livro, palco e formação.",
			body: "Laboratórios, encontros, publicações e ações culturais do Selo Libertária em diálogo com cidade, erotismo e escrita.",
			imageLabel: "Foto / performance / oficina",
		},
		curatorialNote: {
			title: "Projetos como atuação cultural do selo.",
			body: "Esta página apresenta o portfólio cultural sem virar uma lista homogênea de cards. Cada item precisa ter imagem, status, contexto e saída clara.",
		},
		listing: {
			label: "Portfólio cultural",
			title: "Projetos",
			body: "Cada projeto registra uma frente de criação, formação ou articulação cultural do selo.",
			emptyText:
				"Os projetos culturais serão publicados em breve. Enquanto isso, acompanhe o Sarau Safado e fale com o selo.",
		},
		finalCta: {
			title: "Projetos conectam criação, formação e comunidade.",
			body: "A página de projetos deve abrir saídas diretas para contato e Sarau Safado.",
			primaryCtaLabel: "Falar sobre projeto",
			primaryCtaHref: "/contact",
			secondaryCtaLabel: "Ver Sarau Safado",
			secondaryCtaHref: "/sarau-safado",
		},
	};
}

export function buildSeedProductsPage(): EditorialProductsPage {
	return {
		type: "page_products",
		slug: "products",
		title: "Produtos para entrar no universo do selo pela leitura.",
		summary: "Catálogo autoral com capas, trechos e caminhos de compra preservados.",
		...baseMeta,
		hero: {
			eyebrow: "Produtos",
			title: "Produtos para entrar no universo do selo pela leitura.",
			body: "Catálogo autoral de literatura erótica, urbana e dissidente, com capas, trechos e caminhos de compra preservados.",
			primaryCtaLabel: "Ver catálogo",
			primaryCtaHref: "/products",
			secondaryCtaLabel: "Comprar destaque",
			secondaryCtaHref: "/products",
			quote: "Uma prateleira curta, quente e curada.",
		},
		curatorialNote: {
			title: "Catálogo como mesa de curadoria, não como vitrine genérica.",
			body: "A página de produtos deve preservar a operação de loja — preço, variações, favorito e compra — enquanto apresenta cada item como objeto editorial.",
		},
		listing: {
			label: "Catálogo",
			title: "Catálogo",
			body: "Cada capa abre uma rota: compra, trecho e contexto editorial.",
			emptyText:
				"O catálogo ainda não tem produtos publicados. Volte em breve para acompanhar os próximos lançamentos.",
			cardPrimaryFallback: "Poesia erótica em trânsito pela cidade, com corpo e linguagem em tensão.",
			cardSecondaryFallback: "Produto em preparação dentro do mesmo universo literário do selo.",
			viewBookLabel: "Ver produto",
			launchAlertLabel: "Avise-me",
		},
		finalCta: {
			title: "Depois da compra, continue pelo Sarau Safado e pelos projetos.",
			body: "O catálogo não termina na compra: ele abre caminhos para agenda, performance, encontros e portfólio cultural.",
			primaryCtaLabel: "Falar sobre produtos",
			primaryCtaHref: "/contact",
		},
	};
}

export function buildSeedProductPage(): EditorialProductPage {
	return {
		type: "page_product",
		slug: "product",
		title: "Página do produto",
		summary: "Estrutura editorial da PDP do Selo Libertária.",
		...baseMeta,
		synopsis: {
			label: "Sinopse",
		},
		excerpt: {
			title: "Trecho",
			bodyFallback:
				"Trecho retirado da própria sinopse para sustentar desejo de leitura sem inventar texto persistido.",
		},
		details: {
			title: "Ficha técnica",
		},
		related: {
			title: "Outros produtos",
			body: "Leituras que continuam o mesmo campo editorial.",
			viewBookLabel: "Ver produto",
			fallbackSummary: "Novo título em breve",
		},
		continuity: {
			title: "Um produto pode levar ao Sarau, aos projetos e de volta ao catálogo.",
			body: "A PDP continua orientada à compra, mas ganha saídas editoriais claras para ampliar leitura, contexto e continuidade cultural.",
			links: [
				{ label: "Ver Sarau Safado", href: "/sarau-safado" },
				{ label: "Ver projetos", href: "/projects" },
				{ label: "Ver catálogo", href: "/products" },
			],
		},
		notFound: {
			title: "Produto não encontrado",
			body: "Este item não está disponível agora. Continue pelo catálogo ou fale com o selo.",
			primaryCtaLabel: "Ver catálogo",
			primaryCtaHref: "/products",
		},
	};
}

export function buildSeedSarauPage(): EditorialSarauPage {
	return {
		type: "page_sarau",
		slug: "sarau-safado",
		title: "Sarau Safado",
		summary:
			"Encontro para pessoas que escrevem, pesquisam, leem e são apaixonadas por literaturas eróticas.",
		body: "Programa recorrente de leitura, presença e escuta que prolonga a vida editorial do selo.",
		...baseMeta,
		hero: {
			eyebrow: "Poesia · performance · corpo",
			title: "Sarau Safado",
			body: "Encontro para pessoas que escrevem, pesquisam, leem e são apaixonadas por literaturas eróticas.",
			primaryCtaLabel: "Próxima edição",
			primaryCtaHref: "/events",
			secondaryCtaLabel: "Memória do Sarau",
			secondaryCtaHref: "/events",
		},
		agenda: {
			eyebrow: "Agenda",
			title: "Próxima edição e encontros recentes.",
			body: "Eventos vivem aqui como agenda do Sarau, não como item principal do menu.",
		},
		why: {
			title: "Por que esse programa existe",
			body: "O sarau transforma leitura em acontecimento público e dá corpo ao imaginário cultural do selo.",
		},
		gallery: {
			eyebrow: "Galeria / memória",
			title: "Fotos grandes, vídeos, textos e registros.",
			body: "A memória do Sarau também precisa ser editável sem depender de deploy.",
		},
		signals: [
			"O Sarau existe como ritual recorrente de leitura, presença e escuta.",
			"Origem",
			"Continuidade",
		],
		programNotes: [
			{
				title: "Origem",
				body: "O programa nasce da literatura erótica como campo de leitura e encontro, não como tema ornamental da marca.",
			},
			{
				title: "Continuidade",
				body: "Cada edição articula artistas convidadas, bibliotecas, instituições e pessoas que acompanham o programa.",
			},
			{
				title: "Presença",
				body: "O sarau transforma leitura em acontecimento público e dá corpo ao imaginário cultural do selo.",
			},
		],
		continueLinks: [
			{ label: "Eventos", href: "/events" },
			{ label: "Projetos", href: "/projects" },
			{ label: "Livros", href: "/products" },
		],
	};
}

export function buildSeedAboutPage(): EditorialAboutPage {
	return {
		type: "page_about",
		slug: "about",
		title: "O Selo Libertária publica corpos, cidades, desejos e linguagens que escapam das margens.",
		summary:
			"Editora e produtora cultural dedicada à literatura erótica, performance, encontros e projetos autorais.",
		...baseMeta,
		hero: {
			eyebrow: "Sobre o selo",
			title: "O Selo Libertária publica corpos, cidades, desejos e linguagens que escapam das margens.",
			body: "Editora e produtora cultural dedicada à literatura erótica, performance, encontros e projetos autorais.",
		},
		section: {
			eyebrow: "Autoria e curadoria",
			title: "Natália Nolli Sasso e o universo do Selo Libertária.",
			body: "A página Sobre apresenta história, linha editorial, autoria e manifesto sem parecer uma bio protocolar ou institucional fria.",
			extended: "Literatura, performance e presença urbana aparecem aqui como uma mesma linha curatorial.",
			primaryCtaLabel: "Conhecer Sarau Safado",
			primaryCtaHref: "/sarau-safado",
		},
		cards: [
			{
				eyebrow: "Literatura adulta",
				title: "Erotismo sugerido pela linguagem, sem clichê visual.",
				body: "A camada pública do selo deve manter densidade literária sem escorregar para uma identidade óbvia.",
			},
			{
				eyebrow: "Cidade e corpo",
				title: "Texto, performance e presença urbana como matéria.",
				body: "Cidade, encontro e linguagem aparecem como partes do mesmo ecossistema cultural.",
			},
			{
				eyebrow: "Publicação autoral",
				title: "Livro como objeto editorial, cultural e afetivo.",
				body: "A interface deve sustentar leitura e contexto sem reduzir o projeto a uma vitrine comercial.",
			},
		],
		closing: {
			eyebrow: "Manifesto",
			title: "A programação e a autoria se reforçam mutuamente.",
			body: "Conhecer uma autora, descobrir uma programação e entrar num arquivo. A experiência deve formar um ecossistema cultural, não páginas paralelas.",
			coreEyebrow: "Princípio central",
			coreTitle:
				"Uma livraria para adultos pode ser quente, literária e sensual sem se tornar visualmente óbvia.",
		},
	};
}

export function buildSeedContactPage(): EditorialContactPage {
	return {
		type: "page_contact",
		slug: "contact",
		title: "Convites, parcerias, imprensa, livros e Sarau Safado.",
		summary:
			"Um canal direto para falar com o selo, comprar livros, enviar propostas ou acompanhar a programação.",
		...baseMeta,
		hero: {
			eyebrow: "Contato",
			title: "Convites, parcerias, imprensa, livros e Sarau Safado.",
			body: "Um canal direto para falar com o selo, comprar livros, enviar propostas ou acompanhar a programação.",
			featuredLabel: "Email",
			featuredValue: "contato@selolibertaria.com.br",
		},
		form: {
			title: "Escreva para o selo",
			description: "Use o formulário para convites, imprensa, projetos, livros e assuntos editoriais.",
			subjects: ["Comprar livro", "Enviar manuscrito", "Projetos", "Sarau Safado", "Imprensa", "Outro"],
		},
		direct: {
			title: "Canais diretos",
			description: "Fale com o selo pelos principais pontos de contato editoriais e sociais.",
			links: [
				{
					label: "Email",
					href: "mailto:contato@selolibertaria.com.br",
					text: "contato@selolibertaria.com.br",
				},
				{ label: "Instagram", href: seloSiteMeta.instagram, text: "@selolibertaria" },
				{ label: "YouTube", href: seloSiteMeta.youtube, text: "Selo Libertária" },
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
		closing: {
			title: "Continue pelo Instagram, newsletter ou agenda do Sarau.",
			primaryCtaLabel: "Ver Sarau Safado",
			primaryCtaHref: "/sarau-safado",
			secondaryCtaLabel: "Ver produtos",
			secondaryCtaHref: "/products",
		},
	};
}

export function buildSeedSiteGlobal(): EditorialSiteGlobal {
	return {
		type: "site_global",
		slug: "public-global",
		title: "Conteúdo global público",
		summary: "Newsletter e rodapé editáveis do site público.",
		...baseMeta,
		newsletter: {
			title: "Receba lançamentos, saraus e textos do selo.",
			description:
				"Atualizações de livros, agenda e circulação editorial em um único campo público editável.",
			placeholder: "seu@email.com",
			buttonLabel: "Assinar",
		},
		footer: {
			brandEyebrow: "Selo Libertária",
			brandDescription:
				"Livros, performances, oficinas e programação cultural reunidos em um mesmo site editorial.",
			catalogueTitle: "Livros",
			editorialTitle: "Editorial",
			supportTitle: "Suporte",
			auxiliaryLinks: [
				{ label: "Instagram", href: seloSiteMeta.instagram },
				{ label: "Contato", href: "/contact" },
				{ label: "Newsletter", href: "/#newsletter" },
				{ label: "Direitos autorais", href: "/terms" },
			],
			copyrightText: "Selo Libertária.",
		},
	};
}

export function buildSeedEditorialDocuments(): EditorialDocument[] {
	return [
		...buildSeedEditorialEvents(),
		...buildSeedEditorialProjects(),
		buildSeedSarauPage(),
		buildSeedAboutPage(),
		buildSeedContactPage(),
		buildSeedHomePage(),
		buildSeedEventsPage(),
		buildSeedProjectsPage(),
		buildSeedProductsPage(),
		buildSeedProductPage(),
		buildSeedSiteGlobal(),
	];
}
