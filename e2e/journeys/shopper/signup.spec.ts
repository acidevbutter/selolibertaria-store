import { expect, test } from "@playwright/test";
import { e2eEmail, TEST_PASSWORD } from "../../support/fixtures";
import { resolveVerificationLink } from "./helpers";

/**
 * Cadastro (signup) + verificação de e-mail.
 *
 * Source read first: src/ui/auth/register-form.client.tsx (3-step form:
 * 1 = name/email/phone/password/confirm, 2 = address via AddressFields, 3 =
 * preferred currency + marketing opt-in), src/app/api/auth/register/route.ts
 * (returns {pending:true, email} on success, 409 + REGISTER_EMAIL_TAKEN on a
 * duplicate email), src/ui/auth/address-fields.client.tsx (CEP lookup
 * auto-fills line1/district/city/state and locks those fields read-only for
 * BR), and src/app/api/auth/verify/route.ts (the emailed verification link
 * sets a `session` cookie directly and redirects to `/` when the cart is
 * empty -- so the account is already logged in right after following the
 * link; the spec still exercises an explicit fresh /login afterwards per
 * the task).
 *
 * BLOCKING ENVIRONMENT ISSUE: no transactional email is delivered in this
 * environment right now (RELAY_PROJECT_ID unset on the backend -- full
 * root-cause trace in helpers.ts's `resolveVerificationLink`). This spec
 * still attempts the real Mailpit wait first (per the task brief) and falls
 * back to reading the plaintext `verification_token` column so the
 * verify-link mechanics and post-verification login can still be tested
 * end-to-end; see docs/qa/e2e-2026-09-25/shopper.md for the full writeup.
 *
 * NEW bug found while writing this spec: a single click on "Criar conta"
 * reliably fires the registration POST twice (confirmed via backend request
 * logs across three independent runs and an isolated network-trace probe:
 * two `POST /api/auth/register` calls with identical payloads land ~0-15ms
 * apart). The first commits (201); the second most often gets a clean 409,
 * but has been observed to instead surface an unhandled 500
 * (asyncpg.exceptions.UniqueViolationError bubbling past
 * backend/app/auth/service.py's own uniqueness check) when the two INSERTs
 * race each other's commit. See docs/qa/e2e-2026-09-25/shopper.md.
 */

const NAME = "Ana Teste E2E";
const PHONE_NATIONAL = "11987654321";
const email = e2eEmail("signup");

test.describe
	.serial("cadastro + verificação de e-mail", () => {
		test("registers, verifies via the emailed link, and the account becomes usable", async ({
			page,
		}, testInfo) => {
			test.setTimeout(90_000);
			await page.goto("/login");
			await page.getByRole("button", { name: "Não tem uma conta? Cadastre-se" }).click();

			// --- Step 1: account basics ---
			await expect(page.getByText("1 de 3")).toBeVisible();
			await page.locator("#register-name").fill(NAME);
			await page.locator("#register-email").fill(email);
			await page.locator("#register-phone-national").fill(PHONE_NATIONAL);
			await page.locator("#register-password").fill(TEST_PASSWORD);
			await page.locator("#register-confirm-password").fill(TEST_PASSWORD);

			// Let the debounced availability check resolve before advancing.
			await expect(page.getByText("E-mail disponível.")).toBeVisible({ timeout: 10_000 });

			await page.getByRole("button", { name: "Continuar" }).click();

			// --- Step 2: address (CEP lookup autofill) ---
			await expect(page.getByText("2 de 3")).toBeVisible();
			const postalCode = page.locator("#register-address-postal-code");
			await postalCode.fill("01310-100");
			await postalCode.blur();
			await expect(page.getByText("Endereço preenchido a partir do CEP.")).toBeVisible({ timeout: 10_000 });
			await expect(page.locator("#register-address-city")).toHaveValue(/São Paulo/i);
			await page.locator("#register-address-number").fill("123");

			await page.getByRole("button", { name: "Continuar para preferências" }).click();

			// --- Step 3: preferences + submit ---
			await expect(page.getByText("3 de 3")).toBeVisible();
			await page.getByRole("button", { name: "Criar conta" }).click();

			// API contract: 201 + {pending:true, email} -> UI shows the pending-verification card.
			await expect(page.getByRole("heading", { name: "Cadastro pendente" })).toBeVisible({ timeout: 15_000 });
			await expect(page.getByText(`Enviamos a confirmação para ${email}`)).toBeVisible();

			// Fetch the verification link -- from Mailpit if delivery is working,
			// otherwise falls back to the DB (see file header + helpers.ts).
			const link = await resolveVerificationLink(email, testInfo);
			await page.goto(link);

			// verify/route.ts redirects to "/" (empty cart) after setting the session cookie.
			await expect(page).toHaveURL(/\/$/);

			// Confirm the account is independently usable: fresh login with the same credentials.
			await page.context().clearCookies();
			await page.goto("/login");
			await page.locator("#login-email").fill(email);
			await page.locator("#login-password").fill(TEST_PASSWORD);
			await page.getByRole("button", { name: "Entrar" }).click();

			await expect(page).toHaveURL(/\/$/);
			await expect(page).not.toHaveURL(/\/login/);
		});

		test("re-registering with the same email shows the inline 'already registered' error", async ({
			page,
		}) => {
			await page.goto("/login");
			await page.getByRole("button", { name: "Não tem uma conta? Cadastre-se" }).click();

			await page.locator("#register-name").fill(NAME);
			await page.locator("#register-email").fill(email);
			await page.locator("#register-phone-national").fill(PHONE_NATIONAL);
			await page.locator("#register-password").fill(TEST_PASSWORD);
			await page.locator("#register-confirm-password").fill(TEST_PASSWORD);

			// Debounced /api/auth/email-available check flags the email as taken.
			await expect(page.getByText("Este e-mail já está em uso.")).toBeVisible({ timeout: 10_000 });

			await page.getByRole("button", { name: "Continuar" }).click();

			// validateStepOne() blocks advancing and surfaces Register.errors.emailTaken.
			await expect(page.getByText("Este e-mail já está cadastrado.")).toBeVisible();
			await expect(page.getByText("2 de 3")).toHaveCount(0);
		});
	});
