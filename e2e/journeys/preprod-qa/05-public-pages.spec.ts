import { expect, type Page, test } from "@playwright/test";
import { API_URL, shot, watch } from "./support/qa";

/** Every public route as an anonymous visitor on the ACTIVATED preprod store, desktop + mobile. */
test.use({ storageState: { cookies: [], origins: [] } });

async function imagesAllLoaded(page: Page) {
	await page.waitForLoadState("networkidle").catch(() => {});
	return page.evaluate(async () => {
		const imgs = Array.from(document.images).filter(
			(img) => img.getBoundingClientRect().width > 0 && img.loading !== "lazy",
		);
		await Promise.all(
			imgs.map((img) =>
				img.complete
					? null
					: new Promise((r) => {
							img.onload = img.onerror = () => r(null);
						}),
			),
		);
		return imgs.filter((img) => img.naturalWidth === 0).map((img) => img.currentSrc || img.src);
	});
}

const STATIC_ROUTES: { path: string; name: string; mobile?: boolean }[] = [
	{ path: "/", name: "home", mobile: true },
	{ path: "/products", name: "loja", mobile: true },
	{ path: "/about", name: "sobre" },
	{ path: "/contact", name: "contato", mobile: true },
	{ path: "/events", name: "eventos" },
	{ path: "/projects", name: "projetos" },
	{ path: "/sarau-safado", name: "sarau-safado" },
	{ path: "/faq", name: "faq" },
	{ path: "/privacy", name: "privacidade" },
	{ path: "/terms", name: "termos" },
	{ path: "/login", name: "login", mobile: true },
	{ path: "/reset-password", name: "reset-password" },
	{ path: "/search?q=livro", name: "busca" },
];

for (const route of STATIC_ROUTES) {
	test(`public ${route.path} renders (desktop${route.mobile ? " + mobile" : ""})`, async ({
		page,
	}, testInfo) => {
		const health = watch(page);
		const res = await page.goto(route.path, { waitUntil: "domcontentloaded" });
		expect(res?.status(), `${route.path} status`).toBeLessThan(400);
		await expect(page).not.toHaveURL(/\/maintenance/);
		await expect(page.locator("main, form, h1").first()).toBeVisible({ timeout: 30_000 });
		const broken = await imagesAllLoaded(page);
		await shot(page, testInfo, `${route.name}-desktop`);
		expect(broken, `${route.path}: images that failed to load`).toEqual([]);
		await health.expectClean(route.path);
		if (route.mobile) {
			await page.setViewportSize({ width: 390, height: 844 });
			await page.reload({ waitUntil: "domcontentloaded" });
			await expect(page.locator("main").first()).toBeVisible();
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
			);
			await shot(page, testInfo, `${route.name}-mobile`);
			expect(overflow, `${route.path}: horizontal scroll on mobile (px)`).toBeLessThanOrEqual(1);
		}
	});
}

test("published editorial copy reaches the page (home shows the seeded hero text)", async ({
	page,
	request,
}) => {
	const docs = (await (await request.get(`${API_URL()}/editorial/public/page_home`)).json()) as {
		content_doc: { id: string; type: string; text?: string }[] | null;
	}[];
	const title = docs[0]?.content_doc?.find((b) => b.id === "home-hero-title")?.text;
	expect(title, "seeded home-hero-title").toBeTruthy();
	await page.goto("/");
	await expect(page.getByText(title as string).first()).toBeVisible({ timeout: 30_000 });
});

test("catalog: every published product opens its page", async ({ page, request }, testInfo) => {
	const catalog = (await (await request.get(`${API_URL()}/catalog/`)).json()) as {
		items: { slug: string }[];
	};
	const items = catalog.items ?? [];
	expect(items.length, "published products in preprod").toBeGreaterThan(0);
	for (const item of items) {
		const health = watch(page);
		const res = await page.goto(`/product/${item.slug}`, { waitUntil: "domcontentloaded" });
		expect(res?.status(), `/product/${item.slug}`).toBeLessThan(400);
		await expect(page.locator("main").first()).toBeVisible({ timeout: 30_000 });
		await shot(page, testInfo, `produto-${item.slug}`);
		await health.expectClean(`/product/${item.slug}`);
	}
});

test("an editorial project detail page opens", async ({ page, request }, testInfo) => {
	const projects = (await (await request.get(`${API_URL()}/editorial/public/project`)).json()) as {
		slug: string;
	}[];
	const first = projects[0];
	test.skip(!first, "no published projects in preprod");
	if (!first) return;
	const health = watch(page);
	const res = await page.goto(`/projects/${first.slug}`, { waitUntil: "domcontentloaded" });
	expect(res?.status()).toBeLessThan(400);
	await expect(page.locator("main").first()).toBeVisible();
	await shot(page, testInfo, `projeto-${first.slug}`);
	await health.expectClean("project detail");
});

test("unknown URLs show the friendly 404, not a crash", async ({ page }, testInfo) => {
	const res = await page.goto("/esta-pagina-nao-existe", { waitUntil: "domcontentloaded" });
	expect(res?.status()).toBe(404);
	await expect(page.locator("body")).not.toContainText(/Ooops, algo deu errado/i);
	await shot(page, testInfo, "404");
});

test("protected pages send an anonymous visitor to /login", async ({ page }) => {
	for (const path of ["/orders", "/user", "/admin"]) {
		await page.goto(path, { waitUntil: "domcontentloaded" });
		await expect(page, path).toHaveURL(/\/login/);
	}
});
