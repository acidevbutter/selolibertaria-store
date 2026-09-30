import { expect, test } from "@playwright/test";
import { API_URL, creds, login, shot, watch } from "./support/qa";

/**
 * Starting state of preprod is "maintenance on" (the default). This file documents the gate from the
 * customer's side and proves admins still get in; 04-activation-toggle.spec.ts flips it.
 */
test.describe.configure({ mode: "serial" });

test("public API reports the maintenance state", async ({ request }) => {
	const res = await request.get(`${API_URL()}/site-activation/public`);
	expect(res.status()).toBe(200);
	expect(await res.json()).toHaveProperty("activated");
});

test("anonymous visitors are sent to /maintenance (or see the open store if already activated)", async ({
	page,
	request,
}, testInfo) => {
	// Regression guard for selolibertaria-store#209: /maintenance must not GET /api/cart (503 in maintenance).
	const health = watch(page);
	const activated =
		(await (await request.get(`${API_URL()}/site-activation/public`)).json()).activated === true;
	await page.goto("/");
	if (activated) {
		await expect(page).not.toHaveURL(/\/maintenance/);
		await shot(page, testInfo, "home-store-open");
	} else {
		await expect(page).toHaveURL(/\/maintenance/);
		await expect(page.locator("body")).toContainText(/manuten/i);
		await shot(page, testInfo, "maintenance-page-anonymous");
		const api = await request.get(`${test.info().project.use.baseURL}/api/cart`, { failOnStatusCode: false });
		expect(api.status()).toBe(503);
		expect((await api.json()).code).toBe("MAINTENANCE_MODE");
	}
	await health.expectClean("maintenance page");
});

test("login page stays reachable during maintenance", async ({ page }, testInfo) => {
	await page.goto("/login");
	await expect(page).toHaveURL(/\/login/);
	await expect(page.locator("#login-email")).toBeVisible();
	await shot(page, testInfo, "login-page");
});

test("wrong password shows a specific message, not a server error", async ({ page }, testInfo) => {
	await page.goto("/login");
	await page.locator("#login-email").fill(creds.customer().email);
	await page.locator("#login-password").fill("Senha-Errada-123!");
	await page.getByRole("button", { name: "Entrar" }).click();
	await expect(page.getByText("Credenciais inválidas")).toBeVisible({ timeout: 20_000 });
	await shot(page, testInfo, "login-invalid-credentials");
});

test("admin logs in and lands in /admin even while the store is in maintenance", async ({
	page,
}, testInfo) => {
	const health = watch(page);
	await login(page, creds.admin());
	await expect(page).toHaveURL(/\/admin/);
	await expect(page.getByText("Páginas").first()).toBeVisible();
	await shot(page, testInfo, "admin-dashboard-after-login");
	await health.expectClean("admin dashboard");
	await page.context().storageState({ path: "e2e/journeys/.auth/preprod-admin.json" });
});

test("customer (non-admin) cannot log in during maintenance and sees why", async ({
	page,
	request,
}, testInfo) => {
	const activated =
		(await (await request.get(`${API_URL()}/site-activation/public`)).json()).activated === true;
	test.skip(activated, "Store already activated: customers may log in.");
	await page.goto("/login");
	await page.locator("#login-email").fill(creds.customer().email);
	await page.locator("#login-password").fill(creds.customer().password);
	await page.getByRole("button", { name: "Entrar" }).click();
	await expect(page.getByText(/manutenção e o login está liberado apenas para a administração/i)).toBeVisible(
		{
			timeout: 20_000,
		},
	);
	await shot(page, testInfo, "login-customer-blocked-by-maintenance");
});
