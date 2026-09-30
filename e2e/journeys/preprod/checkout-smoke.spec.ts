import { expect, test } from "@playwright/test";
import { TEST_CEP, TEST_CPF } from "../../support/fixtures";
import { containsDigitsOf, fillReliably } from "../shopper/helpers";

/**
 * Playwright leg of the preprod post-deploy smoke worker
 * (selolibertaria_backend#45, scripts/preprod_smoke/run_smoke.sh). Adapted
 * from ../shopper/guest-checkout.spec.ts -- same flow, same success
 * criteria (redirected away from /checkout, i.e. the hosted-checkout form
 * submitted and the backend handed back a real Asaas redirect_url), but:
 *
 * - targets the single seeded PREPROD-TEST-PRODUCT
 *   (selolibertaria_backend scripts/seed_preprod_min_product.py, slug
 *   `preprod-test-product`), priced at exactly
 *   `settings.asaas_min_checkout_value_cents` -- the cheapest real charge
 *   Asaas will accept, so this never risks a meaningfully-sized sandbox
 *   transaction;
 * - always fills the SAME fixed buyer email
 *   (`PREPROD_SMOKE_BUYER_EMAIL`, not a per-run timestamped address) so
 *   every run's leftover order_draft/order row is recognizable by
 *   selolibertaria_backend's scripts/cleanup_preprod_smoke_orders.py --
 *   keep the two in sync if this ever changes;
 * - is meant to run against a real deployed preprod frontend via
 *   `E2E_BASE_URL` (playwright.config.ts already reads this), not the local
 *   dev server this suite otherwise targets. It does not use
 *   support/fixtures.ts's docker-exec helpers (queryDb/promoteToAdminInDb) --
 *   those assume a local Postgres container, which a real preprod deploy
 *   does not expose to whatever machine runs this spec.
 *
 * Out of scope here, same as guest-checkout.spec.ts: actually completing
 * payment on Asaas's own hosted page. This only proves the storefront can
 * drive a real guest checkout end-to-end and get a live Asaas redirect back
 * for the exact minimum-price product preprod seeds -- see
 * selolibertaria_backend issue #45 for why a full card-entry-on-Asaas's-UI
 * leg isn't attempted (no precedent for automating a third-party hosted
 * payment page anywhere in this codebase, and it would be the flakiest,
 * least valuable part of the check).
 */

const PRODUCT_SLUG = process.env.PREPROD_TEST_PRODUCT_SLUG || "preprod-test-product";
// Keep in sync with selolibertaria_backend's
// scripts/cleanup_preprod_smoke_orders.py::PREPROD_SMOKE_BUYER_EMAIL.
const PREPROD_SMOKE_BUYER_EMAIL = "preprod-smoke-worker@selolibertaria.com.br";

test("preprod smoke: guest can buy PREPROD-TEST-PRODUCT and gets redirected to Asaas", async ({ page }) => {
	test.setTimeout(180_000);
	await page.goto(`/product/${PRODUCT_SLUG}`);
	// A live presale shows a notice a few seconds after load that covers the page (and this button) until it is
	// dismissed -- the smoke must behave like a visitor and dismiss it instead of timing out behind it.
	const later = page.getByRole("button", { name: "Agora não" });
	if (
		await later.waitFor({ state: "visible", timeout: 8_000 }).then(
			() => true,
			() => false,
		)
	)
		await later.click();
	await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
	await expect(page.getByText(/Carrinho \(\d+\)/)).toBeVisible();

	// See guest-checkout.spec.ts for why this waits on the cookie rather than
	// navigating straight to /checkout.
	await expect
		.poll(async () => (await page.context().cookies()).some((c) => c.name === "yns_cart_id"), {
			timeout: 25_000,
		})
		.toBe(true);

	await page.goto("/checkout", { timeout: 45_000 });
	await expect(page).toHaveURL(/\/checkout/, { timeout: 45_000 });

	const submitButton = page.getByRole("button", {
		name: /Informe um CEP válido para continuar|Confirmar e pagar/,
	});
	await expect(submitButton).toBeVisible({ timeout: 20_000 });
	await expect(submitButton).toBeDisabled();

	await fillReliably(page.getByLabel("Nome completo"), "Smoke Worker Preprod");
	await fillReliably(page.getByLabel("E-mail", { exact: true }), PREPROD_SMOKE_BUYER_EMAIL);
	await fillReliably(page.getByLabel("CPF"), TEST_CPF, { isFilled: containsDigitsOf(TEST_CPF) });
	await fillReliably(page.getByLabel("Telefone"), "11987654321", {
		isFilled: containsDigitsOf("11987654321"),
	});

	const cepField = page.getByLabel("CEP");
	const lookupSucceeded = page.getByText("Endereço preenchido a partir do CEP.");
	let resolved = false;
	for (let attempt = 0; attempt < 3 && !resolved; attempt++) {
		await cepField.click();
		await cepField.fill("");
		await cepField.pressSequentially(TEST_CEP, { delay: 40 });
		await cepField.press("Tab");
		resolved = await lookupSucceeded
			.waitFor({ state: "visible", timeout: 8_000 })
			.then(() => true)
			.catch(() => false);
	}
	expect(resolved, "CEP lookup never resolved to success after 3 attempts").toBe(true);

	await fillReliably(page.getByLabel("Número"), "123");

	await expect(submitButton).toHaveText("Confirmar e pagar", { timeout: 30_000 });
	await expect(submitButton).toBeEnabled();

	await expect(page.getByLabel("Nome completo")).toHaveValue("Smoke Worker Preprod");
	await expect(page.getByLabel("E-mail", { exact: true })).toHaveValue(PREPROD_SMOKE_BUYER_EMAIL);

	await submitButton.click();
	await page
		.waitForURL((url) => !url.pathname.startsWith("/checkout"), { timeout: 60_000 })
		.catch(() => null);

	const finalUrl = new URL(page.url());
	expect(
		finalUrl.pathname.startsWith("/checkout"),
		`expected navigation away from /checkout, landed on ${page.url()}`,
	).toBe(false);
	test.info().annotations.push({ type: "preprod-smoke redirect origin", description: finalUrl.origin });
});
