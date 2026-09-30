import { expect, test } from "@playwright/test";
import { API_URL, creds, shot, watch } from "./support/qa";

/** Admin operations that need data: product edit pages, customer list/detail (the two QA accounts), logout. */
test.use({ storageState: "e2e/journeys/.auth/preprod-admin.json" });

test("each seeded product opens in the admin editor", async ({ page, request }, testInfo) => {
	const catalog = (await (await request.get(`${API_URL()}/catalog/`)).json()) as {
		items: { slug: string }[];
	};
	expect(catalog.items.length).toBeGreaterThan(0);
	for (const { slug } of catalog.items) {
		const health = watch(page);
		const res = await page.goto(`/admin/products/${slug}`, { waitUntil: "domcontentloaded" });
		expect(res?.status(), slug).toBeLessThan(400);
		await expect(page.locator("main h1").first()).toBeVisible({ timeout: 30_000 });
		await shot(page, testInfo, `product-${slug}`);
		await health.expectClean(`/admin/products/${slug}`);
	}
});

test("customers list shows the QA accounts and opens a detail page", async ({ page }, testInfo) => {
	const health = watch(page);
	await page.goto("/admin/users");
	await expect(page.getByText(creds.customer().email).first()).toBeVisible({ timeout: 30_000 });
	await shot(page, testInfo, "customers-list");
	// The list is not a semantic table: take the closest ancestor of the e-mail that also holds a "Ver usuário" link.
	await page
		.getByText(creds.customer().email)
		.first()
		.locator("xpath=ancestor::*[.//a[contains(normalize-space(.), 'Ver usuário')]][1]")
		.getByRole("link", { name: /Ver usuário/ })
		.click();
	await expect(page).toHaveURL(/\/admin\/users\/[0-9a-f-]+/, { timeout: 30_000 });
	await expect(page.locator("main h1").first()).toBeVisible();
	await shot(page, testInfo, "customer-detail");
	await health.expectClean("customer detail");
});

test("logout clears the admin session", async ({ page }, testInfo) => {
	await page.goto("/admin");
	await page.getByRole("button", { name: /sair/i }).click();
	await page.waitForURL((url) => !url.pathname.startsWith("/admin"), { timeout: 30_000 });
	await page.goto("/admin");
	await expect(page).toHaveURL(/\/login/);
	await shot(page, testInfo, "after-logout-admin-redirects-to-login");
});
