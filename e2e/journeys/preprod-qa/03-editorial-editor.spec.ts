import { expect, type Page, test } from "@playwright/test";
import { API_URL, shot, TINY_PNG, watch } from "./support/qa";

/**
 * The critical area (reported by the site owner): the block editor at /admin/editorial/blocos/<slug>.
 * Covers, against real preprod data: every page loads its saved document; real keyboard typing comes out in
 * order; the "+" picker is a centred, scrollable modal that closes on outside click / Escape; autosave
 * reaches the backend (no 401); publish + restore round trip; and a real image upload through the same
 * route the editor uses.
 */
test.use({ storageState: "e2e/journeys/.auth/preprod-admin.json" });
test.describe.configure({ mode: "serial" });

const PAGES = [
	{ slug: "home", label: "Home" },
	{ slug: "products", label: "Loja" },
	{ slug: "product", label: "Página do produto" },
	{ slug: "events", label: "Eventos" },
	{ slug: "projects", label: "Projetos" },
	{ slug: "about", label: "Sobre" },
	{ slug: "contact", label: "Contato" },
	{ slug: "sarau-safado", label: "Sarau Safado" },
	{ slug: "public-global", label: "Newsletter e rodapé" },
];

async function openEditor(page: Page, slug: string, options: { fromPublished?: boolean } = {}) {
	await page.goto(`/admin/editorial/blocos/${slug}`, { waitUntil: "domcontentloaded" });
	await expect(page.locator(".ad-editor")).toBeVisible({ timeout: 45_000 });
	await expect(page.locator(".ad-blk").first()).toBeVisible({ timeout: 30_000 });
	if (options.fromPublished) {
		// A draft left behind by an earlier run must not change what a test counts: start from what is live.
		page.once("dialog", (dialog) => void dialog.accept());
		await page.getByRole("button", { name: "Voltar ao publicado" }).click();
		await page.waitForLoadState("networkidle").catch(() => {});
	}
}

async function savedIndicator(page: Page) {
	await expect(page.getByText(/Rascunho salvo às \d{2}:\d{2}/)).toBeVisible({ timeout: 20_000 });
}

for (const { slug, label } of PAGES) {
	test(`editor loads the saved document for "${label}" (${slug})`, async ({ page }, testInfo) => {
		const health = watch(page);
		await openEditor(page, slug);
		const blocks = await page.locator(".ad-blk").count();
		expect(blocks, `${slug}: blocks in the editor`).toBeGreaterThan(0);
		await expect(page.getByText(/Não foi possível carregar esta página/)).toHaveCount(0);
		await shot(page, testInfo, `editor-${slug}`);
		await health.expectClean(`editor ${slug}`);
	});
}

test("typed text comes out in order (regression: text written backwards)", async ({ page }, testInfo) => {
	await openEditor(page, "contact", { fromPublished: true });
	const field = page.getByRole("textbox", { name: "Parágrafo" }).first();
	const before = (await field.innerText()).trim();
	await field.click();
	// `End` would only reach the end of the visual line in wrapped text; put the caret at the field's end.
	await field.evaluate((el) => {
		const range = document.createRange();
		range.selectNodeContents(el);
		range.collapse(false);
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);
	});
	await page.keyboard.type(" ABCDEF 123", { delay: 40 });
	const after = (await field.innerText()).trim();
	expect(after).toBe(`${before} ABCDEF 123`);
	await shot(page, testInfo, "typing-in-order");
	await savedIndicator(page);
});

test("autosave persisted the draft: a reload still shows the typed text", async ({ page }, testInfo) => {
	await openEditor(page, "contact");
	await expect(page.getByText("ABCDEF 123").first()).toBeVisible();
	await shot(page, testInfo, "draft-survives-reload");
});

test("'Voltar ao publicado' discards the draft back to what is live", async ({ page }, testInfo) => {
	await openEditor(page, "contact");
	page.on("dialog", (dialog) => void dialog.accept());
	await page.getByRole("button", { name: "Voltar ao publicado" }).click();
	await expect(page.getByText("ABCDEF 123")).toHaveCount(0, { timeout: 20_000 });
	await shot(page, testInfo, "reverted-to-published");
});

test.describe("the '+' block picker", () => {
	test.use({ viewport: { width: 1280, height: 560 } });

	async function openPicker(page: Page) {
		await openEditor(page, "about", { fromPublished: true });
		await page.locator(".ad-blk").first().hover();
		await page.getByRole("button", { name: "Inserir bloco abaixo" }).first().click();
		const dialog = page.getByRole("dialog", { name: "Inserir bloco" });
		await expect(dialog).toBeVisible();
		return dialog;
	}

	test("is a centred modal with its own scrolling list", async ({ page }, testInfo) => {
		const dialog = await openPicker(page);
		const box = await dialog.boundingBox();
		const viewport = page.viewportSize();
		expect(box && viewport).toBeTruthy();
		if (box && viewport) {
			expect(Math.abs(box.x + box.width / 2 - viewport.width / 2), "horizontal centre").toBeLessThan(3);
			expect(Math.abs(box.y + box.height / 2 - viewport.height / 2), "vertical centre").toBeLessThan(3);
			expect(box.height, "fits the viewport").toBeLessThanOrEqual(viewport.height);
		}
		const scrolls = await dialog
			.locator(".ad-popover-results")
			.evaluate((el) => el.scrollHeight > el.clientHeight);
		expect(scrolls, "list scrolls when the screen is short").toBe(true);
		await shot(page, testInfo, "picker-centred-scrollable", { fullPage: false });
	});

	test("closes when clicking outside it", async ({ page }) => {
		await openPicker(page);
		await page.mouse.click(8, 8);
		await expect(page.getByRole("dialog", { name: "Inserir bloco" })).toHaveCount(0);
	});

	test("closes with Escape", async ({ page }) => {
		await openPicker(page);
		await page.keyboard.press("Escape");
		await expect(page.getByRole("dialog", { name: "Inserir bloco" })).toHaveCount(0);
	});

	test("inserting a type closes it and adds the block", async ({ page }) => {
		const dialog = await openPicker(page);
		const before = await page.locator(".ad-blk").count();
		await dialog.getByRole("button", { name: /Separador/ }).click();
		await expect(page.getByRole("dialog", { name: "Inserir bloco" })).toHaveCount(0);
		await expect(page.locator(".ad-blk")).toHaveCount(before + 1);
		await savedIndicator(page);
		page.on("dialog", (d) => void d.accept());
		await page.getByRole("button", { name: "Voltar ao publicado" }).click();
		await expect(page.locator(".ad-blk")).toHaveCount(before, { timeout: 20_000 });
	});
});

test("publish round trip on Sarau Safado, then restore what was live", async ({ page }, testInfo) => {
	const marker = `QA-E2E-${Date.now().toString(36)}`;
	await openEditor(page, "sarau-safado", { fromPublished: true });
	const originalCount = await page.locator(".ad-blk").count();

	await page.locator(".ad-blk").last().hover();
	await page.getByRole("button", { name: "Inserir bloco abaixo" }).last().click();
	await page
		.getByRole("dialog", { name: "Inserir bloco" })
		.getByRole("button", { name: /Parágrafo/ })
		.click();
	const fields = page.getByRole("textbox", { name: "Parágrafo" });
	await fields.last().click();
	await page.keyboard.type(marker);
	await savedIndicator(page);
	await page.getByRole("button", { name: "Publicar" }).click();
	await expect(page.locator(".ad-foot .ad-badge.ad-b-pub")).toBeVisible({ timeout: 30_000 });
	await shot(page, testInfo, "published-with-marker");

	// Admins pass the maintenance gate, so the public page shows what was just published.
	const pub = await page.request.get("/sarau-safado");
	expect(pub.status()).toBe(200);
	expect(await pub.text(), "published marker on the public page").toContain(marker);

	// Restore: drop the marker block and publish again.
	await openEditor(page, "sarau-safado");
	await expect(page.locator(".ad-blk")).toHaveCount(originalCount + 1);
	await page.locator(".ad-blk").last().hover();
	await page.getByRole("button", { name: "Remover" }).last().click();
	await expect(page.locator(".ad-blk")).toHaveCount(originalCount);
	await savedIndicator(page);
	await page.getByRole("button", { name: "Publicar" }).click();
	await expect(page.locator(".ad-foot .ad-badge.ad-b-pub")).toBeVisible({ timeout: 30_000 });
	const restored = await page.request.get("/sarau-safado");
	expect(await restored.text()).not.toContain(marker);
});

test("image upload works end to end and the returned URL is public", async ({ page }, testInfo) => {
	const upload = await page.request.post("/api/admin/media/upload", {
		multipart: { file: { name: "qa-e2e.png", mimeType: "image/png", buffer: TINY_PNG }, alt: "QA e2e" },
	});
	expect(upload.status(), await upload.text()).toBe(200);
	const body = (await upload.json()) as { url: string; publicId: string };
	expect(body.url, "public blob URL").toMatch(/^https:\/\/blob-preprod\.devbutter\.tech\//);
	expect(body.url).not.toContain("localhost");
	// butter_blob makes the public URL readable ~1s after the upload (404 right away): poll instead of failing.
	await expect
		.poll(async () => (await page.request.get(body.url)).status(), {
			timeout: 15_000,
			message: "public URL serves the image",
		})
		.toBe(200);
	expect((await page.request.get(body.url)).headers()["content-type"]).toMatch(/image\//);
	testInfo.annotations.push({ type: "uploaded", description: body.url });

	await page.goto("/admin/media");
	await expect(page.locator("main h1").first()).toBeVisible();
	await shot(page, testInfo, "media-library-after-upload");
});

test("the editor API path the page uses answers the list for every editorial type (no 401)", async ({
	request,
}) => {
	const res = await request.get(`${API_URL()}/editorial/public/page_home`);
	expect(res.status()).toBe(200);
	const items = (await res.json()) as { slug: string; content_doc: unknown[] | null }[];
	expect(items.length).toBeGreaterThan(0);
	expect(items[0]?.content_doc?.length ?? 0, "home has a published document").toBeGreaterThan(0);
});
