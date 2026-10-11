import { expect, test } from "@playwright/test";
import { TEST_CEP, TEST_CPF } from "../../support/fixtures";
import { containsDigitsOf, fillReliably } from "../shopper/helpers";

/**
 * Staging: full guest checkout including the submit. Staging charges go to the
 * Asaas SANDBOX, so this creates a sandbox payment and must land on an Asaas
 * (sandbox) redirect_url. Buyer email is fixed so leftovers are recognizable.
 */
const PRODUCT_SLUG = process.env.STAGING_PRODUCT_SLUG || "little-fish-big-fish";
const BUYER_EMAIL = "staging-e2e@selolibertaria.com.br";

test("staging: guest completes checkout and is redirected to the Asaas sandbox", async ({ page }) => {
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
	const submitButton = page.getByRole("button", { name: /Informe um CEP válido para continuar|Confirmar e pagar/ });
	await expect(submitButton).toBeVisible({ timeout: 20_000 });

	await fillReliably(page.getByLabel("Nome completo"), "Staging E2E Comprador");
	await fillReliably(page.getByLabel("E-mail", { exact: true }), BUYER_EMAIL);
	await fillReliably(page.getByLabel("CPF"), TEST_CPF, { isFilled: containsDigitsOf(TEST_CPF) });
	await fillReliably(page.getByLabel("Telefone"), "11987654321", { isFilled: containsDigitsOf("11987654321") });
	const cepField = page.getByLabel("CEP");
	const ok = page.getByText("Endereço preenchido a partir do CEP.");
	let resolved = false;
	for (let i = 0; i < 3 && !resolved; i++) {
		await cepField.click();
		await cepField.fill("");
		await cepField.pressSequentially(TEST_CEP, { delay: 40 });
		await cepField.press("Tab");
		resolved = await ok.waitFor({ state: "visible", timeout: 8_000 }).then(() => true).catch(() => false);
	}
	expect(resolved, "CEP lookup never resolved").toBe(true);
	await fillReliably(page.getByLabel("Número"), "123");
	await expect(submitButton).toHaveText("Confirmar e pagar", { timeout: 30_000 });
	await expect(submitButton).toBeEnabled();

	await submitButton.click();
	await page.waitForURL((url) => !url.pathname.startsWith("/checkout"), { timeout: 60_000 }).catch(() => null);
	const finalUrl = new URL(page.url());
	test.info().annotations.push({ type: "redirect origin", description: finalUrl.origin });
	expect(finalUrl.pathname.startsWith("/checkout"), `still on ${page.url()}`).toBe(false);
	expect(finalUrl.hostname, `landed on ${page.url()}`).toMatch(/asaas\.com$/);
	expect(finalUrl.hostname).toContain("sandbox");
});
