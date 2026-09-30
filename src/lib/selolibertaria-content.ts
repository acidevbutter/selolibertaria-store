export const seloSiteMeta = {
	name: "Selo Libertária",
	title: "Selo Libertária",
	description:
		"Selo Libertária: livraria-editora independente de literatura erótica, performances e o Sarau Safado, com curadoria de Natália Nolli Sasso.",
	tagline: "livros, performances e literatura erótica com direção autoral.",
	email: "contato@selolibertaria.com.br",
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
	bookCover: "/images/selolibertaria/livro-virus-do-beijo-capa.webp",
	bookStandingMock: "/images/selolibertaria/livro-virus-do-beijo-capa.webp",
	bookStackedMock: "/images/selolibertaria/livro-virus-do-beijo-alt.webp",
	bookOpenSpread: "/images/selolibertaria/livro-ninfas-do-tiete-alt.webp",
	illustrationMermaid: "/images/selolibertaria/capa-projeto-flipenha-2022.webp",
	illustrationHarness: "/images/selolibertaria/capa-projeto-livro-de-venus.webp",
	illustrationReader: "/images/selolibertaria/capa-projeto-festival-mario-de-andrade.webp",
	illustrationNightFigure: "/images/selolibertaria/capa-projeto-laboratorio-escritas-dissidentes.webp",
	illustrationHeartStockings: "/images/selolibertaria/capa-projeto-sarau-levante.webp",
	illustrationStatueRider: "/images/selolibertaria/capa-projeto-sarau-safado.webp",
	illustrationSaturn: "/images/selolibertaria/eventos-autores-01.webp",
	littleFishCover: "/images/selolibertaria/home-capa-destaque-lfbf.webp",
	nataliaSarau: "/images/selolibertaria/natalia-nolli-sasso-sarau-safado.webp",
} as const;

export const seloProjects = [
	{
		slug: "laboratorio-escritas-dissidentes",
		title: "Laboratório de escritas dissidentes",
		period: "2025",
		location: "Sesc SP",
		summary:
			"Poéticas dissidentes, corpas/os insurgentes é um laboratório de criação e edição de textos literários coordenado por Natália Nolli Sasso.",
		description:
			"Poéticas dissidentes, corpas/os insurgentes é um laboratório de criação e edição de textos literários coordenado por Natália Nolli Sasso, para quem quer conhecer, ler e escrever dentro da chave da dissidência. Encontros semanais durante 3 meses. Realização: Centro de Pesquisa e Formação do Sesc São Paulo. Fotos: Alan Fujito.",
		imageSrc: "/images/selolibertaria/capa-projeto-laboratorio-escritas-dissidentes.webp",
		imageAlt: "Natália Nolli Sasso conduzindo o Laboratório de escritas dissidentes no Sesc",
		gallery: [
			"/images/selolibertaria/projeto-laboratorio-escritas-dissidentes-01.webp",
			"/images/selolibertaria/projeto-laboratorio-escritas-dissidentes-02.webp",
			"/images/selolibertaria/projeto-laboratorio-escritas-dissidentes-03.webp",
			"/images/selolibertaria/projeto-laboratorio-escritas-dissidentes-04.webp",
			"/images/selolibertaria/projeto-laboratorio-escritas-dissidentes-05.webp",
		],
		credit: "Alan Fujito",
	},
	{
		slug: "sarau-levante",
		title: "Sarau Levante",
		period: "2025",
		location: "Sesc Campo Limpo",
		summary: "Sarau apresentado e organizado por Natália Nolli Sasso, com poetas convidadxs.",
		description:
			"Sarau apresentado e organizado por Natália Nolli Sasso, com poetas convidadxs. Apresenta poetas e poesias brasileiras. Fotos: Alan Fujito.",
		imageSrc: "/images/selolibertaria/capa-projeto-sarau-levante.webp",
		imageAlt: "Artistas no palco durante o Sarau Levante, no Sesc Campo Limpo",
		gallery: [
			"/images/selolibertaria/projeto-sarau-levante-01.webp",
			"/images/selolibertaria/projeto-sarau-levante-02.webp",
			"/images/selolibertaria/projeto-sarau-levante-03.webp",
		],
		credit: "Alan Fujito",
	},
	{
		slug: "livro-de-venus",
		title: "Livro de Vênus",
		period: "2024–2025",
		location: "Sesc Av. Paulista e Sesc Ipiranga",
		summary: "Laboratório de criação e edição de escritos eróticos.",
		description:
			"Laboratório de criação e edição de escritos eróticos. Orientação de pesquisa, produção e edição de textos literários eróticos, com estratégias propostas pela escritora e editora. Encontros semanais por cerca de dois meses. Coordenação: Natália Nolli Sasso. Fotos: Alan Fujito.",
		imageSrc: "/images/selolibertaria/capa-projeto-livro-de-venus.webp",
		imageAlt: "Retrato em preto e branco ligado ao laboratório Livro de Vênus",
		gallery: [
			"/images/selolibertaria/projeto-livro-de-venus-01.webp",
			"/images/selolibertaria/projeto-livro-de-venus-02.webp",
			"/images/selolibertaria/projeto-livro-de-venus-03.webp",
			"/images/selolibertaria/projeto-livro-de-venus-04.webp",
		],
		credit: "Alan Fujito",
	},
	{
		slug: "festival-mario-de-andrade-2024",
		title: "Festival Mário de Andrade",
		period: "2024",
		location: "São Paulo",
		summary: "Participação da autora Natália Nolli Sasso e do Selo Libertária no Festival Mário de Andrade.",
		description:
			"Participação da autora Natália Nolli Sasso e do Selo Libertária no Festival Mário de Andrade.",
		imageSrc: "/images/selolibertaria/capa-projeto-festival-mario-de-andrade.webp",
		imageAlt: "Natália Nolli Sasso ao microfone no Festival Mário de Andrade, 2024",
		gallery: [
			"/images/selolibertaria/projeto-festival-mario-de-andrade-01.webp",
			"/images/selolibertaria/projeto-festival-mario-de-andrade-02.webp",
			"/images/selolibertaria/projeto-festival-mario-de-andrade-03.webp",
			"/images/selolibertaria/projeto-festival-mario-de-andrade-04.webp",
		],
	},
	{
		slug: "flipenha-2022",
		title: "Flipenha",
		period: "2022",
		location: "Centro Cultural da Penha",
		summary:
			"Roda de conversa com escritoras: Sexualidade e Literatura erótica, com Amara Moira e Natália Nolli Sasso.",
		description:
			"Roda de conversa com escritoras: Sexualidade e Literatura erótica, com Amara Moira e Natália Nolli Sasso. Mediação de Gabriela da Silva Prado. Biblioteca José Paulo Paes / Centro Cultural da Penha.",
		imageSrc: "/images/selolibertaria/capa-projeto-flipenha-2022.webp",
		imageAlt:
			"Cartaz da Flipenha 2022: roda de conversa sobre sexualidade e literatura erótica com Amara Moira e Natália Nolli Sasso",
		gallery: [
			"/images/selolibertaria/projeto-flipenha-2022-01.webp",
			"/images/selolibertaria/projeto-flipenha-2022-02.webp",
		],
	},
	{
		slug: "lancamento-ninfas-do-tiete",
		title: "Lançamento de Ninfas do Tietê",
		period: "2018",
		location: "Teatro de Contêiner Mungunzá",
		summary:
			"Lançamento da primeira edição, dentro da Mostra Solo Mulheres, com a estreia da videoperformance homônima.",
		description:
			"Lançamento da primeira edição, dentro da Mostra Solo Mulheres. Na mesma noite estreou a videoperformance homônima, criada a partir das poesias do livro — criação de Natália Nolli Sasso, direção e edição de Sol Fagnello, assistência de Tati Caltabiano, com performance de todas elas, Thiane Nascimento, Ana Zeppa, Cícero Andrade e Loraine Dazária.",
		imageSrc: "/images/selolibertaria/capa-projeto-lancamento-ninfas-do-tiete.webp",
		imageAlt: "Projeção em vermelho durante o lançamento de Ninfas do Tietê no Teatro de Contêiner",
		gallery: [
			"/images/selolibertaria/projeto-lancamento-ninfas-do-tiete-01.webp",
			"/images/selolibertaria/projeto-lancamento-ninfas-do-tiete-02.webp",
		],
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
