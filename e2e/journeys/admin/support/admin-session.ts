/**
 * Shared admin-login setup for the admin journey specs.
 *
 * Registers a real account through the live UI (there is no documented admin
 * password to reuse), promotes it to ADMIN directly in Postgres, then logs
 * in through /login so the session token is minted with the ADMIN role. The
 * resulting storageState is cached on disk and the in-memory promise is
 * memoized so every spec file in the same worker process reuses one
 * registration instead of doing it per file.
 *
 * ## Email verification is attempted but NOT required, and here's why
 *
 * This was originally written to verify via the Mailpit link (waitForMailpitMessage
 * + extractFirstLink), matching src/app/api/auth/verify/route.ts. In this local
 * environment that step never completes: `selolibertaria-backend-api`'s
 * RELAY_PROJECT_ID env var is empty, so `RelayClient.enabled` is false and
 * `NotificationService._send` silently no-ops for every transactional email
 * (verification, password reset, ...) — no error, no log, no `communications`
 * row. Filed as selolibertaria_backend#67.
 *
 * Investigating that also turned up that it doesn't actually matter for this
 * suite's purposes: `POST /auth/login` (AuthService.login) never checks
 * `user.verified` at all, so a freshly-registered, never-verified account can
 * already log in and use the site exactly like a verified one. Filed as
 * selolibertaria_backend#68 (worth a product/security call, separately from
 * this suite's needs).
 *
 * So below: registration still *attempts* the Mailpit verification (in case
 * RELAY_PROJECT_ID gets fixed later, this keeps testing the real flow), but
 * doesn't fail the setup if no message shows up — it just logs in directly
 * afterwards, which is sufficient to get a real ADMIN (or CUSTOMER, for the
 * guard spec) session either way.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "@playwright/test";
import type { Browser } from "playwright-core";
import {
	e2eEmail,
	extractFirstLink,
	promoteToAdminInDb,
	TEST_CEP,
	TEST_PASSWORD,
	waitForMailpitMessage,
} from "../../../support/fixtures";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(dirname, "..", ".auth");

// This module drives its own standalone `chromium.launch()` browser (so it
// can run once from a beforeAll and be memoized across spec files), which
// means it doesn't inherit playwright.config.ts's `use.baseURL` the way the
// test-scoped `page` fixture does — it has to be passed explicitly here.
const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3001";

export const ADMIN_STORAGE_STATE = path.join(AUTH_DIR, "admin-storage-state.json");
export const CUSTOMER_GUARD_STORAGE_STATE = path.join(AUTH_DIR, "customer-guard-storage-state.json");

export const ADMIN_EMAIL = e2eEmail("admin");
export const CUSTOMER_GUARD_EMAIL = e2eEmail("customer-guard");

type RegisteredAccount = { email: string; name: string };

/**
 * Drives the real 3-step register form (src/ui/auth/register-form.client.tsx)
 * to completion for a brand-new account. Leaves the page on the "Cadastro
 * pendente" screen (mode: "pending" in login-form.tsx) — no session cookie
 * yet, since registering alone doesn't log you in; a separate signIn() call
 * is what actually establishes the session (see module doc for why this
 * doesn't wait on email verification).
 */
async function registerAccount(page: import("@playwright/test").Page, account: RegisteredAccount) {
	await page.goto("/login");
	await page.getByText("Não tem uma conta? Cadastre-se").click();

	// Step 1: account basics.
	await page.locator("#register-name").fill(account.name);
	await page.locator("#register-email").fill(account.email);
	await page.locator("#register-phone-national").fill("11912345678");
	await page.locator("#register-password").fill(TEST_PASSWORD);
	await page.locator("#register-confirm-password").fill(TEST_PASSWORD);
	await page.getByRole("button", { name: "Continuar", exact: true }).click();

	// Step 2: address — CEP lookup autofills line1/district/city/state.
	await page.locator("#register-address-postal-code").fill(TEST_CEP);
	await expect(page.locator("#register-address-city")).not.toHaveValue("", { timeout: 10_000 });
	await page.locator("#register-address-number").fill("1000");
	await page.getByRole("button", { name: "Continuar para preferências" }).click();

	// Step 3: preferences — defaults are fine, just submit. (Note: this button
	// isn't disabled while the request is in flight — selolibertaria-store#176 —
	// so we click it exactly once and immediately wait for the pending screen
	// rather than doing anything that might read as a second interaction.)
	await page.getByRole("button", { name: "Criar conta" }).click();
	await expect(page.getByText("Cadastro pendente")).toBeVisible({ timeout: 10_000 });
}

/**
 * Best-effort: polls Mailpit for the verification email and, if one shows up,
 * visits its link. Returns whether verification actually happened. Uses a
 * short timeout because in this environment it's a confirmed permanent no-op
 * (selolibertaria_backend#67) rather than a slow-arrival flake — no point
 * burning the default 15s per account.
 */
async function tryVerifyViaMailpit(page: import("@playwright/test").Page, email: string): Promise<boolean> {
	try {
		const message = await waitForMailpitMessage(email, 6_000);
		const link = extractFirstLink(message.text || message.html);
		await page.goto(link);
		return true;
	} catch {
		return false;
	}
}

/** Logs in through the real /login form; works whether or not the account was ever verified (selolibertaria_backend#68). */
async function signIn(page: import("@playwright/test").Page, email: string) {
	await page.goto("/login");
	await page.locator("#login-email").fill(email);
	await page.locator("#login-password").fill(TEST_PASSWORD);
	await page.getByRole("button", { name: "Entrar" }).click();
}

/**
 * A raw browser-type launcher (`{ launch }`), e.g. the `playwright.chromium`
 * worker fixture. Deliberately NOT `@playwright/test`'s own exported
 * `chromium` — that one is test-aware and, launched from inside a
 * `test.beforeAll` that sits under a `test.use({ storageState })` (see
 * guards.spec.ts's "wrong role" describe), it picks up that ambient
 * storageState option for contexts it creates — which broke this setup with
 * a confusing "Error reading storage state ...: ENOENT" the first time
 * around, since the very storageState file being pointed at is the one this
 * function is trying to create. Accepting the launcher as a parameter (and
 * having callers pass the `playwright` fixture's `chromium`) sidesteps that
 * entirely with a plain, unconfigured launch.
 */
type BrowserLauncher = { launch: () => Promise<Browser> };

let adminSessionPromise: Promise<void> | null = null;

/** Idempotent within a worker process: only the first caller actually registers. */
export function ensureAdminStorageState(chromium: BrowserLauncher): Promise<void> {
	if (!adminSessionPromise) adminSessionPromise = createAdminStorageState(chromium);
	return adminSessionPromise;
}

async function createAdminStorageState(chromium: BrowserLauncher): Promise<void> {
	// Playwright can recycle a worker process mid-run (e.g. after a crash
	// caused by something outside this suite — this environment has a
	// sibling process actively editing src/ files, triggering Fast Refresh
	// mid-test). A fresh worker process means a fresh module cache, so the
	// in-memory memoization above is gone too — but if a previous worker
	// already got as far as writing the storageState file, just reuse it
	// instead of paying for a whole new registration (which would also
	// collide on the same ADMIN_EMAIL within one E2E_RUN_ID and fail).
	if (fs.existsSync(ADMIN_STORAGE_STATE)) return;
	const browser = await chromium.launch();
	try {
		const context = await browser.newContext({ baseURL: BASE_URL });
		context.setDefaultTimeout(60_000);
		const page = await context.newPage();

		await registerAccount(page, { email: ADMIN_EMAIL, name: "E2E Admin" });
		const verified = await tryVerifyViaMailpit(page, ADMIN_EMAIL);
		if (!verified) {
			console.warn(
				"[admin-session] No verification email arrived for the e2e admin account (expected locally — see selolibertaria_backend#67); logging in unverified instead (selolibertaria_backend#68 confirms login doesn't require it).",
			);
		}
		promoteToAdminInDb(ADMIN_EMAIL);

		// Always (re-)login through the real form so the session token is
		// minted with the now-ADMIN role.
		await signIn(page, ADMIN_EMAIL);
		await page.waitForURL("**/admin");

		await context.storageState({ path: ADMIN_STORAGE_STATE });
		await context.close();
	} finally {
		await browser.close();
	}
}

let customerGuardSessionPromise: Promise<void> | null = null;

export function ensureCustomerGuardStorageState(chromium: BrowserLauncher): Promise<void> {
	if (!customerGuardSessionPromise) customerGuardSessionPromise = createCustomerGuardStorageState(chromium);
	return customerGuardSessionPromise;
}

async function createCustomerGuardStorageState(chromium: BrowserLauncher): Promise<void> {
	if (fs.existsSync(CUSTOMER_GUARD_STORAGE_STATE)) return;
	const browser = await chromium.launch();
	try {
		const context = await browser.newContext({ baseURL: BASE_URL });
		context.setDefaultTimeout(60_000);
		const page = await context.newPage();

		await registerAccount(page, { email: CUSTOMER_GUARD_EMAIL, name: "E2E Customer Guard" });
		await tryVerifyViaMailpit(page, CUSTOMER_GUARD_EMAIL);
		// Deliberately NOT promoted — stays CUSTOMER so guards.spec.ts can
		// assert the wrong-role -> /forbidden path.
		await signIn(page, CUSTOMER_GUARD_EMAIL);
		await page.waitForURL((url) => !url.pathname.startsWith("/login"));

		await context.storageState({ path: CUSTOMER_GUARD_STORAGE_STATE });
		await context.close();
	} finally {
		await browser.close();
	}
}
