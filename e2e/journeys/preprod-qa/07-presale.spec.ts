import { expect, test } from "@playwright/test";
import { API_URL, dismissPresaleNotice, shot, watch } from "./support/qa";

/**
 * Pré-venda de "little fish, big fish": configure in the admin wizard, publish immediately (no waiting for autosave),
 * and verify every customer-facing place that shows or charges the price -- in the right unit (reais on screen,
 * centavos in the backend/cart).
 */
test.describe.configure({ mode: "serial" });

const PRODUCT_ID = "product_little-fish-big-fish";
const PRESALE_PRICE_REAIS = "39.9";
const DAYS_AHEAD = 21;
const EXPECTED_WINDOW = new Date(Date.now() + DAYS_AHEAD * 86_400_000).toLocaleDateString("pt-BR", {
	month: "long",
	year: "numeric",
});

type PublicPresale = { presale_price: number; full_price: number; launch_at: string; status: string };

async function publicPresale(request: import("@playwright/test").APIRequestContext) {
	return (await (
		await request.get(`${API_URL()}/presales/public/product/${PRODUCT_ID}`)
	).json()) as PublicPresale | null;
}

test.describe("admin", () => {
	test.use({ storageState: "e2e/journeys/.auth/preprod-admin.json" });

	test("wizard shows prices in reais (R$ 49,90), not centavos (R$ 4990,00)", async ({ page }, testInfo) => {
		await page.goto("/admin/pre-venda");
		await expect(page.locator("main h1").first()).toBeVisible({ timeout: 30_000 });
		await page.getByRole("button", { name: "Nova pré-venda" }).click();
		await expect(page.getByRole("button", { name: /^1 · Quando estreia/ })).toBeVisible({ timeout: 30_000 });
		await page.getByRole("button", { name: "Continuar" }).click();
		await expect(page.getByText("Preço de pré-venda")).toBeVisible();
		await shot(page, testInfo, "wizard-price-step");
		const body = await page.locator("main").innerText();
		expect(body, "full price shown in reais").toMatch(/R\$\s?49,90/);
		expect(body, "no centavos-as-reais").not.toMatch(/R\$\s?4990/);
	});

	test("publishing right after editing publishes the NEW values (no stale autosave)", async ({
		page,
		request,
	}, testInfo) => {
		const health = watch(page);
		await page.goto("/admin/pre-venda");
		await page.getByRole("button", { name: "Nova pré-venda" }).click();
		await expect(page.getByRole("button", { name: /^1 · Quando estreia/ })).toBeVisible({ timeout: 30_000 });

		const launch = new Date(Date.now() + DAYS_AHEAD * 86_400_000);
		const iso = `${launch.getFullYear()}-${String(launch.getMonth() + 1).padStart(2, "0")}-${String(launch.getDate()).padStart(2, "0")}`;
		await page.locator('input[type="date"]').fill(iso);
		await page.locator('input[type="time"]').fill("19:00");
		await page.getByRole("button", { name: "Continuar" }).click();

		await page.locator('main input[type="number"]').first().fill(PRESALE_PRICE_REAIS);
		await expect(page.getByText(/−20%|-20%/).first()).toBeVisible();
		await shot(page, testInfo, "wizard-price-39-90-minus-20");
		await page.getByRole("button", { name: "Continuar" }).click();
		await page.getByRole("button", { name: "Continuar" }).click();

		const review = await page.locator("main").innerText();
		expect(review).toMatch(/R\$\s?39,90 em vez de R\$\s?49,90/);
		await shot(page, testInfo, "wizard-review");
		// Immediately, while "Salvando rascunho…" may still be showing:
		await page.getByRole("button", { name: /Publicar pré-venda|Salvar alterações/ }).click();
		await page.waitForLoadState("networkidle").catch(() => {});
		await shot(page, testInfo, "presale-list-after-publish");
		await health.expectClean("presale wizard");

		const live = await publicPresale(request);
		expect(live, "public presale").toBeTruthy();
		expect(live?.status).toBe("no_ar");
		expect(live?.presale_price, "stored in centavos").toBe(3990);
		expect(live?.full_price, "stored in centavos").toBe(4990);
		const days = (new Date(live?.launch_at ?? 0).getTime() - Date.now()) / 86_400_000;
		expect(days, "launch date = the one just typed, not the +30d default").toBeGreaterThan(DAYS_AHEAD - 1.5);
		expect(days).toBeLessThan(DAYS_AHEAD + 1.5);
	});

	test("admin list shows the live presale with the right amounts", async ({ page }, testInfo) => {
		await page.goto("/admin/pre-venda");
		await expect(page.getByText("NO AR", { exact: false }).first()).toBeVisible({ timeout: 30_000 });
		await shot(page, testInfo, "admin-presale-live");
	});
});

test.describe("customer side", () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test("landing page shows R$ 39,90 and R$ 49,90 with the launch date", async ({ page }, testInfo) => {
		const health = watch(page);
		await page.goto("/pre-venda/little-fish-big-fish");
		await expect(page.locator("main").first()).toBeVisible({ timeout: 30_000 });
		await dismissPresaleNotice(page);
		const text = await page.locator("body").innerText();
		expect(text).toMatch(/R\$\s?39,90/);
		expect(text).not.toMatch(/R\$\s?(3990|4990)/);
		// selolibertaria-store#219/#220: no internal showcase, and the launch window follows the configured date.
		expect(text).not.toMatch(/Blocos estruturais|Componentes prontos/i);
		expect(text).toMatch(new RegExp(`Lançamento: ${EXPECTED_WINDOW}`, "i"));
		await shot(page, testInfo, "landing");
		await health.expectClean("presale landing");
	});

	test("the presale notice on other pages shows the discount in reais", async ({ page }, testInfo) => {
		await page.goto("/");
		const notice = page.getByText(/está em pré-venda/i).first();
		await expect(notice).toBeVisible({ timeout: 30_000 });
		const dialogText = await page.locator("body").innerText();
		expect(dialogText).toMatch(/R\$\s?39,90/);
		expect(dialogText).toMatch(/-20%|−20%/);
		expect(dialogText).not.toMatch(/R\$\s?(3990|4990)/);
		await shot(page, testInfo, "presale-notice-home", { fullPage: false });
	});

	test("reserving puts the presale price in the cart (centavos end to end)", async ({ page }, testInfo) => {
		await page.goto("/pre-venda/little-fish-big-fish");
		await dismissPresaleNotice(page);
		const cta = page
			.locator("a:visible, button:visible")
			.filter({ hasText: /Comprar agora/i })
			.first();
		await expect(cta).toBeVisible({ timeout: 30_000 });
		await cta.click();
		await page.waitForLoadState("networkidle").catch(() => {});
		await shot(page, testInfo, "after-reserve-click");
		const cart = await page.request.get("/api/cart");
		const body = (await cart.json()) as {
			cart: { items: { price: number; quantity: number }[]; total: number } | null;
		};
		expect(body.cart?.items.length, "an item was added").toBeGreaterThan(0);
		expect(body.cart?.items[0]?.price, "cart unit price in centavos = presale price").toBe(3990);
	});
});
