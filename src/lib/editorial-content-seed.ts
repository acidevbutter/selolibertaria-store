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
					caption: "credit" in project && project.credit ? `Fotos: ${project.credit}` : undefined,
				}
			: undefined,
		gallery: project.gallery?.map((src, galleryIndex) => ({
			src,
			alt: `${project.title} (${galleryIndex + 1})`,
			caption: "credit" in project && project.credit ? `Fotos: ${project.credit}` : undefined,
		})),
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
			title: "little fish, big fish",
			description:
				"poesia erótica pra ler de um fôlego só. o quarto livro da Natália chega em breve — enquanto isso, o catálogo segue de pé.",
			primaryCtaLabel: "Comprar",
			primaryCtaHref: "/products",
			secondaryCtaLabel: "Ler trecho",
			secondaryCtaHref: "/products",
			supportingLine: "poemas, corpos e margens",
			featureImage: {
				src: "/images/selolibertaria/home-capa-destaque-lfbf.webp",
				alt: "Capa de little fish, big fish, de Natália Nolli Sasso: dois peixes em traço preto e laranja sobre fundo preto",
			},
		},
		manifesto: {
			title: "O Selo Libertária publica corpos, cidades, desejos e linguagens que escapam das margens.",
			body: "entre publicações, encontros e performance, o selo mantém livro, presença e imaginação cultural na mesma conversa.",
			linkLabel: "Conhecer o selo",
			linkHref: "/about",
		},
		featuredBook: {
			productSlug: "little-fish-big-fish",
			eyebrow: "Livro em destaque",
			title: "little fish, big fish",
			body: "sinopse direta, preço à vista, um trecho pra provar antes de levar.",
			primaryCtaLabel: "Comprar agora",
			secondaryCtaLabel: "Ver produto",
		},
		catalog: {
			title: "Catálogo",
			body: "uma prateleira curta e curada — não uma grade genérica de produtos.",
			primaryCardFallback: "poesia erótica em trânsito pela cidade, corpo e linguagem em tensão.",
			defaultCardFallback: "produto em preparação, dentro do mesmo universo literário do selo.",
			viewBookLabel: "Ver produto",
			launchAlertLabel: "Avise-me",
		},
		program: {
			eyebrow: "Sarau Safado",
			title: "agenda, memória e presença pública em torno da literatura erótica.",
			body: "leitura, performance e encontro ao vivo — o sarau é onde o catálogo ganha corpo.",
			ctaLabel: "Conhecer o Sarau Safado",
			ctaHref: "/sarau-safado",
		},
		author: {
			eyebrow: "Autoria e curadoria",
			title: "Natália Nolli Sasso e a órbita do Selo Libertária",
			body: "os livros seguem no centro, mas o catálogo cresce em diálogo com oficinas, saraus e outros projetos culturais.",
			secondaryBody:
				"de um título você chega fácil no resto: eventos, oficinas, o sarau. é tudo a mesma conversa.",
			primaryCtaLabel: "Sobre a autora",
			primaryCtaHref: "/about",
			secondaryCtaLabel: "Conhecer o Sarau Safado",
			secondaryCtaHref: "/sarau-safado",
		},
		community: {
			title: "Receba lançamentos, saraus e textos do selo.",
			body: "acompanhe as redes e fale com a gente pra convites, parcerias e programação.",
			primaryCtaLabel: "Entrar em contato",
			primaryCtaHref: "/contact",
			secondaryLinks: [
				{ label: "Instagram", href: seloSiteMeta.instagram },
				{ label: "Projetos", href: "/projects" },
				{ label: "Loja", href: "/products" },
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
			eyebrow: "Eventos",
			title: "Eventos, encontros e aparições públicas.",
			body: "arquivo e agenda do que a gente faz ao vivo. pra não perder a próxima data, o Sarau Safado tem página própria.",
			primaryCtaLabel: "Ver próxima edição",
			primaryCtaHref: "/sarau-safado",
			secondaryCtaLabel: "Conhecer Sarau",
			secondaryCtaHref: "/sarau-safado",
		},
		curatorialNote: {
			title: "O que já rolou, e o que vem por aí.",
			body: "aqui fica registrado o que já rolou; o que vem por aí, você acompanha pelo Sarau Safado.",
		},
		agenda: {
			label: "Próximos eventos",
			title: "Agenda pública",
			body: "A agenda mistura próxima edição, programação e memória sem perder clareza operacional.",
			emptyText:
				"por enquanto não tem data marcada por aqui. dá uma olhada no Sarau Safado, nos projetos, ou manda um oi pra gente.",
		},
		archive: {
			label: "Arquivo / memória",
			title: "Registros de encontros, leituras e aparições.",
			body: "fotos, textos e memória do que já vivemos ao vivo.",
		},
		finalCta: {
			title: "A agenda continua no Sarau Safado e nos projetos.",
			body: "pra saber o que vem por aí, é por lá.",
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
			body: "laboratórios, encontros, publicações e ações culturais do Selo Libertária, em diálogo com cidade, erotismo e escrita.",
			imageLabel: "Foto / performance / oficina",
		},
		curatorialNote: {
			title: "Cada projeto aprofunda o catálogo.",
			body: "cada projeto aqui aprofunda o catálogo — não é uma lista de eventos soltos.",
		},
		listing: {
			label: "Portfólio cultural",
			title: "Projetos",
			body: "Cada projeto registra uma frente de criação, formação ou articulação cultural do selo. Ordem: mais recente primeiro.",
			emptyText:
				"os próximos projetos culturais chegam em breve por aqui. enquanto isso, acompanhe o Sarau Safado ou fale com a gente.",
		},
		finalCta: {
			title: "Projetos conectam criação, formação e comunidade.",
			body: "quer propor algo? fala com a gente.",
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
			eyebrow: "Loja",
			title: "Produtos para entrar no universo do selo pela leitura.",
			body: "catálogo de literatura erótica, urbana e dissidente — cada capa com trecho, preço e contexto.",
			primaryCtaLabel: "Ver catálogo",
			primaryCtaHref: "/products",
			secondaryCtaLabel: "Comprar destaque",
			secondaryCtaHref: "/products",
			quote: "livro como objeto, presença e faísca.",
		},
		curatorialNote: {
			title: "Catálogo como mesa de curadoria, não como vitrine genérica.",
			body: "A página de produtos deve preservar a operação de loja — preço, variações, favorito e compra — enquanto apresenta cada item como objeto editorial.",
		},
		listing: {
			label: "Catálogo",
			title: "Catálogo",
			body: "Cada capa abre uma rota: compra, trecho e contexto editorial.",
			emptyText: "ainda não tem produto publicado aqui. volta em breve pros próximos lançamentos.",
			cardPrimaryFallback: "poesia erótica em trânsito pela cidade, corpo e linguagem em tensão.",
			cardSecondaryFallback: "produto em preparação, dentro do mesmo universo literário do selo.",
			viewBookLabel: "Ver produto",
			launchAlertLabel: "Avise-me",
		},
		finalCta: {
			title: "Depois da compra, siga pelo Sarau Safado e pelos projetos.",
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
			bodyFallback: "em breve, um trecho deste livro por aqui.",
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
			title: "Um livro pode levar ao Sarau, aos projetos e de volta ao catálogo.",
			body: "A PDP continua orientada à compra, mas ganha saídas editoriais claras para ampliar leitura, contexto e continuidade cultural.",
			links: [
				{ label: "Ver Sarau Safado", href: "/sarau-safado" },
				{ label: "Ver projetos", href: "/projects" },
				{ label: "Ver catálogo", href: "/products" },
			],
		},
		notFound: {
			title: "Produto não encontrado",
			body: "Este título não está disponível agora. Siga pelo catálogo ou fale com o selo.",
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
			body: "encontro para quem escreve, pesquisa, lê e é apaixonada por literatura erótica.",
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
			body: "o sarau nasceu online em 2020, em plena pandemia, e ganhou sua primeira edição presencial em 2025. desde então, transforma leitura em acontecimento público — com curadoria da Natália e meses de antecedência para cada line-up.",
		},
		gallery: {
			eyebrow: "Galeria / memória",
			title: "Fotos grandes, vídeos, textos e registros.",
			body: "a memória do sarau é tão importante quanto a próxima edição.",
		},
		signals: [
			"ritual recorrente, não evento isolado.",
			"curadoria com meses de antecedência.",
			"line-up que celebra artistas dissidentes — inclusive as banidas de outras redes.",
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
				body: "o sarau transforma leitura em acontecimento público e dá corpo ao que o selo defende.",
			},
		],
		continueLinks: [
			{ label: "Eventos", href: "/events" },
			{ label: "Projetos", href: "/projects" },
			{ label: "Loja", href: "/products" },
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
			body: "editora e produtora cultural dedicada à literatura erótica, à performance, aos encontros públicos e a projetos autorais.",
		},
		section: {
			eyebrow: "Autoria e curadoria",
			title: "Natália Nolli Sasso e o universo do Selo Libertária",
			body: "Natália escreve, edita e cura tudo que sai com o nome do selo. Aqui, literatura erótica, performance e presença urbana são a mesma linha de trabalho — não seções separadas de um site institucional.",
			extended:
				"Livros como vírus do beijo e sexo estranho com desconhecidos em lugares impróprios nasceram dessa mesma prática, que também é o Sarau Safado e as oficinas de escrita erótica que a Natália conduz.",
			image: {
				src: "/images/selolibertaria/natalia-nolli-sasso-sarau-safado.webp",
				alt: "Cartaz do Sarau Safado sobre um microfone iluminado por luz vermelha",
				caption: "Sarau Safado",
			},
			primaryCtaLabel: "Conhecer Sarau Safado",
			primaryCtaHref: "/sarau-safado",
		},
		cards: [
			{
				eyebrow: "Literatura adulta",
				title: "Erotismo que vem da linguagem, não do clichê visual.",
				body: "o selo trata o corpo e o desejo como matéria literária — sem precisar de capa apelativa pra provar isso.",
			},
			{
				eyebrow: "Cidade e corpo",
				title: "Texto, performance e presença urbana como matéria.",
				body: "cidade, encontro e linguagem fazem parte do mesmo trabalho, dentro e fora do livro.",
			},
			{
				eyebrow: "Publicação autoral",
				title: "Livro como objeto editorial, cultural e afetivo.",
				body: "cada lançamento carrega contexto — não é só um produto na prateleira.",
			},
		],
		closing: {
			eyebrow: "Manifesto",
			title: "A programação e a autoria se reforçam mutuamente.",
			body: "conhecer a Natália, descobrir uma data do sarau, entrar num arquivo de fotos — tudo isso devia parecer o mesmo lugar, não páginas soltas.",
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
			body: "fale com a gente pra comprar livro, propor parceria, imprensa ou saber da programação.",
			featuredLabel: "Email",
			featuredValue: "contato@selolibertaria.com.br",
		},
		form: {
			title: "Escreva pro selo",
			description: "convite, imprensa, projeto, manuscrito, ou dúvida sobre livro — é só escolher o assunto.",
			subjects: ["Comprar livro", "Enviar manuscrito", "Projetos", "Sarau Safado", "Imprensa", "Outro"],
		},
		direct: {
			title: "Canais diretos",
			description: "fale direto com o selo pelos canais oficiais.",
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
			description: "atalho rápido pra catálogo, programação e páginas institucionais.",
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
			title: "Continue pelo Instagram, pela newsletter ou pela agenda do Sarau.",
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
			description: "atualizações de livro, agenda e o que mais sai por aqui — sem enrolação.",
			placeholder: "seu e-mail",
			buttonLabel: "Assinar",
		},
		footer: {
			brandEyebrow: "Selo Libertária",
			brandDescription:
				"Livros, performances, oficinas e programação cultural reunidos em um mesmo site editorial.",
			catalogueTitle: "Loja",
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
