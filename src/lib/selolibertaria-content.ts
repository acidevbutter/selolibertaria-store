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
	{ label: "Home", href: PUBLIC_NAVIGATION.home },
	{ label: "Shop", href: PUBLIC_NAVIGATION.shop },
	{ label: "Projects", href: PUBLIC_NAVIGATION.projects },
	{ label: "Events", href: PUBLIC_NAVIGATION.events },
	{ label: "Sarau Safado", href: PUBLIC_NAVIGATION.sarau },
	{ label: "About", href: PUBLIC_NAVIGATION.about },
	{ label: "Contact", href: PUBLIC_NAVIGATION.contact },
];

export const seloSocialLinks = [
	{ label: "Instagram", href: seloSiteMeta.instagram, icon: "/images/icons/instagram.svg" },
	{ label: "YouTube", href: seloSiteMeta.youtube, icon: null },
	{ label: "Facebook", href: seloSiteMeta.facebook, icon: "/images/icons/facebook.svg" },
];

export const seloHomeHighlights = [
	{
		title: "Independent publishing",
		description:
			"Books and sonic publications that carry the editorial voice of the selo into the public catalogue.",
	},
	{
		title: "Cultural programming",
		description:
			"Readings, workshops, festivals, and gatherings connected to the catalogue and the author's practice.",
	},
	{
		title: "Author-led curation",
		description:
			"A hybrid platform where publishing, performance, and community rituals are presented side by side.",
	},
];

export const seloHomeEditorialCtas = [
	{
		eyebrow: "Shop the catalogue",
		title: "Books stay at the center of the experience.",
		description:
			"The current site keeps its cart, checkout, and product flow while gaining stronger editorial context around each release.",
		href: PUBLIC_NAVIGATION.shop,
		label: "Browse books",
	},
	{
		eyebrow: "Follow the program",
		title: "Events, workshops, and projects build the world around the books.",
		description:
			"Public programming should not feel detached from the catalogue. It should extend the same voice into readings, labs, and performances.",
		href: PUBLIC_NAVIGATION.events,
		label: "See events",
	},
];

export const seloHomeTopBar = {
	message: "New books, live programs, and erotic literature with cultural direction.",
};

export const seloHomeHero = {
	eyebrow: "Books, performance, and erotic literature",
	title: "A bookstore-publisher for people who read with their whole body.",
	description:
		"Selo Libertaria brings together books, cultural projects, salons, and author-led publishing inside one experience of reading, presence, and desire.",
	primaryCta: {
		label: "Browse books",
		href: PUBLIC_NAVIGATION.shop,
	},
	secondaryCta: {
		label: "Explore the agenda",
		href: "/events",
	},
	supportingLine: "Printed books, sonic editions, live gatherings, and cultural projects.",
	featureEyebrow: "Editorial site",
	featureTitle:
		"A hybrid home where catalogue, cultural programming, and authorial context meet without friction.",
	featureBody: seloSiteMeta.tagline,
	featureQuote: "Reading can also be a way of igniting presence.",
	featureImage: {
		src: "/yns-cover.jpg",
		alt: "Selo Libertaria editorial cover",
	},
};

export const seloHomeFeaturedBooksIntro = {
	eyebrow: "Featured catalogue",
	title: "Books to enter this universe through reading.",
	linkLabel: "View the full catalogue",
	linkHref: "/products",
};

export const seloHomeManifesto = {
	title: "Literature to set language, city, and imagination on fire.",
	body: "Between publications, live encounters, and performance, Selo Libertaria builds an authorial catalogue for adults where the book operates as work, gesture, and cultural presence at once.",
	linkLabel: "Meet the selo",
	linkHref: PUBLIC_NAVIGATION.about,
};

export const seloHomeAgenda = {
	eyebrow: "Agenda",
	title: "Upcoming encounters, readings, and public appearances from the selo.",
	archiveTitle: "Archive of encounters and cultural interventions",
	linkLabel: "See all events",
	linkHref: PUBLIC_NAVIGATION.events,
};

export const seloHomeProjectsIntro = {
	eyebrow: "Projects",
	title: "A practice that moves through books, stage, and formation.",
	linkLabel: "View projects",
	linkHref: PUBLIC_NAVIGATION.projects,
};

export const seloHomeImmersiveGallery = {
	eyebrow: "Atmosphere",
	quote: "Reading can also be a way of igniting presence.",
	images: [
		{ src: "/yns-cover.jpg", alt: "Book cover from Selo Libertaria" },
		{ src: "/yns-cover.jpg", alt: "Editorial composition for Selo Libertaria" },
		{ src: "/yns-cover.jpg", alt: "Visual atmosphere of books and performance" },
	],
};

export const seloHomeAuthorSpotlight = {
	eyebrow: "Author and curation",
	title: "Natalia Nolli Sasso and the wider orbit of Selo Libertaria",
	body: "Books remain at the center, but the catalogue grows in dialogue with public programs, workshops, salons, and collaborative cultural work.",
	secondaryBody:
		"The new site should let readers move naturally from a title to the artistic and cultural context that surrounds it.",
	primaryCta: {
		label: "About the author",
		href: PUBLIC_NAVIGATION.about,
	},
	secondaryCta: {
		label: "Discover Sarau Safado",
		href: PUBLIC_NAVIGATION.sarau,
	},
	imageSrc: "/yns-cover.jpg",
	imageAlt: "Editorial portrait composition for Selo Libertaria",
};

export const seloHomeCommunityCta = {
	title: "Follow the next books, salons, and cultural projects.",
	body: "Receive updates, follow the networks, and get in touch for invitations, partnerships, and programming.",
	primaryCta: {
		label: "Get in touch",
		href: PUBLIC_NAVIGATION.contact,
	},
	secondaryLinks: [
		{ label: "Instagram", href: seloSiteMeta.instagram },
		{ label: "YouTube", href: seloSiteMeta.youtube },
		{ label: "Facebook", href: seloSiteMeta.facebook },
	],
};

export const seloContactPage = {
	eyebrow: "Contact",
	title: "Talk to the selo about books, invitations, partnerships, and programming.",
	description:
		"Use this space for book inquiries, cultural invitations, workshops, press, collaborations, or programming conversations.",
	formTitle: "Send a message",
	formDescription:
		"We will route your note to the right path inside books, events, partnerships, or support.",
	directTitle: "Direct channels",
	directDescription: "Reach the selo through the main editorial and social touchpoints.",
	pathsTitle: "Common paths",
	pathsDescription: "Move quickly between catalogue, programming, and institutional pages.",
};

export const seloAbout = {
	title: "Um site editorial moldado por livros, performance e programação cultural.",
	body: "O Selo Libertária é uma plataforma editorial e cultural autoral que reúne livros impressos, lançamentos sonoros, oficinas, eventos e projetos de longa duração. Em vez de separar a camada comercial do conteúdo institucional, o site deve permitir que a pessoa leitora passe naturalmente da descoberta de um título para o contexto artístico e cultural ao seu redor.",
	extended:
		"No centro está o trabalho de Natália Nolli Sasso e a órbita mais ampla de colaboradoras, espaços e iniciativas culturais que sustentam o selo. O site precisa sustentar essas duas funções ao mesmo tempo: ser um lugar confiável para comprar livros e uma vitrine clara para projetos, eventos e identidade editorial.",
	imageSrc: "/yns-cover.jpg",
	imageAlt: "Composição editorial do Selo Libertária",
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
	},
	{
		slug: "laboratorio-de-escritas-dissidentes",
		title: "Laboratório de Escritas Dissidentes",
		period: "Programa de 3 meses",
		location: "Centro de Pesquisa e Formação do Sesc São Paulo",
		summary: "Laboratório de escrita e edição voltado a poéticas dissidentes e corpos insurgentes.",
		description:
			"Coordenado por Natália Nolli Sasso, o laboratório acolheu pessoas interessadas em ler e escrever a partir de uma perspectiva literária dissidente, por meio de encontros semanais.",
	},
	{
		slug: "sarau-levante",
		title: "Sarau Levante",
		period: "Programa ao vivo",
		location: "Sesc Campo Limpo",
		summary: "Encontro de poesia com curadoria e condução de Natália Nolli Sasso.",
		description:
			"Uma série de leituras centrada em poetas brasileiras e vozes contemporâneas, apresentada como extensão cultural pública do selo.",
	},
	{
		slug: "flipenha-2022",
		title: "Flipenha 2022",
		period: "2022",
		location: "Centro Cultural da Penha, São Paulo",
		summary: "Conversa sobre literatura e sexualidades com Natália Nolli Sasso e Amara Moira.",
		description:
			"Um encontro em torno de literatura, sexualidade e diálogo público, com mediação de Gabriela Prado.",
	},
	{
		slug: "livro-de-venus",
		title: "Livro de Venus",
		period: "2024-2025",
		location: "Sesc Avenida Paulista / Sesc Ipiranga",
		summary: "Laboratório de criação e edição de escrita erótica.",
		description:
			"Um laboratório recorrente construído em torno de encontros semanais e do desenvolvimento de textos eróticos, ampliando o selo de editora para plataforma pedagógica.",
	},
	{
		slug: "ninfas-do-tiete-launch",
		title: "Lançamento de Ninfas do Tietê",
		period: "Lançamento da primeira edição",
		location: "Teatro de Contêiner, São Paulo",
		summary: "Lançamento da primeira edição do livro junto de uma videoperformance relacionada.",
		description:
			"Apresentado como parte da Mostra: Solos Mulheres, o lançamento conectou literatura, performance e colaboração entre artistas e equipes de produção.",
	},
	{
		slug: "sarau-safado",
		title: "Sarau Safado",
		period: "Em curso",
		location: "São Paulo",
		summary: "Um encontro para quem escreve, lê, pesquisa e ama literaturas eróticas.",
		description:
			"Com curadoria e condução de Natália Nolli Sasso, o sarau reúne artistas convidadas e leitoras em um ritual recorrente de literatura erótica.",
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
