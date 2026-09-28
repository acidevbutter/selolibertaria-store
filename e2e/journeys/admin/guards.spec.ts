/**
 * Auth/role guard contract for /admin (src/proxy.ts):
 *  - no session at all -> redirect to /login
 *  - session but not a backoffice role -> redirect to /forbidden
 * These are two DISTINCT outcomes and the whole point of this spec is that
 * they must not collapse into one another (e.g. a bug that sends everyone
 * without admin rights to /login regardless of whether they're logged in).
 */
import { test as base, expect } from "@playwright/test";
import { CUSTOMER_GUARD_STORAGE_STATE, ensureCustomerGuardStorageState } from "./support/admin-session";

base.describe("unauthenticated", () => {
	// Deliberately no storageState here — a brand-new, cookie-less context.
	base("visiting /admin with no session redirects to /login", async ({ page }) => {
		await page.goto("/admin");
		await expect(page).toHaveURL(/\/login$/);
	});

	base("visiting a nested /admin/* subpage with no session redirects to /login", async ({ page }) => {
		await page.goto("/admin/orders");
		await expect(page).toHaveURL(/\/login$/);
	});
});

// See nav-smoke.spec.ts for why this overrides the `storageState` fixture
// instead of a static test.use() + beforeAll (the static path races the
// context fixture against the beforeAll that creates it).
const test = base.extend({
	storageState: async ({ playwright }, use, testInfo) => {
		testInfo.setTimeout(Math.max(testInfo.timeout, 150_000));
		await ensureCustomerGuardStorageState(playwright.chromium);
		await use(CUSTOMER_GUARD_STORAGE_STATE);
	},
});

test.describe("wrong role", () => {
	test("a logged-in CUSTOMER visiting /admin redirects to /forbidden, not /login", async ({ page }) => {
		await page.goto("/admin");
		await expect(page).toHaveURL(/\/forbidden$/);
		await expect(page).not.toHaveURL(/\/login/);
	});
});
