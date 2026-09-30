import { expect, test } from "@playwright/test";
import { API_URL, shot, watch } from "./support/qa";

/**
 * Admin > Configurações > Status da loja: turn the storefront off and on again from the UI and prove the
 * customer-facing effect each time. The spec ends with the store ACTIVATED so the public/shopper specs
 * (and tomorrow's manual tests) run against an open store.
 */
test.use({ storageState: "e2e/journeys/.auth/preprod-admin.json" });
test.describe.configure({ mode: "serial" });

async function publicActivated(request: import("@playwright/test").APIRequestContext) {
	return (await (await request.get(`${API_URL()}/site-activation/public`)).json()).activated === true;
}

async function setStore(page: import("@playwright/test").Page, on: boolean) {
	await page.goto("/admin/settings");
	await expect(page.getByText("Status da loja").first()).toBeVisible({ timeout: 30_000 });
	const toggle = page.getByRole("button", { name: on ? "Ativar loja" : "Desativar loja" });
	if (!(await toggle.isVisible())) return; // already in the requested state
	page.once("dialog", (dialog) => void dialog.accept());
	await toggle.click();
	await expect(page.getByText(on ? "Loja no ar" : "Loja desativada", { exact: true })).toBeVisible({
		timeout: 30_000,
	});
}

test("Settings shows the current store status and the control", async ({ page }, testInfo) => {
	await page.goto("/admin/settings");
	await expect(page.getByText("Status da loja").first()).toBeVisible({ timeout: 30_000 });
	await expect(page.getByText(/Loja (no ar|desativada)/)).toBeVisible();
	await shot(page, testInfo, "settings-store-status");
});

test("admin deactivates the store: customers get the maintenance page, admin keeps working", async ({
	page,
	browser,
	request,
}, testInfo) => {
	await setStore(page, false);
	expect(await publicActivated(request)).toBe(false);
	await shot(page, testInfo, "settings-store-deactivated");

	const anon = await browser.newContext({ storageState: { cookies: [], origins: [] } });
	const visitor = await anon.newPage();
	await visitor.goto("/");
	await expect(visitor).toHaveURL(/\/maintenance/);
	await shot(visitor, testInfo, "visitor-sees-maintenance");
	await anon.close();

	// The admin is NOT thrown into the launch wizard (regression: /admin redirected to /ativacao).
	const health = watch(page);
	await page.goto("/admin/editorial");
	await expect(page).toHaveURL(/\/admin\/editorial$/);
	await expect(page.getByText("Loja em manutenção")).toBeVisible();
	await shot(page, testInfo, "admin-editorial-while-deactivated");
	await health.expectClean("admin editorial while deactivated");
});

test("admin activates the store: customers get the real site", async ({
	page,
	browser,
	request,
}, testInfo) => {
	await setStore(page, true);
	expect(await publicActivated(request)).toBe(true);
	await shot(page, testInfo, "settings-store-activated");

	const anon = await browser.newContext({ storageState: { cookies: [], origins: [] } });
	const visitor = await anon.newPage();
	const health = watch(visitor);
	await visitor.goto("/");
	await expect(visitor).not.toHaveURL(/\/maintenance/);
	await expect(visitor.locator("main").first()).toBeVisible({ timeout: 30_000 });
	await shot(visitor, testInfo, "visitor-sees-store-home");
	await health.expectClean("home as visitor");
	await anon.close();
});
