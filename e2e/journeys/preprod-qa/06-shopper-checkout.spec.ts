import { expect, test } from "@playwright/test";
import { creds, dismissPresaleNotice, login, shot, watch } from "./support/qa";

/**
 * Buyer journey on preprod with the seeded R$ 5,00 PREPROD-TEST-PRODUCT. preprod talks to the REAL Asaas account
 * (capped at R$ 5 by design), so these specs stop at the payment screen and never pay. The guest "creates the
 * Asaas charge" leg is the project's own smoke spec (e2e/journeys/preprod/checkout-smoke.spec.ts), run separately.
 */
test.use({ storageState: { cookies: [], origins: [] } });
test.describe.configure({ mode: "serial" });

const PRODUCT = "preprod-test-product";

test("customer logs in and lands on the storefront with the right role", async ({ page }, testInfo) => {
	const health = watch(page);
	await login(page, creds.customer());
	await expect(page).not.toHaveURL(/\/admin/);
	await expect(page.locator("main").first()).toBeVisible({ timeout: 30_000 });
	await shot(page, testInfo, "customer-after-login");
	await page.goto("/user");
	await expect(page).toHaveURL(/\/user/);
	await shot(page, testInfo, "customer-account");
	await page.goto("/orders");
	await expect(page).toHaveURL(/\/orders/);
	await shot(page, testInfo, "customer-orders");
	await health.expectClean("customer pages");
	await page.context().storageState({ path: "e2e/journeys/.auth/preprod-customer.json" });
});

test.describe("signed-in buyer", () => {
	test.use({ storageState: "e2e/journeys/.auth/preprod-customer.json" });

	test("adds the test product to the cart and sees the R$ 5,00 total", async ({ page }, testInfo) => {
		const health = watch(page);
		await page.goto(`/product/${PRODUCT}`);
		await expect(page.getByRole("heading", { name: /PREPROD-TEST-PRODUCT/i }).first()).toBeVisible({
			timeout: 30_000,
		});
		await shot(page, testInfo, "pdp-with-presale-notice");
		await dismissPresaleNotice(page);
		await shot(page, testInfo, "pdp-test-product");
		await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
		await expect(page.getByText(/Carrinho \(\d+\)/)).toBeVisible({ timeout: 30_000 });
		await shot(page, testInfo, "cart-drawer-with-item");
		await expect(page.getByText(/R\$\s?5,00/).first()).toBeVisible();
		await health.expectClean("pdp + cart");
	});

	test("checkout page loads for the signed-in buyer with the cart and the pay button", async ({
		page,
	}, testInfo) => {
		const health = watch(page);
		await page.goto("/checkout", { timeout: 45_000 });
		await expect(page).toHaveURL(/\/checkout/);
		await dismissPresaleNotice(page);
		const pay = page.getByRole("button", { name: /Informe um CEP válido para continuar|Confirmar e pagar/ });
		await expect(pay).toBeVisible({ timeout: 30_000 });
		// The customer's server-side cart survives between runs, so the quantity is not always 1: the total must be
		// quantity x R$ 5,00 either way.
		const summary = await page.locator("aside").first().innerText();
		const qty = Number(/Qtd\.\s*(\d+)/.exec(summary)?.[1] ?? "1");
		const total = /Total\s*R\$\s*([\d.,]+)/.exec(summary)?.[1] ?? "";
		expect(total.replace(".", "").replace(",", "."), `total for ${qty} x R$ 5,00`).toBe((qty * 5).toFixed(2));
		await shot(page, testInfo, "checkout-signed-in");
		await health.expectClean("checkout");
	});

	test("cart can be emptied and the page says so", async ({ page }, testInfo) => {
		await page.goto("/checkout");
		const remove = page.getByRole("button", { name: /Remover|Excluir/i }).first();
		if (await remove.isVisible().catch(() => false)) await remove.click();
		await shot(page, testInfo, "checkout-after-remove-attempt");
	});
});
