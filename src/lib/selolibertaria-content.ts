import { PUBLIC_NAVIGATION } from "@/lib/public-navigation";

export const seloSiteMeta = {
	name: "Selo Libertaria",
	title: "Selo Libertaria",
	description:
		"Site editorial autoral de livros, performances, oficinas e projetos culturais do universo Selo Libertária.",
	tagline: "Livros, performances e literatura erótica com direção cultural.",
	email: "natalianolli@selolibertaria.page",
	instagram: "https://www.instagram.com/selolibertaria",
	youtube: "https://www.youtube.com/@selolibertaria",
	facebook: "https://www.facebook.com/selolibertaria",
};

export const seloPrimaryLinks = [
	{ label: "Livros", href: PUBLIC_NAVIGATION.shop },
	{ label: "Projetos", href: PUBLIC_NAVIGATION.projects },
	{ label: "Sarau Safado", href: PUBLIC_NAVIGATION.sarau },
	{ label: "Sobre", href: PUBLIC_NAVIGATION.about },
	{ label: "Contato", href: PUBLIC_NAVIGATION.contact },
];

export const seloSocialLinks = [
	{ label: "Instagram", href: seloSiteMeta.instagram, icon: "/images/icons/instagram.svg" },
	{ label: "YouTube", href: seloSiteMeta.youtube, icon: null },
	{ label: "Facebook", href: seloSiteMeta.facebook, icon: "/images/icons/facebook.svg" },
];

export const seloEditorialAssets = {
	bookCover: "/images/selolibertaria/virus-do-beijo-cover.png",
	bookStandingMock: "/images/selolibertaria/virus-do-beijo-standing-mock.png",
	bookStackedMock: "/images/selolibertaria/virus-do-beijo-stacked-mock.png",
	bookOpenSpread: "/images/selolibertaria/virus-do-beijo-open-spread.png",
	illustrationMermaid: "/images/selolibertaria/illustration-mermaid-circle.png",
	illustrationHarness: "/images/selolibertaria/illustration-body-harness-circle.png",
	illustrationReader: "/images/selolibertaria/illustration-reader-phone.png",
	illustrationNightFigure: "/images/selolibertaria/illustration-night-figure.png",
	illustrationHeartStockings: "/images/selolibertaria/illustration-heart-stockings.png",
	illustrationStatueRider: "/images/selolibertaria/illustration-statue-rider.png",
	illustrationSaturn: "/images/selolibertaria/illustration-saturn.png",
} as const;

export const seloHomeHighlights = [
	{
		title: "Publicação autoral",
		description: "Livros e publicações sonoras que carregam a voz editorial do selo no catálogo público.",
	},
	{
		title: "Programação cultural",
		description: "Leituras, oficinas, festivais e encontros conectados ao catálogo e à prática autoral.",
	},
	{
		title: "Curadoria autoral",
		description:
			"Uma plataforma híbrida onde publicação, performance e rituais comunitários convivem lado a lado.",
	},
];

export const seloHomeEditorialCtas = [
	{
		eyebrow: "Ver catálogo",
		title: "Os livros permanecem no centro da experiência.",
		description:
			"O site atual mantém fluxo de carrinho, checkout e produto enquanto ganha contexto editorial mais forte para cada lançamento.",
		href: PUBLIC_NAVIGATION.shop,
		label: "Ver livros",
	},
	{
		eyebrow: "Acompanhar a programação",
		title: "Eventos, oficinas e projetos constroem o mundo em torno dos livros.",
		description:
			"A programação pública não deve parecer desconectada do catálogo. Deve estender a mesma voz para leituras, laboratórios e performances.",
		href: PUBLIC_NAVIGATION.events,
		label: "Ver eventos",
	},
];

export const seloHomeTopBar = {
	message: "Novos livros, programação ao vivo e literatura erótica com direção cultural.",
};

export const seloHomeHero = {
	eyebrow: "Livros, performance e literatura erótica",
	title: "Uma livraria-editora para quem lê com o corpo inteiro.",
	description:
		"O Selo Libertaria reúne livros, projetos culturais, saraus e publicações autorais em uma experiência de leitura, presença e desejo.",
	primaryCta: {
		label: "Comprar livro",
		href: PUBLIC_NAVIGATION.shop,
	},
	secondaryCta: {
		label: "Conhecer o Sarau Safado",
		href: PUBLIC_NAVIGATION.sarau,
	},
	supportingLine: "Livros impressos, edições sonoras, encontros ao vivo e projetos culturais.",
	featureEyebrow: "Site editorial",
	featureTitle:
		"Uma home híbrida onde catálogo, programação cultural e contexto autoral convivem sem fricção.",
	featureBody: seloSiteMeta.tagline,
	featureQuote: "Ler também pode ser uma forma de acender presença.",
	featureImage: {
		src: seloEditorialAssets.bookStandingMock,
		alt: "Mockup do livro Virus do Beijo em composição editorial",
	},
};

export const seloHomeFeaturedBooksIntro = {
	eyebrow: "Catálogo em destaque",
	title: "Livros para entrar nesse universo pela leitura.",
	linkLabel: "Ver catálogo completo",
	linkHref: "/products",
};

export const seloHomeManifesto = {
	title: "O Selo Libertária publica corpos, cidades, desejos e linguagens que escapam das margens.",
	body: "Entre publicações, encontros e performance, o selo constrói uma leitura autoral em que livro, presença e imaginação cultural continuam a mesma conversa.",
	linkLabel: "Conheça o selo",
	linkHref: PUBLIC_NAVIGATION.about,
};

export const seloHomeAgenda = {
	eyebrow: "Agenda",
	title: "Próximos encontros, leituras e aparições públicas do selo.",
	archiveTitle: "Arquivo de encontros e intervenções culturais",
	linkLabel: "Ver todos os eventos",
	linkHref: PUBLIC_NAVIGATION.events,
};

export const seloHomeProjectsIntro = {
	eyebrow: "Projetos",
	title: "Uma prática que atravessa livros, palco e formação.",
	linkLabel: "Ver projetos",
	linkHref: PUBLIC_NAVIGATION.projects,
};

export const seloHomeImmersiveGallery = {
	eyebrow: "Atmosfera",
	quote: "Ler também pode ser uma forma de acender presença.",
	images: [
		{
			src: seloEditorialAssets.bookOpenSpread,
			alt: "Livro aberto do Selo Libertária com ilustração interna",
		},
		{ src: seloEditorialAssets.bookStackedMock, alt: "Mockup empilhado do livro Virus do Beijo" },
		{
			src: seloEditorialAssets.illustrationMermaid,
			alt: "Ilustração circular em preto e branco do universo do selo",
		},
	],
};

export const seloHomeAuthorSpotlight = {
	eyebrow: "Autora e curadoria",
	title: "Natália Nolli Sasso e a órbita do Selo Libertaria",
	body: "Os livros seguem no centro, mas o catálogo cresce em diálogo com programas públicos, oficinas, saraus e trabalho cultural colaborativo.",
	secondaryBody:
		"O site deve permitir que a pessoa leitora passe naturalmente de um título para o contexto artístico e cultural que o cerca.",
	primaryCta: {
		label: "Sobre a autora",
		href: PUBLIC_NAVIGATION.about,
	},
	secondaryCta: {
		label: "Conhecer o Sarau Safado",
		href: PUBLIC_NAVIGATION.sarau,
	},
	imageSrc: seloEditorialAssets.illustrationReader,
	imageAlt: "Ilustração em preto e branco de leitora no universo do Selo Libertária",
};

export const seloHomeCommunityCta = {
	title: "Acompanhe os próximos livros, saraus e projetos culturais.",
	body: "Receba atualizações, acompanhe as redes e entre em contato para convites, parcerias e programação.",
	primaryCta: {
		label: "Entrar em contato",
		href: PUBLIC_NAVIGATION.contact,
	},
	secondaryLinks: [
		{ label: "Instagram", href: seloSiteMeta.instagram },
		{ label: "YouTube", href: seloSiteMeta.youtube },
		{ label: "Facebook", href: seloSiteMeta.facebook },
	],
};

export const seloContactPage = {
	eyebrow: "Contato",
	title: "Fale com o selo sobre livros, convites, parcerias e programação.",
	description:
		"Use este espaço para falar sobre livros, convites culturais, oficinas, imprensa, colaborações ou programação.",
	formTitle: "Enviar mensagem",
	formDescription:
		"Vamos encaminhar sua mensagem para o caminho certo dentro de livros, eventos, parcerias ou suporte.",
	directTitle: "Canais diretos",
	directDescription: "Fale com o selo pelos principais pontos de contato editoriais e sociais.",
	pathsTitle: "Caminhos comuns",
	pathsDescription: "Navegue rapidamente entre catálogo, programação e páginas institucionais.",
};

export const seloAbout = {
	title: "Um site editorial moldado por livros, performance e programação cultural.",
	body: "O Selo Libertária é uma plataforma editorial e cultural autoral que reúne livros impressos, lançamentos sonoros, oficinas, eventos e projetos de longa duração. Em vez de separar a camada comercial do conteúdo institucional, o site deve permitir que a pessoa leitora passe naturalmente da descoberta de um título para o contexto artístico e cultural ao seu redor.",
	extended:
		"No centro está o trabalho de Natália Nolli Sasso e a órbita mais ampla de colaboradoras, espaços e iniciativas culturais que sustentam o selo. O site precisa sustentar essas duas funções ao mesmo tempo: ser um lugar confiável para comprar livros e uma vitrine clara para projetos, eventos e identidade editorial.",
	imageSrc: seloEditorialAssets.bookOpenSpread,
	imageAlt: "Livro aberto com miolo ilustrado do acervo do Selo Libertária",
};

export const seloProjects = [
	{
		slug: "festival-mario-de-andrade-2024",
		title: "Festival Mario de Andrade 2024",
		period: "2024",
		location: "São Paulo",
		summary: "Participação de Natália Nolli Sasso e do Selo Libertária dentro da programação do festival.",
		description:
			"Uma aparição cultural pública que colocou o selo em um contexto mais amplo de festival, reforçando seu papel para além da prateleira da livraria.",
		imageSrc: seloEditorialAssets.illustrationReader,
		imageAlt: "Ilustração de leitora como imagem editorial do projeto",
	},
	{
		slug: "laboratorio-de-escritas-dissidentes",
		title: "Laboratório de Escritas Dissidentes",
		period: "Programa de 3 meses",
		location: "Centro de Pesquisa e Formação do Sesc São Paulo",
		summary: "Laboratório de escrita e edição voltado a poéticas dissidentes e corpos insurgentes.",
		description:
			"Coordenado por Natália Nolli Sasso, o laboratório acolheu pessoas interessadas em ler e escrever a partir de uma perspectiva literária dissidente, por meio de encontros semanais.",
		imageSrc: seloEditorialAssets.illustrationNightFigure,
		imageAlt: "Ilustração noturna em preto e branco para o laboratório de escritas",
	},
	{
		slug: "sarau-levante",
		title: "Sarau Levante",
		period: "Programa ao vivo",
		location: "Sesc Campo Limpo",
		summary: "Encontro de poesia com curadoria e condução de Natália Nolli Sasso.",
		description:
			"Uma série de leituras centrada em poetas brasileiras e vozes contemporâneas, apresentada como extensão cultural pública do selo.",
		imageSrc: seloEditorialAssets.illustrationHeartStockings,
		imageAlt: "Ilustração de corpo em meia-calça como sinal gráfico do sarau",
	},
	{
		slug: "flipenha-2022",
		title: "Flipenha 2022",
		period: "2022",
		location: "Centro Cultural da Penha, São Paulo",
		summary: "Conversa sobre literatura e sexualidades com Natália Nolli Sasso e Amara Moira.",
		description:
			"Um encontro em torno de literatura, sexualidade e diálogo público, com mediação de Gabriela Prado.",
		imageSrc: seloEditorialAssets.illustrationMermaid,
		imageAlt: "Ilustração circular em preto e branco para o encontro literário",
	},
	{
		slug: "livro-de-venus",
		title: "Livro de Venus",
		period: "2024-2025",
		location: "Sesc Avenida Paulista / Sesc Ipiranga",
		summary: "Laboratório de criação e edição de escrita erótica.",
		description:
			"Um laboratório recorrente construído em torno de encontros semanais e do desenvolvimento de textos eróticos, ampliando o selo de editora para plataforma pedagógica.",
		imageSrc: seloEditorialAssets.illustrationHarness,
		imageAlt: "Ilustração circular em preto e branco com composição corporal",
	},
	{
		slug: "ninfas-do-tiete-launch",
		title: "Lançamento de Ninfas do Tietê",
		period: "Lançamento da primeira edição",
		location: "Teatro de Contêiner, São Paulo",
		summary: "Lançamento da primeira edição do livro junto de uma videoperformance relacionada.",
		description:
			"Apresentado como parte da Mostra: Solos Mulheres, o lançamento conectou literatura, performance e colaboração entre artistas e equipes de produção.",
		imageSrc: seloEditorialAssets.bookOpenSpread,
		imageAlt: "Livro aberto do Selo Libertária usado como imagem do lançamento",
	},
	{
		slug: "sarau-safado",
		title: "Sarau Safado",
		period: "Em curso",
		location: "São Paulo",
		summary: "Um encontro para quem escreve, lê, pesquisa e ama literaturas eróticas.",
		description:
			"Com curadoria e condução de Natália Nolli Sasso, o sarau reúne artistas convidadas e leitoras em um ritual recorrente de literatura erótica.",
		imageSrc: seloEditorialAssets.illustrationStatueRider,
		imageAlt: "Ilustração em preto e branco para o Sarau Safado",
	},
];

export const seloEvents = [
	{
		slug: "eventos-com-autores",
		title: "Eventos com autores",
		status: "arquivo",
		period: "Arquivo",
		location: "Vários espaços",
		summary: "Arquivo imagético de encontros, leituras e programas públicos com autores.",
		description:
			"O site original dá a essa área um tratamento visual quase de galeria. Na nova versão, ela deve funcionar como arquivo claro, capaz também de destacar a programação atual.",
		imageSrc: seloEditorialAssets.illustrationSaturn,
		imageAlt: "Ilustração de planeta em preto e branco como imagem do arquivo de eventos",
	},
	{
		slug: "sarau-safado-live",
		title: "Edição ao vivo do Sarau Safado",
		status: "em curso",
		period: "Desde 2025",
		location: "São Paulo",
		summary: "O sarau online começou em 2020 e evoluiu para edições presenciais a partir de 2025.",
		description:
			"A programação é curada com meses de antecedência e conecta o catálogo editorial à cultura da leitura ao vivo e da performance.",
		imageSrc: seloEditorialAssets.bookStandingMock,
		imageAlt: "Mockup do livro Virus do Beijo como imagem editorial da edição ao vivo",
	},
	{
		slug: "workshops-and-labs",
		title: "Oficinas e laboratórios",
		status: "recorrente",
		period: "Sazonal",
		location: "Instituições parceiras",
		summary: "Programas formativos ligados à literatura, à escrita erótica e às poéticas dissidentes.",
		description:
			"As oficinas devem aparecer ao lado dos eventos públicos para que a programação cultural seja lida como um ecossistema único, e não como páginas isoladas.",
		imageSrc: seloEditorialAssets.illustrationHarness,
		imageAlt: "Ilustração circular em preto e branco para oficinas e laboratórios",
	},
];

export const seloSarauSafado = {
	title: "Sarau Safado",
	intro:
		"Uma iniciativa recorrente dedicada às literaturas eróticas, às leituras, às performances e aos encontros em torno do desejo, da autoria e da escuta pública.",
	body: "Criado por Natália Nolli Sasso, o Sarau Safado começou online em 2020 e passou a ter edições presenciais em 2025. Ele opera ao mesmo tempo como programa cultural e extensão editorial: um lugar em que o catálogo encontra o público por meio de artistas convidadas, leituras compartilhadas e continuidade curatorial.",
	details: [
		"Construído em torno das literaturas eróticas, e não de uma programação genérica de eventos.",
		"Curado com meses de antecedência, com forte ponto de vista autoral.",
		"Conectado a livros, bibliotecas públicas e instituições culturais em São Paulo.",
	],
};
