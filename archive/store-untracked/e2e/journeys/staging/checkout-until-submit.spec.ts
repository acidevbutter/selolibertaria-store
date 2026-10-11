import { expect, test } from "@playwright/test";
import { TEST_CEP, TEST_CPF } from "../../support/fixtures";
import { containsDigitsOf, fillReliably } from "../shopper/helpers";

/**
 * Staging validation: guest journey up to (and NOT including) the payment
 * submit. Drives the storefront against the staging API and stops with the
 * "Confirmar e pagar" button enabled, so no order_draft/order and no Asaas
 * charge is created. Run with the store pointed at api-staging via E2E_BASE_URL.
 */
const PRODUCT_SLUG = process.env.STAGING_PRODUCT_SLUG || "little-fish-big-fish";

test("staging: guest reaches a payable checkout (shipping quote resolved, submit enabled)", async ({ page }) => {
	test.setTimeout(180_000);

	await page.goto(`/product/${PRODUCT_SLUG}`);
	const later = page.getByRole("button", { name: "Agora não" });
	if (await later.waitFor({ state: "visible", timeout: 8_000 }).then(() => true, () => false)) await later.click();

	await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
	await expect(page.getByText(/Carrinho \(\d+\)/)).toBeVisible();
	await expect
		.poll(async () => (await page.context().cookies()).some((c) => c.name === "yns_cart_id"), { timeout: 25_000 })
		.toBe(true);

	await page.goto("/checkout", { timeout: 45_000 });
	await expect(page).toHaveURL(/\/checkout/, { timeout: 45_000 });

	const submitButton = page.getByRole("button", { name: /Informe um CEP válido para continuar|Confirmar e pagar/ });
	await expect(submitButton).toBeVisible({ timeout: 20_000 });
	await expect(submitButton).toBeDisabled();

	await fillReliably(page.getByLabel("Nome completo"), "Staging E2E Comprador");
	await fillReliably(page.getByLabel("E-mail", { exact: true }), "staging-e2e@selolibertaria.com.br");
	await fillReliably(page.getByLabel("CPF"), TEST_CPF, { isFilled: containsDigitsOf(TEST_CPF) });
	await fillReliably(page.getByLabel("Telefone"), "11987654321", { isFilled: containsDigitsOf("11987654321") });

	const cepField = page.getByLabel("CEP");
	const lookupSucceeded = page.getByText("Endereço preenchido a partir do CEP.");
	let resolved = false;
	for (let attempt = 0; attempt < 3 && !resolved; attempt++) {
		await cepField.click();
		await cepField.fill("");
		await cepField.pressSequentially(TEST_CEP, { delay: 40 });
		await cepField.press("Tab");
		resolved = await lookupSucceeded.waitFor({ state: "visible", timeout: 8_000 }).then(() => true).catch(() => false);
	}
	expect(resolved, "CEP lookup never resolved").toBe(true);
	await fillReliably(page.getByLabel("Número"), "123");

	await page.screenshot({ path: "test-results/staging-checkout-filled.png", fullPage: true });
	await expect(submitButton).toHaveText("Confirmar e pagar", { timeout: 30_000 });
	await expect(submitButton).toBeEnabled();
	// Deliberately no click: stop right before creating the payment.
});
