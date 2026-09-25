/**
 * Full admin nav smoke: as a logged-in ADMIN, every route reachable from the
 * Oficina v2 rail (src/app/admin/_components/nav-config.ts) plus its dynamic
 * detail pages should render real content — no console error/pageerror, no
 * error boundary (src/app/error.tsx renders "Ooops, algo deu errado!"), and a
 * route-appropriate heading. Headings below are copied verbatim from each
 * page's own AdminEditorialHero title (or its own <h1>) — see the file: line
 * cited in each case's comment.
 */
import { test as base, expect } from "@playwright/test";
import { queryDb } from "../../support/fixtures";
import { ADMIN_STORAGE_STATE, ensureAdminStorageState } from "./support/admin-session";

// Overriding the built-in `storageState` fixture (rather than a static
// `test.use({ storageState: <path> })` + a separate `test.beforeAll` writing
// that path) so Playwright actually awaits the admin session's creation
// before building the context that reads it. The static-path + beforeAll
// combo raced: the context fixture for the first test tried to read the
// file before beforeAll had finished writing it, failing with a confusing
// "Error reading storage state ...: ENOENT" pointed at the wrong line.
const test = base.extend({
	storageState: async ({ playwright }, use, testInfo) => {
		// The first test to hit this fixture pays for the whole register +
		// (best-effort) verify + login flow; the default 30s test timeout
		// counts fixture setup time against the test, so bump it here.
		testInfo.setTimeout(Math.max(testInfo.timeout, 150_000));
		await ensureAdminStorageState(playwright.chromium);
		await use(ADMIN_STORAGE_STATE);
	},
});

// Deliberately NOT `mode: "serial"` — each route case is an independent
// check, and a real failure in one page shouldn't skip every route after it
// (workers:1 + fullyParallel:false in playwright.config.ts already keeps
// these running one at a time / in file order).

type RouteCase = {
	path: string;
	label: string;
	/** Regex/string matched against an on-page heading. Omit only when the route is a redirect. */
	heading?: string | RegExp;
	/** Some routes (blocos bare index) intentionally redirect elsewhere. */
	expectRedirectTo?: string | RegExp;
};

const staticRoutes: RouteCase[] = [
	{ path: "/admin", label: "dashboard", heading: "Painel de operação" },
	{ path: "/admin/products", label: "Produtos", heading: "Catálogo de livros" },
	{ path: "/admin/products/new", label: "Produtos > novo", heading: "Novo livro" },
	{ path: "/admin/products/categories", label: "Produtos > categorias", heading: "Mapa de categorias" },
	{ path: "/admin/editorial", label: "Páginas", heading: "Páginas" },
	{ path: "/admin/editorial/about", label: "Páginas > about", heading: "Sobre" },
	{
		path: "/admin/editorial/blocos",
		label: "Páginas > blocos (bare index)",
		expectRedirectTo: "/admin/editorial",
		heading: "Páginas",
	},
	{ path: "/admin/editorial/blocos/home", label: "Páginas > blocos > home", heading: "Home" },
	{ path: "/admin/editorial/contact", label: "Páginas > contact", heading: "Contato" },
	{ path: "/admin/editorial/events", label: "Eventos", heading: "Eventos" },
	{ path: "/admin/editorial/events/new", label: "Eventos > novo", heading: "Novo evento" },
	{ path: "/admin/editorial/global", label: "Páginas > global", heading: "Newsletter e rodapé" },
	{ path: "/admin/editorial/home", label: "Páginas > home", heading: "Página inicial" },
	{
		path: "/admin/editorial/pagina-do-produto",
		label: "Páginas > pagina-do-produto",
		heading: "Página do produto",
	},
	{ path: "/admin/editorial/products", label: "Páginas > products", heading: "Produtos e catálogo" },
	{ path: "/admin/editorial/projects", label: "Projetos", heading: "Projetos" },
	{ path: "/admin/editorial/projects/new", label: "Projetos > novo", heading: "Novo projeto" },
	{ path: "/admin/editorial/sarau-safado", label: "Páginas > sarau-safado", heading: "Sarau Safado" },
	{ path: "/admin/media", label: "Imagens", heading: "Biblioteca de mídia" },
	{ path: "/admin/orders", label: "Pedidos", heading: "Pedidos" },
	{ path: "/admin/promotions", label: "Promoções", heading: "Promoções" },
	{ path: "/admin/pre-venda", label: "Pré-vendas", heading: "Pré-vendas" },
	{ path: "/admin/users", label: "Clientes", heading: "Usuários" },
	{ path: "/admin/emails", label: "E-mails enviados", heading: "E-mails transacionais" },
	{ path: "/admin/email-templates", label: "Modelos de e-mail", heading: "Modelos de email" },
	{ path: "/admin/webhooks", label: "Pagamentos recebidos", heading: "Recebimento de webhooks" },
	{ path: "/admin/settings", label: "Configurações", heading: "Configurações" },
];

const ERROR_BOUNDARY_TEXT = "Ooops, algo deu errado!";

// /admin/email-templates previews template HTML in a deliberately fully
// sandboxed iframe (sandbox="", no allow-scripts —
// src/app/admin/email-templates/_components/email-templates-preview.client.tsx:267),
// specifically so any <script> in a template can't execute. Chrome logs this
// exact console error whenever the sandboxed document happens to contain a
// script tag — that's the sandbox doing its job, not a bug, so it's excluded
// from the "no console errors" check below.
const EXPECTED_BENIGN_CONSOLE_ERRORS = [
	"Blocked script execution in 'about:srcdoc' because the document's frame is sandboxed and the 'allow-scripts' permission is not set.",
];

async function assertRealPage(
	page: import("@playwright/test").Page,
	route: RouteCase,
	consoleErrors: string[],
	pageErrors: string[],
) {
	const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
	expect(response, `${route.label} (${route.path}) should return a response`).not.toBeNull();
	expect(
		response!.status(),
		`${route.label} (${route.path}) should return HTTP 200, got ${response!.status()}`,
	).toBe(200);

	if (route.expectRedirectTo) {
		// Generous timeout: Next.js dev mode compiles a route on its first hit,
		// and this redirect only resolves once /admin/editorial/blocos itself
		// has compiled — on a cold dev server that can take longer than the
		// default 5s assertion timeout even though the redirect is otherwise
		// instant and reliable once warm.
		await expect(page).toHaveURL(route.expectRedirectTo, { timeout: 20_000 });
	}

	await expect(
		page.getByText(ERROR_BOUNDARY_TEXT),
		`${route.label} (${route.path}) rendered the global error boundary`,
	).toHaveCount(0);

	if (route.heading) {
		await expect(
			page.getByRole("heading", { name: route.heading }).first(),
			`${route.label} (${route.path}) is missing its expected heading`,
		).toBeVisible();
	} else {
		await expect(
			page.locator("h1, h2").first(),
			`${route.label} (${route.path}) has no heading at all`,
		).toBeVisible();
	}

	const unexpectedConsoleErrors = consoleErrors.filter(
		(text) => !EXPECTED_BENIGN_CONSOLE_ERRORS.includes(text),
	);
	expect(
		unexpectedConsoleErrors,
		`${route.label} (${route.path}) logged console errors: ${unexpectedConsoleErrors.join(" | ")}`,
	).toEqual([]);
	expect(
		pageErrors,
		`${route.label} (${route.path}) threw uncaught page errors: ${pageErrors.join(" | ")}`,
	).toEqual([]);
}

for (const route of staticRoutes) {
	test(`nav smoke: ${route.label} (${route.path})`, async ({ page }) => {
		const consoleErrors: string[] = [];
		const pageErrors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") consoleErrors.push(msg.text());
		});
		page.on("pageerror", (error) => pageErrors.push(error.message));

		await assertRealPage(page, route, consoleErrors, pageErrors);
	});
}

test("nav smoke: /admin/products/[slug] with a real product", async ({ page }) => {
	const raw = queryDb("select slug from catalog_products limit 1;").trim();
	test.skip(!raw, "No products exist in the DB to exercise /admin/products/[slug].");

	const consoleErrors: string[] = [];
	const pageErrors: string[] = [];
	page.on("console", (msg) => {
		if (msg.type() === "error") consoleErrors.push(msg.text());
	});
	page.on("pageerror", (error) => pageErrors.push(error.message));

	await assertRealPage(
		page,
		{ path: `/admin/products/${raw}`, label: `Produto ${raw}` },
		consoleErrors,
		pageErrors,
	);
});

test("nav smoke: /admin/orders/[id] with a real order", async ({ page }) => {
	const raw = queryDb("select id from orders order by created_at desc limit 1;").trim();
	test.skip(!raw, "No orders exist in the DB to exercise /admin/orders/[id].");

	const consoleErrors: string[] = [];
	const pageErrors: string[] = [];
	page.on("console", (msg) => {
		if (msg.type() === "error") consoleErrors.push(msg.text());
	});
	page.on("pageerror", (error) => pageErrors.push(error.message));

	await assertRealPage(
		page,
		{ path: `/admin/orders/${raw}`, label: `Pedido ${raw}`, heading: new RegExp(`Pedido ${raw}`) },
		consoleErrors,
		pageErrors,
	);
});

test("nav smoke: /admin/users/[id] with a real user", async ({ page }) => {
	const raw = queryDb("select id from users order by created_at desc limit 1;").trim();
	test.skip(!raw, "No users exist in the DB to exercise /admin/users/[id].");

	const consoleErrors: string[] = [];
	const pageErrors: string[] = [];
	page.on("console", (msg) => {
		if (msg.type() === "error") consoleErrors.push(msg.text());
	});
	page.on("pageerror", (error) => pageErrors.push(error.message));

	await assertRealPage(
		page,
		{ path: `/admin/users/${raw}`, label: `Usuário ${raw}` },
		consoleErrors,
		pageErrors,
	);
});

test("nav smoke: /admin/editorial/events/[slug] with a real event (if any exist)", async ({ page }) => {
	const raw = queryDb("select slug from editorial_content where type = 'event' limit 1;").trim();
	test.skip(!raw, "No editorial events exist in the DB to exercise /admin/editorial/events/[slug].");

	const consoleErrors: string[] = [];
	const pageErrors: string[] = [];
	page.on("console", (msg) => {
		if (msg.type() === "error") consoleErrors.push(msg.text());
	});
	page.on("pageerror", (error) => pageErrors.push(error.message));

	await assertRealPage(
		page,
		{ path: `/admin/editorial/events/${raw}`, label: `Evento ${raw}` },
		consoleErrors,
		pageErrors,
	);
});

test("nav smoke: /admin/editorial/projects/[slug] with a real project (if any exist)", async ({ page }) => {
	const raw = queryDb("select slug from editorial_content where type = 'project' limit 1;").trim();
	test.skip(!raw, "No editorial projects exist in the DB to exercise /admin/editorial/projects/[slug].");

	const consoleErrors: string[] = [];
	const pageErrors: string[] = [];
	page.on("console", (msg) => {
		if (msg.type() === "error") consoleErrors.push(msg.text());
	});
	page.on("pageerror", (error) => pageErrors.push(error.message));

	await assertRealPage(
		page,
		{ path: `/admin/editorial/projects/${raw}`, label: `Projeto ${raw}` },
		consoleErrors,
		pageErrors,
	);
});
