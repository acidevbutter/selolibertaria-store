import { expect, test } from "@playwright/test";
import { e2eEmail, TEST_CEP, TEST_CPF } from "../../support/fixtures";
import { containsDigitsOf, fillReliably } from "./helpers";

/**
 * Compra sem cadastro (guest checkout).
 *
 * Source read first: src/app/checkout/page.tsx (server page, redirects
 * through /checkout/prepare when there's a guest cart cookie, then renders
 * once with ?prepared=1), src/app/checkout/asaas-checkout-form.client.tsx
 * (single hosted-checkout form; delivery method defaults to "new-address"
 * for guests since there's no saved address; submit is disabled until a
 * shipping quote resolves), src/actions/checkout-actions.ts
 * (createAsaasCheckout -> POST /checkout/intents -> redirect_url from Asaas).
 */

test("guest can add to cart, fill the hosted checkout form, and gets redirected to Asaas", async ({
	page,
}) => {
	test.setTimeout(180_000);
	await page.goto("/product/little-fish-big-fish");
	await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
	await expect(page.getByText(/Carrinho \(\d+\)/)).toBeVisible();

	// The drawer opens optimistically (cart-context.tsx sets isCartOpen(true)
	// before awaiting the server action), so it can be visible before the
	// `yns_cart_id` cookie the checkout SSR page reads
	// (src/lib/cart-cookies.ts) has actually been persisted. Navigating to
	// /checkout too early lands on "Empty cart" -- wait for the real cookie.
	await expect
		.poll(async () => (await page.context().cookies()).some((c) => c.name === "yns_cart_id"), {
			timeout: 25_000,
		})
		.toBe(true);

	// NOTE: this app polls GET /site-activation/public every ~1-2s
	// indefinitely (a live maintenance-mode check), so `waitUntil:
	// "networkidle"` never resolves here -- it just burns the goto's own
	// timeout. Use the default ("load") instead.
	await page.goto("/checkout", { timeout: 45_000 });
	await expect(page).toHaveURL(/\/checkout/, { timeout: 45_000 });

	const submitButton = page.getByRole("button", {
		name: /Informe um CEP válido para continuar|Confirmar e pagar/,
	});
	// Make sure the client bundle has actually hydrated before typing --
	// otherwise fill()/blur() land on a server-rendered input with no React
	// handlers attached yet, so the CEP lookup never fires (confirmed via a
	// manual network-trace probe: no /api/address/postal-lookup request at
	// all when interacting immediately after the URL changes).
	// Guest carts route through /checkout/prepare (see file header) before
	// landing back on /checkout?prepared=1 -- that extra hop plus a cold
	// dev-mode compile of the route can outrun the default 5s timeout even
	// though nothing is actually wrong (confirmed: retrying alone passes).
	await expect(submitButton).toBeVisible({ timeout: 20_000 });

	// Known-blocked state: no CEP filled yet.
	await expect(submitButton).toBeDisabled();
	await expect(submitButton).toHaveText("Informe um CEP válido para continuar");

	const guestEmail = e2eEmail("guest-checkout");
	await fillReliably(page.getByLabel("Nome completo"), "Ana Compradora Teste");
	await fillReliably(page.getByLabel("E-mail", { exact: true }), guestEmail);
	await fillReliably(page.getByLabel("CPF"), TEST_CPF, { isFilled: containsDigitsOf(TEST_CPF) });
	await fillReliably(page.getByLabel("Telefone"), "11987654321", {
		isFilled: containsDigitsOf("11987654321"),
	});

	// The CEP lookup (debounced useEffect + onBlur force-lookup in
	// src/ui/auth/address-fields.client.tsx) has proven flaky to trigger
	// reliably through CDP-driven input under the real test runner (a manual
	// standalone Playwright script never reproduced this, but this spec does,
	// intermittently) -- retry the interaction a few times rather than
	// pinning down the exact race, since each retry only proceeds once a real
	// condition is met.
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

	// The shipping quote only needs a resolvable postal code (getShippingQuote
	// in src/actions/checkout-actions.ts), but createAsaasCheckout also
	// requires a street number -- and it's a real `required` HTML field, so
	// leaving it blank silently blocks the native form submission with a
	// browser validation bubble instead of the app's own error message. Fill
	// it in before submitting (this is a placeholder text, not a value, until
	// filled -- confirmed via a failed run's screenshot).
	await fillReliably(page.getByLabel("Número"), "123");

	// Wait for the shipping quote to resolve: button flips to enabled + "Confirmar e pagar".
	// This chains a real ViaCEP lookup + a real Melhor Envio shipping quote
	// call, both external, so it can take a while.
	await expect(submitButton).toHaveText("Confirmar e pagar", { timeout: 30_000 });
	await expect(submitButton).toBeEnabled();

	// Final safety net for the hydration race documented in helpers.ts's
	// fillReliably: re-confirm the buyer fields are still populated right
	// before submitting, since this whole shipping-quote wait was itself a
	// window where a late hydration pass could still wipe a field.
	await expect(page.getByLabel("Nome completo")).toHaveValue("Ana Compradora Teste");
	await expect(page.getByLabel("E-mail", { exact: true })).toHaveValue(guestEmail);

	// This environment's dev server has repeatedly been caught mid-recompile
	// ("Compiling ..." badge visible in on-disk failure screenshots) right
	// when submitting, and createAsaasCheckout itself chains a real FastAPI
	// call plus a real Asaas sandbox call -- give a single click a generous
	// window rather than guessing and double-submitting (submitting the same
	// checkout intent twice is exactly the kind of duplicate-request bug
	// documented for /api/auth/register in signup.spec.ts; don't reproduce
	// that pattern here).
	await submitButton.click();
	await page
		.waitForURL((url) => !url.pathname.startsWith("/checkout"), { timeout: 60_000 })
		.catch(() => null);

	const finalUrl = new URL(page.url());
	expect(
		finalUrl.pathname.startsWith("/checkout"),
		`expected navigation away from /checkout, landed on ${page.url()}`,
	).toBe(false);
	test.info().annotations.push({ type: "guest-checkout redirect origin", description: finalUrl.origin });
});
