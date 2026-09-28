/**
 * One real create-then-delete smoke to prove the admin write path works
 * end-to-end, not just renders forms. Uses an editorial Event
 * (src/app/admin/editorial/events/new/page.tsx +
 * src/app/admin/editorial/_components/editorial-event-form.tsx) — clearly
 * editorial/marketing content, not orders/customers/money.
 *
 * createEditorialEventAction only requires `title` (see actions.ts's
 * validateEditorialItemForm); on success it redirects to
 * /admin/editorial/events/{slug} (actions.ts:337). Deletion goes through the
 * UI's own destructive action (EditorialItemActions -> deleteEditorialEventAction
 * -> a real DELETE against the FastAPI editorial endpoint — see
 * src/lib/editorial-admin-api.ts's deleteEditorial), guarded by a
 * window.confirm() this spec accepts.
 */
import { test as base, expect } from "@playwright/test";
import { ADMIN_STORAGE_STATE, ensureAdminStorageState } from "./support/admin-session";

// See nav-smoke.spec.ts for why this overrides the `storageState` fixture
// instead of a static test.use() + beforeAll (the static path races the
// context fixture against the beforeAll that creates it).
const test = base.extend({
	storageState: async ({ playwright }, use, testInfo) => {
		testInfo.setTimeout(Math.max(testInfo.timeout, 150_000));
		await ensureAdminStorageState(playwright.chromium);
		await use(ADMIN_STORAGE_STATE);
	},
});

test("create an editorial event, see it listed, then delete it", async ({ page }) => {
	const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
	const title = `[E2E] Evento ${suffix}`;
	const slug = `e2e-crud-smoke-${suffix}`;

	page.on("dialog", (dialog) => dialog.accept());

	await page.goto("/admin/editorial/events/new");
	await expect(page.getByRole("heading", { name: "Novo evento" })).toBeVisible();

	await page.locator("#title").fill(title);
	await page.locator("#slug").fill(slug);
	await page.getByRole("button", { name: "Criar evento" }).click();

	await page.waitForURL(`**/admin/editorial/events/${slug}`);
	// .first(): the detail page shows both its own AdminEditorialHero <h1> and
	// a live-preview <article> mirroring the public page, which duplicates the
	// same heading text by design (EditorialLivePreview) — not a bug.
	await expect(page.getByRole("heading", { name: title }).first()).toBeVisible();

	// List view should now show it.
	await page.goto("/admin/editorial/events");
	await expect(page.getByRole("heading", { name: title })).toBeVisible();

	// Delete it via the admin UI's own destructive action (with confirm()).
	// deleteEditorialEventAction (actions.ts) redirects straight to
	// /admin/editorial/events on success — it never renders a client-side
	// success message, so the redirect landing + the row's absence there is
	// the real assertion.
	await page.goto(`/admin/editorial/events/${slug}`);
	// The floating "Salvar evento" bar used to be `fixed` to the whole
	// viewport's bottom-right, physically overlapping this sidebar button at
	// normal viewport heights (selolibertaria-store#178). It's now `sticky`
	// inside the main form column, so it can never extend past that column
	// into the sidebar — a plain coordinate-based click works again.
	await page.getByRole("button", { name: "Excluir evento" }).click();
	await page.waitForURL("**/admin/editorial/events");

	await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
});
