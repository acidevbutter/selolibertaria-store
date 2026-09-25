import { expect, test } from "@playwright/test";
import { e2eEmail, TEST_CEP, TEST_CPF, TEST_PASSWORD } from "../../support/fixtures";
import { containsDigitsOf, fillReliably, resolveVerificationLink, trackConsoleErrors } from "./helpers";

const STATS_BEACON_BUG = /\/stats\/api\/send/;

/**
 * Compra com cadastro (logged-in checkout).
 *
 * Registers a fresh account (with a real address, via a direct
 * /api/auth/register call using the same contract exercised through the UI
 * in signup.spec.ts) so it gets a saved postal code, verifies it via the
 * emailed link, logs in explicitly, adds an item to cart, and runs the
 * hosted checkout using the saved address.
 *
 * Note (see src/lib/checkout/cart-snapshot.ts): the register API doesn't
 * collect CPF at all -- that's a separate account field the backend exposes
 * elsewhere -- so `checkout.user.cpf` is empty for a freshly registered
 * account even though name/email/phone/address are prefilled. The buyer CPF
 * field is filled manually in this spec to reach a submittable state.
 *
 * BLOCKING ENVIRONMENT ISSUE: same as signup.spec.ts -- Mailpit delivery is
 * broken in this environment (RELAY_PROJECT_ID unset), so this falls back to
 * reading the plaintext verification_token from Postgres. See helpers.ts.
 */

const email = e2eEmail("account-checkout");
const NAME = "Bia Compradora Teste";
const PHONE_E164 = "+5511987654321";

test.describe
	.serial("compra com cadastro", () => {
		test("registers with a saved address, verifies, logs in, and checks out with 'Usar meu endereço salvo'", async ({
			page,
		}, testInfo) => {
			test.setTimeout(180_000);
			const lookup = await page.request.get(
				`/api/address/postal-lookup?country=BR&postalCode=${encodeURIComponent(TEST_CEP)}`,
			);
			expect(lookup.ok()).toBeTruthy();
			const resolved = (await lookup.json()) as {
				line1?: string;
				district?: string;
				city?: string;
				state?: string;
				postalCode?: string;
			};

			const registerRes = await page.request.post("/api/auth/register", {
				data: {
					name: NAME,
					email,
					password: TEST_PASSWORD,
					phone: PHONE_E164,
					address: {
						line1: resolved.line1,
						number: "123",
						district: resolved.district,
						city: resolved.city,
						state: resolved.state,
						postalCode: resolved.postalCode ?? TEST_CEP,
						country: "BR",
					},
				},
			});
			expect(registerRes.status(), "registration should succeed (201)").toBe(201);

			const link = await resolveVerificationLink(email, testInfo);
			await page.goto(link);
			await page.context().clearCookies();

			await page.goto("/login");
			await page.locator("#login-email").fill(email);
			await page.locator("#login-password").fill(TEST_PASSWORD);
			await page.getByRole("button", { name: "Entrar" }).click();
			await expect(page).toHaveURL(/\/$/);

			await page.goto("/product/little-fish-big-fish");
			const pdpUrl = page.url();
			// The drawer opens optimistically before the add-to-cart Server Action
			// (addToCartAction in src/actions/cart-actions.ts, which persists to the
			// account server-side for a logged-in buyer -- unlike the guest flow's
			// cookie, see guest-checkout.spec.ts) actually completes. Server Actions
			// post back to the current page URL, not a REST-looking path, so wait
			// for that POST to resolve rather than just the optimistic drawer text.
			const [addToCartResponse] = await Promise.all([
				page.waitForResponse((res) => res.request().method() === "POST" && res.url() === pdpUrl),
				page.getByRole("button", { name: "Adicionar ao carrinho" }).click(),
			]);
			expect(addToCartResponse.ok()).toBeTruthy();
			await expect(page.getByText(/Carrinho \(\d+\)/)).toBeVisible();

			// NOTE: this app polls GET /site-activation/public every ~1-2s
			// indefinitely (a live maintenance-mode check), so `waitUntil:
			// "networkidle"` never resolves here -- see guest-checkout.spec.ts.
			await page.goto("/checkout");
			await expect(page).toHaveURL(/\/checkout/, { timeout: 15_000 });
			// Wait for hydration before interacting (see guest-checkout.spec.ts).
			await expect(page.getByLabel("Nome completo")).toBeVisible();

			// Buyer fields prefilled from the account where the account has the data.
			await expect(page.getByLabel("Nome completo")).toHaveValue(NAME);
			await expect(page.getByLabel("E-mail", { exact: true })).toHaveValue(email);
			await expect(page.getByLabel("Telefone")).not.toHaveValue("");
			// CPF is NOT collected at registration (see file header), so it starts empty.
			await expect(page.getByLabel("CPF")).toHaveValue("");
			// fillReliably guards against the hydration race documented in
			// helpers.ts (a plain .fill() can land before React's handler attaches
			// and get silently wiped on hydration).
			await fillReliably(page.getByLabel("CPF"), TEST_CPF, { isFilled: containsDigitsOf(TEST_CPF) });

			const deliverySelect = page.locator("#asaas-checkout-delivery");
			await expect(deliverySelect.locator('option[value="saved-address"]')).toHaveText(
				"Usar meu endereço salvo",
			);
			await expect(deliverySelect.locator('option[value="new-address"]')).toHaveText("Usar um novo endereço");
			await expect(deliverySelect).toHaveValue("saved-address");

			const submitButton = page.getByRole("button", {
				name: /Calculando frete…|Confirmar e pagar|Frete indisponível/,
			});
			await expect(submitButton).toHaveText("Confirmar e pagar", { timeout: 30_000 });
			await expect(submitButton).toBeEnabled();

			// See guest-checkout.spec.ts: this shared dev environment has shown
			// Next.js Fast Refresh reloads landing mid-submit (likely triggered by
			// unrelated concurrent file edits elsewhere in this repo, e.g. the
			// sibling admin-specs session), which resets client state and aborts
			// the in-flight request before it reaches the backend. A single click
			// with a generous wait avoids compounding that with a double-submit.
			await submitButton.click();
			await page
				.waitForURL((url) => !url.pathname.startsWith("/checkout"), { timeout: 60_000 })
				.catch(() => null);

			const finalUrl = new URL(page.url());
			expect(
				finalUrl.pathname.startsWith("/checkout"),
				`expected navigation away from /checkout, landed on ${page.url()}`,
			).toBe(false);
			test
				.info()
				.annotations.push({ type: "account-checkout redirect origin", description: finalUrl.origin });
		});

		test("logged-in user can view /user?section=purchases and /orders without crashing", async ({ page }) => {
			await page.goto("/login");
			await page.locator("#login-email").fill(email);
			await page.locator("#login-password").fill(TEST_PASSWORD);
			await page.getByRole("button", { name: "Entrar" }).click();
			await expect(page).toHaveURL(/\/$/);

			// /stats/api/send is a separately-documented, app-wide bug (see
			// anonymous.spec.ts) excluded here so it doesn't mask findings specific
			// to these two pages.
			const console_ = trackConsoleErrors(page, { ignore: [STATS_BEACON_BUG] });

			await page.goto("/user?section=purchases");
			await expect(page).toHaveURL(/\/user\?section=purchases/);
			await expect(page.locator("body")).toBeVisible();

			await page.goto("/orders");
			await expect(page.getByRole("heading").first()).toBeVisible();

			console_.assertNone();
		});
	});
