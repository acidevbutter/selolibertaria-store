#!/usr/bin/env node
/**
 * One-time import of the Wix migration package (`/backup` at the repo root) into real data:
 * the three published books, six portfolio projects, and the About page's author photo /
 * editorial cards / press mentions.
 *
 * This is the frontend feeding the backend's own HTTP routes -- no backend script, no direct
 * DB access. Catalog products go through the same authenticated route the admin UI's "novo
 * produto" form calls (`POST /catalog/`, needs a real admin session). Editorial rows (projects,
 * About's legacy content, About's contentDoc text) go through the internal-API-key routes the
 * Next.js server itself uses (`editorial-admin-api.ts` / `blocks-actions.ts`).
 *
 * Source: backup/conteudo/00-inventario-e-migracao.md, 01-copy-deck.md, 02-fichas-de-produto.md,
 * 04-biblioteca-de-imagens.md. Images already live under public/images/selolibertaria/.
 *
 * Deliberately excluded: the "Sarau Safado" portfolio card, and anything belonging to
 * page_events/page_sarau or the eventos-autores-* posters. /audiolivros is mapped in the backup
 * docs but not built here.
 *
 * Usage (from selolibertaria-store, with the backend reachable at FASTAPI_API_URL):
 *
 *     node scripts/seed-backup-content.mjs
 *
 * Reads FASTAPI_API_URL / FASTAPI_INTERNAL_API_KEY from .env, and ADMIN_EMAIL / ADMIN_PASSWORD
 * (falls back to the local dev admin from backend/scripts/create_admin.py's docstring example).
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function loadEnvFile(path) {
	try {
		for (const line of readFileSync(path, "utf8").split("\n")) {
			const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
			if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
		}
	} catch {
		// optional file
	}
}

const rootDir = fileURLToPath(new URL("..", import.meta.url));
loadEnvFile(`${rootDir}.env`);

const API = process.env.FASTAPI_API_URL || "http://localhost:9001";
const INTERNAL_KEY = process.env.FASTAPI_INTERNAL_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "contato@selolibertaria.com.br";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Senh@1234";
const IMG = "/images/selolibertaria";

if (!INTERNAL_KEY) {
	console.error("FASTAPI_INTERNAL_API_KEY is not set (checked .env).");
	process.exit(1);
}

async function login() {
	const res = await fetch(`${API}/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
	});
	if (!res.ok) {
		throw new Error(`login failed (${res.status}): ${await res.text()}`);
	}
	const data = await res.json();
	const token = data.access_token || data.token || data.accessToken;
	const userId = data.user?.id;
	if (!token || !userId) throw new Error(`login response missing token/user.id: ${JSON.stringify(data)}`);
	return { token, userId };
}

// `PUT .../draft` and `POST .../publish` are internal-API-key routes that ALSO require a real
// admin's UUID in X-Actor-User-Id (the backend looks the user up and checks their role's
// "editorial.write" capability -- see app/auth/dependencies.py::actor_capability). The plain
// upsert route only reads that header back as a free-text label, so passing it everywhere is
// harmless and keeps every write attributed to the same real actor.
function editorialHeaders(actorUserId) {
	return {
		"Content-Type": "application/json",
		"X-Internal-API-Key": INTERNAL_KEY,
		"X-Actor-User-Id": actorUserId,
	};
}

async function upsertEditorial(actorUserId, payload) {
	const res = await fetch(`${API}/editorial/internal/admin`, {
		method: "PUT",
		headers: editorialHeaders(actorUserId),
		body: JSON.stringify(payload),
	});
	if (!res.ok)
		throw new Error(`upsert ${payload.type}/${payload.slug} failed (${res.status}): ${await res.text()}`);
	return res.json();
}

async function saveDraftAndPublish(actorUserId, type, slug, draftDoc) {
	const draftRes = await fetch(
		`${API}/editorial/internal/admin/${encodeURIComponent(type)}/${encodeURIComponent(slug)}/draft`,
		{ method: "PUT", headers: editorialHeaders(actorUserId), body: JSON.stringify({ draft_doc: draftDoc }) },
	);
	if (!draftRes.ok)
		throw new Error(`draft ${type}/${slug} failed (${draftRes.status}): ${await draftRes.text()}`);

	const publishRes = await fetch(
		`${API}/editorial/internal/admin/${encodeURIComponent(type)}/${encodeURIComponent(slug)}/publish`,
		{ method: "POST", headers: editorialHeaders(actorUserId), body: JSON.stringify({ publishedAt: null }) },
	);
	if (!publishRes.ok) {
		throw new Error(`publish ${type}/${slug} failed (${publishRes.status}): ${await publishRes.text()}`);
	}
	return publishRes.json();
}

async function createCatalogProduct(token, payload) {
	const res = await fetch(`${API}/catalog/`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
		body: JSON.stringify(payload),
	});
	if (res.status === 409) {
		console.log(`SKIP: product ${payload.slug} already exists`);
		return null;
	}
	if (!res.ok) throw new Error(`create product ${payload.slug} failed (${res.status}): ${await res.text()}`);
	console.log(`OK: product ${payload.slug} created`);
	return res.json();
}

const LIVROS_CATEGORY = { name: "Livros", slug: "livros" };

const PRODUCTS = [
	{
		id: "product_ninfas-do-tiete",
		slug: "ninfas-do-tiete",
		name: "Ninfas do Tietê",
		description:
			"Primeiro livro da trilogia *s3xo são paulo* de literatura erótica criada por Natália Nolli Sasso.",
		images: [`${IMG}/livro-ninfas-do-tiete-capa.webp`, `${IMG}/livro-ninfas-do-tiete-alt.webp`],
		category: LIVROS_CATEGORY,
		stock: 50,
		product_type: "book",
		format: "print",
		order: 3,
		published: true,
		variants: [
			{
				id: "variant_ninfas-do-tiete_impresso",
				label: "Impresso",
				slug: "impresso",
				price: 4900,
				currency: "BRL",
				images: [`${IMG}/livro-ninfas-do-tiete-capa.webp`],
				stock: 50,
				published: true,
				order: 1,
				description: [
					"*Ninfas do Tietê* recria uma cidade dentro de outra cidade: é uma São Paulo das Ninfas, mulheres soltas pelas ruas e imaginários de uma cidade vibrante, pulsante, e ao mesmo tempo tensa e desejosa.",
					"O livro é um convite aberto ao leitor e à leitora para mergulhar nas águas de um rio Tietê habitado por criaturas e Ninfas, e por paixões que saltam e assombram ruas, rios, sonhos e espaços da cidade de São Paulo.",
					"Escrito originalmente em 2016, no contexto do Golpe contra a então Presidenta Dilma Rousseff, teve sua primeira edição publicada em 2018. Está hoje na segunda edição revisada, com ilustrações especialmente criadas pela artista Vanusa Passos.",
					"#### Trecho — *canto interrompido*",
					"> me amordaçaram / me cortaram a garganta / me chamaram de pilantra / me pisaram feito chão\n>\n> me lincharam viva / apedrejaram minhas costas / minhas pernas / me fizeram morta porque adúltera\n>\n> então soube / de onde vinha o ódio de todos os séculos",
					"#### Ficha técnica",
					"- Autora: Natália Nolli Sasso\n- Ilustrações (2ª edição): Vanusa Passos\n- 1ª edição: 2018 · Editora Moinhos · 60 páginas · brochura · ISBN 978-85-92579-81-4\n- 2ª edição: 2021 · Selo Libertária · revisada e ilustrada\n- Também em: audiolivro gratuito",
				].join("\n\n"),
			},
		],
	},
	{
		id: "product_sexo-estranho-com-desconhecidos-em-lugares-improprios",
		slug: "sexo-estranho-com-desconhecidos-em-lugares-improprios",
		name: "sexo estranho com desconhecidos em lugares impróprios",
		description:
			"Segundo livro da trilogia *s3xo são paulo* de literatura erótica da escritora Natália Nolli Sasso.",
		images: [`${IMG}/livro-sexo-estranho-capa.webp`, `${IMG}/livro-sexo-estranho-alt.webp`],
		category: LIVROS_CATEGORY,
		stock: 50,
		product_type: "book",
		format: "print",
		order: 4,
		published: true,
		variants: [
			{
				id: "variant_sexo-estranho-com-desconhecidos-em-lugares-improprios_impresso",
				label: "Impresso",
				slug: "impresso",
				price: 7800,
				currency: "BRL",
				images: [`${IMG}/livro-sexo-estranho-capa.webp`],
				stock: 50,
				published: true,
				order: 1,
				description: [
					"A partir da vivência e da observação sensível de quem mora há mais de uma década na região central de São Paulo, Natália deu vida a uma coleção erótica e amorosa de poesias: situações de sedução, transas, flertes e paixões numa metrópole com linhas, ruas e espaços públicos abertos ao prazer.",
					"Por vezes bem-humorado, por outras bastante transgressor, o livro traz poesias que se parecem com homenagens a bairros, odes às linhas de transporte público e pequenas histórias que passam rapidamente por nós em trechos da cidade que amorosamente recendem a sexo e liberdade, charme e tensão urbana. Em outras partes, o livro traz poesias com tom de manifesto feminista e libertário.",
					'> "O livro é uma viagem por São Paulo através da visão erótica e singular da autora Natália Nolli Sasso." — **Veja SP**',
					'> "possível conhecer São Paulo, apenas experimentá-la, com o corpo, cair de boca, de amores, de tesão. este livro alcança o ponto G da cidade." — **Talles Azigon**, poeta e editor',
					"#### Trecho — *sexo expresso*",
					"> música, letra / playlist perfeita / sequência ininterrupta / seis horas brutas / de prazer / sem intervalo.\n>\n> aqui ninguém é inocente.",
					"#### Ficha técnica",
					"- Autora: Natália Nolli Sasso\n- Ilustrações: Persie Oliveira\n- Arte: Daniel Firmino\n- Revisão: Talles Azigon\n- Publicação: 2020 · Selo Libertária\n- Contemplado pelo edital ProAC de Poesia\n- Também em: audiolivro gratuito",
				].join("\n\n"),
			},
		],
	},
	{
		id: "product_virus-do-beijo",
		slug: "virus-do-beijo",
		name: "vírus do beijo",
		description: "Terceiro livro da trilogia *s3xo são paulo*, de Natália Nolli Sasso.",
		images: [`${IMG}/livro-virus-do-beijo-capa.webp`, `${IMG}/livro-virus-do-beijo-alt.webp`],
		category: LIVROS_CATEGORY,
		stock: 50,
		product_type: "book",
		format: "print",
		order: 5,
		published: true,
		variants: [
			{
				id: "variant_virus-do-beijo_impresso",
				label: "Impresso",
				slug: "impresso",
				price: 5800,
				currency: "BRL",
				images: [`${IMG}/livro-virus-do-beijo-capa.webp`],
				stock: 50,
				published: true,
				order: 1,
				description: [
					"De Natália Nolli Sasso, com desenhos criados por Deanna Ribeiro e arte e design de Bárbara Gabriela.",
					"**este livro vai te beijar debaixo de chuva.**",
					"*para que serve um livro se ele não conversar com você nas horas difíceis?*",
					"#### Ficha técnica",
					"- Autora: Natália Nolli Sasso\n- Desenhos: Deanna Ribeiro\n- Arte e design: Bárbara Gabriela\n- Lançamento: setembro de 2023\n- Páginas: 112\n- Edição e distribuição: Selo Libertária · São Paulo/SP",
				].join("\n\n"),
			},
		],
	},
];

const PROJECTS = [
	[
		"laboratorio-escritas-dissidentes",
		"Laboratório de escritas dissidentes",
		10,
		{
			summary: "Laboratório de criação e edição de textos literários na chave da dissidência.",
			description:
				"*Poéticas dissidentes, corpas/os insurgentes* é um laboratório de criação e edição de textos literários coordenado por Natália Nolli Sasso, para quem quer conhecer, ler e escrever dentro da chave da dissidência. Encontros semanais durante 3 meses. Realização: Centro de Pesquisa e Formação do Sesc São Paulo. Fotos: Alan Fujito.",
			period: "2025",
			location: "Sesc São Paulo",
			featured: true,
			image: {
				src: `${IMG}/capa-projeto-laboratorio-escritas-dissidentes.webp`,
				alt: "Natália Nolli Sasso conduzindo o Laboratório de escritas dissidentes no Sesc",
			},
		},
	],
	[
		"sarau-levante",
		"Sarau Levante",
		20,
		{
			summary: "Sarau apresentado e organizado por Natália Nolli Sasso, com poetas convidadxs.",
			description:
				"Sarau apresentado e organizado por Natália Nolli Sasso, com poetas convidadxs. Apresenta poetas e poesias brasileiras. Fotos: Alan Fujito.",
			period: "2025",
			location: "Sesc Campo Limpo",
			image: {
				src: `${IMG}/capa-projeto-sarau-levante.webp`,
				alt: "Artistas no palco durante o Sarau Levante, no Sesc Campo Limpo",
			},
		},
	],
	[
		"livro-de-venus",
		"Livro de Vênus",
		30,
		{
			summary: "Laboratório de criação e edição de escritos eróticos.",
			description:
				"Laboratório de criação e edição de escritos eróticos. Orientação de pesquisa, produção e edição de textos literários eróticos, com estratégias propostas pela escritora e editora. Encontros semanais por cerca de dois meses. Coordenação: Natália Nolli Sasso. Fotos: Alan Fujito.",
			period: "2024–2025",
			location: "Sesc Av. Paulista e Sesc Ipiranga",
			image: {
				src: `${IMG}/capa-projeto-livro-de-venus.webp`,
				alt: "Retrato em preto e branco ligado ao laboratório Livro de Vênus",
			},
		},
	],
	[
		"festival-mario-de-andrade-2024",
		"Festival Mário de Andrade",
		40,
		{
			summary: "Participação da autora e do Selo Libertária no Festival Mário de Andrade.",
			description:
				"Participação da autora Natália Nolli Sasso e do Selo Libertária no Festival Mário de Andrade.",
			period: "2024",
			location: "São Paulo",
			image: {
				src: `${IMG}/capa-projeto-festival-mario-de-andrade.webp`,
				alt: "Natália Nolli Sasso ao microfone no Festival Mário de Andrade, 2024",
			},
		},
	],
	[
		"flipenha-2022",
		"Flipenha",
		50,
		{
			summary: "Roda de conversa: Sexualidade e Literatura erótica, com Amara Moira.",
			description:
				"Roda de conversa com escritoras: *Sexualidade e Literatura erótica*, com Amara Moira e Natália Nolli Sasso. Mediação de Gabriela da Silva Prado. Biblioteca José Paulo Paes / Centro Cultural da Penha.",
			period: "2022",
			location: "Centro Cultural da Penha",
			image: {
				src: `${IMG}/capa-projeto-flipenha-2022.webp`,
				alt: "Cartaz da Flipenha 2022: roda de conversa sobre sexualidade e literatura erótica com Amara Moira e Natália Nolli Sasso",
			},
		},
	],
	[
		"lancamento-ninfas-do-tiete",
		"Lançamento de Ninfas do Tietê",
		60,
		{
			summary: "Lançamento da primeira edição, na Mostra Solo Mulheres.",
			description:
				"Lançamento da primeira edição, dentro da Mostra Solo Mulheres. Na mesma noite estreou a videoperformance homônima, criada a partir das poesias do livro — criação de Natália Nolli Sasso, direção e edição de Sol Fagnello, assistência de Tati Caltabiano, com performance de todas elas, Thiane Nascimento, Ana Zeppa, Cícero Andrade e Loraine Dazária.",
			period: "2018",
			location: "Teatro de Contêiner Mungunzá",
			image: {
				src: `${IMG}/capa-projeto-lancamento-ninfas-do-tiete.webp`,
				alt: "Projeção em vermelho durante o lançamento de Ninfas do Tietê no Teatro de Contêiner",
			},
		},
	],
];

const ABOUT_CONTENT = {
	hero: {
		eyebrow: "Sobre o selo",
		title: "O Selo Libertária publica corpos, cidades, desejos e linguagens que escapam das margens.",
		body: "Uma livraria para adultos pode ser quente, literária e sensual sem se tornar visualmente óbvia. É isso que o Selo Libertária persegue desde o primeiro livro: erotismo como linguagem e como posição política, não como embalagem.",
	},
	section: {
		eyebrow: "A autora",
		title: "Natália Nolli Sasso",
		body: "Escritora, pesquisadora e editora. Autora de *Ninfas do Tietê* (2018, segunda edição revisada em 2021), *sexo estranho com desconhecidos em lugares impróprios* (2020) e *vírus do beijo* (2023), todos em formato impresso e sonoro. É a criadora do Sarau Safado e está à frente do Selo Libertária.",
		extended:
			"Mora há mais de uma década na região central de São Paulo — e é dessa vivência que sai boa parte do que escreve. Realizou edições do Sarau em parceria com bibliotecas da rede municipal de São Paulo em 2020 e 2021, período em que foi contemplada pelo edital ProAC de Poesia para publicar seu segundo livro de poesias eróticas. Coordena laboratórios de escrita no Sesc São Paulo — *Livro de Vênus* e *Poéticas dissidentes, corpas/os insurgentes* — e já participou do Festival Mário de Andrade, da Flipenha e da Mostra Solo Mulheres.",
		image: {
			src: `${IMG}/natalia-nolli-sasso-sarau-safado.webp`,
			alt: "Cartaz do Sarau Safado sobre um microfone iluminado por luz vermelha",
			caption: "Sarau Safado",
		},
		primaryCtaLabel: "Conhecer Sarau Safado",
		primaryCtaHref: "/sarau-safado",
	},
	cards: [
		{
			eyebrow: "Literatura",
			title: "O erotismo através da linguagem.",
			body: "Poesia que não pede licença e não explica o desejo.",
		},
		{
			eyebrow: "Cidade e corpo",
			title: "São Paulo como texto.",
			body: "Ruas, linhas de transporte e espaços públicos lidos pelo corpo.",
		},
		{
			eyebrow: "Publicação autoral",
			title: "O livro como objeto cultural.",
			body: "Ilustração, arte, revisão e performance tratadas como parte da obra.",
		},
		{
			eyebrow: "Acessibilidade",
			title: "Audiolivros gratuitos desde 2020.",
			body: "Porque muita gente não lê, e os motivos são muitos.",
		},
	],
	closing: {
		eyebrow: "Manifesto",
		title: "A programação e a autoria se reforçam mutuamente",
		body: "O selo reúne, distribui, comercializa e edita suas publicações — com artistas e colaboradorxs convidadxs a cada projeto — e produz trabalhos em performance, literatura e o Sarau Safado. Literatura, performance e presença urbana aparecem aqui como uma mesma linha curatorial: a programação e a autoria se reforçam mutuamente.",
		coreEyebrow: "Princípio central",
		coreTitle:
			"Uma livraria para adultos pode ser quente, literária e sensual sem se tornar visualmente óbvia.",
	},
};

function block(id, type, fields) {
	return { id, type, width: null, section: null, row: null, column: null, ...fields };
}

const ABOUT_DOC = [
	block("about-hero-eyebrow", "paragraph", { text: ABOUT_CONTENT.hero.eyebrow }),
	block("about-hero-title", "heading", { level: 2, text: ABOUT_CONTENT.hero.title }),
	block("about-hero-body", "paragraph", { text: ABOUT_CONTENT.hero.body }),
	block("about-section-eyebrow", "paragraph", { text: ABOUT_CONTENT.section.eyebrow }),
	block("about-section-title", "heading", { level: 2, text: ABOUT_CONTENT.section.title }),
	block("about-section-body", "paragraph", { text: ABOUT_CONTENT.section.body }),
	block("about-section-cta-label", "button", {
		label: ABOUT_CONTENT.section.primaryCtaLabel,
		href: ABOUT_CONTENT.section.primaryCtaHref,
		variant: "secondary",
	}),
	block("about-press-title", "heading", { level: 3, text: "Na imprensa" }),
	block("about-press-items", "list", {
		style: "bullet",
		items: [
			"Prazeres com palavras — literatura erótica e feminismo, por Natália Nolli Sasso, para a revista do Centro de Pesquisa e Formação do Sesc São Paulo",
			"Quando o erotismo é chama libertária — Outras Palavras, sobre *sexo estranho com desconhecidos em lugares impróprios*",
			"Ninfas do Tietê — resenha da primeira edição, São Paulo Review",
			"Ninfas do Tietê — resenha em vídeo, canal Livraneios",
		],
	}),
	block("about-press-quote", "quote", {
		text: "O livro é uma viagem por São Paulo através da visão erótica e singular da autora Natália Nolli Sasso.",
		attribution: "Veja SP, sobre *sexo estranho*",
	}),
	block("about-closing-eyebrow", "paragraph", { text: ABOUT_CONTENT.closing.eyebrow }),
	block("about-closing-title", "heading", { level: 2, text: ABOUT_CONTENT.closing.title }),
	block("about-closing-body", "paragraph", { text: ABOUT_CONTENT.closing.body }),
	block("about-closing-core-eyebrow", "paragraph", { text: ABOUT_CONTENT.closing.coreEyebrow }),
	block("about-closing-core-title", "paragraph", { text: ABOUT_CONTENT.closing.coreTitle }),
];

async function run() {
	console.log(`Backend: ${API}`);

	const { token, userId } = await login();
	console.log(`Logged in as ${ADMIN_EMAIL} (${userId})`);

	for (const [slug, title, order, content] of PROJECTS) {
		await upsertEditorial(userId, { type: "project", slug, title, content, published: true, order });
		console.log(`OK: project/${slug}`);
	}

	await upsertEditorial(userId, {
		type: "page_about",
		slug: "about",
		title: "about",
		content: ABOUT_CONTENT,
		published: true,
		order: 0,
	});
	console.log("OK: page_about legacy content (cards, author photo, extended bio)");

	await saveDraftAndPublish(userId, "page_about", "about", ABOUT_DOC);
	console.log("OK: page_about contentDoc (hero/section/press/closing text) published");

	for (const product of PRODUCTS) {
		await createCatalogProduct(token, product);
	}
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
