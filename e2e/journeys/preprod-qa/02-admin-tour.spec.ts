import { expect, test } from "@playwright/test";
import { shot, watch } from "./support/qa";

/**
 * Every admin screen reachable from the sidebar + the detail/new screens that need no data, opened with
 * the QA admin's session (saved by 01). A screen passes when it renders its heading, no error
 * boundary, and no console/5xx problems.
 */
test.use({ storageState: "e2e/journeys/.auth/preprod-admin.json" });

const SCREENS: { path: string; name: string }[] = [
	{ path: "/admin", name: "dashboard" },
	{ path: "/admin/editorial", name: "editorial-paginas" },
	{ path: "/admin/editorial/events", name: "editorial-eventos" },
	{ path: "/admin/editorial/projects", name: "editorial-projetos" },
	{ path: "/admin/media", name: "imagens" },
	{ path: "/admin/orders", name: "pedidos" },
	{ path: "/admin/products", name: "produtos" },
	{ path: "/admin/products/new", name: "produto-novo" },
	{ path: "/admin/products/categories", name: "categorias" },
	{ path: "/admin/promotions", name: "promocoes" },
	{ path: "/admin/pre-venda", name: "pre-vendas" },
	{ path: "/admin/users", name: "clientes" },
	{ path: "/admin/emails", name: "emails-enviados" },
	{ path: "/admin/email-templates", name: "modelos-de-email" },
	{ path: "/admin/webhooks", name: "pagamentos-recebidos" },
	{ path: "/admin/settings", name: "configuracoes" },
];

for (const screen of SCREENS) {
	test(`admin screen ${screen.path} renders cleanly`, async ({ page }, testInfo) => {
		const health = watch(page);
		const response = await page.goto(screen.path, { waitUntil: "domcontentloaded" });
		expect(response?.status(), `${screen.path} HTTP status`).toBeLessThan(400);
		await expect(page).toHaveURL(new RegExp(screen.path.replace(/\//g, "\\/")));
		await expect(page.locator("main h1, main .ad-head h1").first()).toBeVisible({ timeout: 30_000 });
		await page.waitForLoadState("networkidle").catch(() => {});
		await shot(page, testInfo, `admin-${screen.name}`);
		await health.expectClean(screen.path);
	});
}

test("admin sidebar navigation reaches every section by click", async ({ page }, testInfo) => {
	await page.goto("/admin");
	await expect(page.locator("main h1").first()).toBeVisible({ timeout: 30_000 });
	// The rail groups (Conteúdo / Operação / Sistema) form an exclusive accordion: open the group that
	// holds each target before clicking it.
	const targets: [string, RegExp][] = [
		["Páginas", /\/admin\/editorial$/],
		["Imagens", /\/admin\/media$/],
		["Pedidos", /\/admin\/orders$/],
		["Produtos", /\/admin\/products$/],
		["Promoções", /\/admin\/promotions$/],
		["Pré-vendas", /\/admin\/pre-venda$/],
		["Clientes", /\/admin\/users$/],
		["E-mails enviados", /\/admin\/emails$/],
		["Pagamentos recebidos", /\/admin\/webhooks$/],
	];
	for (const [label, url] of targets) {
		const target = page.getByRole("button", { name: new RegExp(`^${label}(\\s*\\d+)?$`) }).first();
		if (!(await target.isVisible())) {
			for (const summary of await page.locator("details > summary").all()) {
				await summary.click();
				if (await target.isVisible()) break;
			}
		}
		await target.click();
		await expect(page, `clicking "${label}"`).toHaveURL(url, { timeout: 30_000 });
		await expect(page.locator("main h1").first()).toBeVisible({ timeout: 30_000 });
	}
	await shot(page, testInfo, "sidebar-last-section");
});

test("admin shows the maintenance notice with the store toggle shortcut while deactivated", async ({
	page,
	request,
}, testInfo) => {
	const activated = (
		await (await request.get("https://api-preprod.selolibertaria.com.br/site-activation/public")).json()
	).activated;
	test.skip(activated === true, "Store is activated: no notice expected.");
	await page.goto("/admin");
	await expect(page.getByText("Loja em manutenção")).toBeVisible();
	await expect(page.getByRole("link", { name: "Status da loja" })).toBeVisible();
	await shot(page, testInfo, "admin-maintenance-notice");
});
