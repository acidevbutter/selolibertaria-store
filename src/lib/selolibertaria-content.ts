export const seloSiteMeta = {
	name: "Selo Libertária",
	title: "Selo Libertária",
	description:
		"Site editorial autoral de livros, performances, oficinas e projetos culturais do universo Selo Libertária.",
	tagline: "Livros, performances e literatura erótica com direção cultural.",
	email: "natalianolli@selolibertaria.page",
	instagram: "https://www.instagram.com/selolibertaria",
	youtube: "https://www.youtube.com/@selolibertaria",
	facebook: "https://www.facebook.com/selolibertaria",
};

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
