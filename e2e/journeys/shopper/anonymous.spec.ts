import { expect, test } from "@playwright/test";
import { trackConsoleErrors } from "./helpers";

/**
 * Jornada deslogada (anonymous). Covers every public route an anonymous
 * shopper can reach, the cart add-to-cart flow, unauthenticated route
 * guards, and two known-bug re-verifications from docs/qa/e2e-2026-09-23.md:
 * the home "pré-venda" CTA and (contact form language is covered in its own
 * spec, contact-newsletter.spec.ts).
 *
 * Catalog note (verified via `docker exec infra-shared-postgres-1 psql`):
 * as of 2026-09-25 there is exactly one published product,
 * `little-fish-big-fish` (category slug `livros`). The prior QA pass's
 * "three published PDPs" / "Ninfas do Tietê" catalog no longer exists in
 * this environment, so this spec uses the one real product/category slug
 * available rather than hardcoding stale ones.
 *
 * NEW bug found while writing this spec: every page fires a self-hosted
 * analytics beacon (`POST /stats/api/send`, proxied per `next.config`'s
 * `/stats/:match*` rewrite) that currently returns 400 on every single page
 * load, app-wide -- confirmed via a manual Playwright probe against `/`,
 * `/faq`, and `/product/little-fish-big-fish`. It's silent/non-blocking (no
 * visible UI impact) but is a genuine, always-reproducible console error, so
 * rather than let it nondeterministically fail all 13 page-load tests below
 * (whether it fails a given test is a race against when the beacon's
 * response lands vs. when the assertion runs), it gets its own dedicated,
 * deterministic test and is excluded from the generic per-page check.
 */
const STATS_BEACON_BUG = /\/stats\/api\/send/;

const PUBLIC_PAGES = [
	{ path: "/", label: "home" },
	{ path: "/products", label: "products listing" },
	{ path: "/category/livros", label: "category (livros)" },
	{ path: "/product/little-fish-big-fish", label: "PDP (little-fish-big-fish)" },
	{ path: "/projects", label: "projects listing" },
	{ path: "/projects/festival-mario-de-andrade-2024", label: "project detail" },
	{ path: "/events", label: "events" },
	{ path: "/sarau-safado", label: "sarau safado" },
	{ path: "/about", label: "about" },
	{ path: "/contact", label: "contact" },
	{ path: "/faq", label: "faq" },
	{ path: "/terms", label: "terms" },
	{ path: "/privacy", label: "privacy" },
];

for (const { path, label } of PUBLIC_PAGES) {
	test(`public page renders without console errors: ${label} (${path})`, async ({ page }) => {
		const console_ = trackConsoleErrors(page, { ignore: [STATS_BEACON_BUG] });
		const response = await page.goto(path);
		expect(response?.ok(), `${path} should respond 2xx`).toBeTruthy();

		// No Next.js error overlay / global-error boundary.
		await expect(page.getByText("Algo deu errado!", { exact: false })).toHaveCount(0);
		await expect(page.getByText("Ooops, algo deu errado!", { exact: false })).toHaveCount(0);

		// Some visible heading renders (page has real content, not a blank shell).
		await expect(page.locator("h1").first()).toBeVisible();

		console_.assertNone();
	});
}

test("search finds results for a real product term", async ({ page }) => {
	const console_ = trackConsoleErrors(page, { ignore: [STATS_BEACON_BUG] });
	// The product catalog in this environment only has "little fish, big fish"
	// published, so search on a fragment of its real name instead of the
	// stale "virus" term from the prior QA pass (see file header note).
	await page.goto("/search?q=fish");
	await expect(page.locator("h1").first()).toContainText("fish");
	await expect(page.getByText("little fish, big fish", { exact: false }).first()).toBeVisible();
	console_.assertNone();
});

test("search for stale QA term 'virus' now returns no results (catalog changed)", async ({ page }) => {
	// Documents current reality vs. the 2026-09-23 QA note that expected to
	// find "vírus do beijo" for this query. The DB now has a single published
	// product and it isn't that one, so the not-found state is correct
	// behavior for the current catalog, not a regression. Actual empty-state
	// copy (confirmed via a manual render probe) is "Nada encontrado para
	// ..." -- a different string than the `/search.notFound.title` i18n key,
	// which appears unused by the actual empty-state component.
	await page.goto("/search?q=virus");
	await expect(page.getByText("Nada encontrado para", { exact: false }).first()).toBeVisible();
});

test("NEW bug: the analytics beacon (/stats/api/send) returns 400 on every page load", async ({ page }) => {
	const [beaconResponse] = await Promise.all([
		page.waitForResponse((res) => STATS_BEACON_BUG.test(res.url()), { timeout: 15_000 }).catch(() => null),
		page.goto("/"),
	]);
	expect(beaconResponse, "expected the /stats/api/send beacon to fire on page load").not.toBeNull();
	expect(beaconResponse?.status()).toBe(400);
});

test("anonymous shopper can add a product to cart and see the cart drawer", async ({ page }) => {
	// Console-error cleanliness of this exact page is already exhaustively
	// checked by the PUBLIC_PAGES loop above (which currently fails here --
	// see docs/qa/e2e-2026-09-25/shopper.md for the broken variant-image bug
	// this PDP has). This test only verifies the cart-drawer behavior.
	await page.goto("/product/little-fish-big-fish");

	await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();

	// Cart drawer opens automatically (context sets isCartOpen(true) on add).
	const drawerTitle = page.getByText(/Carrinho \(\d+\)/);
	await expect(drawerTitle).toBeVisible();
	await expect(drawerTitle).toContainText("Carrinho (1)");

	// A plausible total is shown (don't hardcode a price we haven't read from the page).
	const totalRow = page.getByText("Total", { exact: true }).first();
	await expect(totalRow).toBeVisible();
	const totalValue = page.locator("text=/R\\$\\s?\\d/").first();
	await expect(totalValue).toBeVisible();
});

test.describe("unauthenticated route guards", () => {
	for (const path of ["/orders", "/user", "/admin"]) {
		test(`${path} redirects to /login when there is no session`, async ({ page }) => {
			await page.goto(path);
			await expect(page).toHaveURL(/\/login(\?|$)/);
		});
	}

	test("/reset-password with no token shows a safe invalid/expired state", async ({ page }) => {
		const console_ = trackConsoleErrors(page, { ignore: [STATS_BEACON_BUG] });
		await page.goto("/reset-password");
		await expect(page.getByText("Token inválido ou expirado.", { exact: false })).toBeVisible();
		await expect(page.getByRole("button", { name: "Voltar para o login" })).toBeVisible();
		console_.assertNone();
	});

	test("/checkout/return with no order redirects home with checkout=missing_order", async ({ page }) => {
		await page.goto("/checkout/return");
		await expect(page).toHaveURL(/\/\?checkout=missing_order$/);
	});
});

test("a genuinely unknown route 404s cleanly", async ({ page }) => {
	// A real HTTP 404 response inherently produces a "Failed to load
	// resource: ... 404" console message for the top-level navigation
	// itself in Chromium -- that's expected here (it's the whole point of
	// the test), not a defect, so console errors aren't asserted on this one.
	const response = await page.goto("/this-route-does-not-exist-e2e");
	expect(response?.status()).toBe(404);
	// Rendered as a styled <div>, not a heading role (confirmed via DOM probe).
	await expect(page.getByText("Não encontrado", { exact: true })).toBeVisible();
	await expect(page.getByText("A página que você procura não existe.")).toBeVisible();
});

test.describe("known bug re-verification: home pré-venda CTA", () => {
	test("home no longer exposes a 'Ver a pré-venda' CTA; hero now links straight to the product page", async ({
		page,
	}) => {
		await page.goto("/");

		// The 2026-09-23 QA note found a "Ver a pré-venda" CTA on the home page
		// linking to /pre-venda/little-fish-big-fish, which 404'd because the
		// presale campaign wasn't public. As of 2026-09-25 that CTA text/link no
		// longer exists on the home page at all -- the seeded hero content now
		// resolves to the real "little-fish-big-fish" product and links
		// directly to its PDP ("Comprar agora"), bypassing the presale route
		// entirely. Confirm that's still true and follow whatever the real
		// primary hero CTA is today, without hardcoding a URL.
		const staleCta = page.getByRole("link", { name: /pré-venda/i });
		await expect(staleCta).toHaveCount(0);

		const heroCta = page.getByRole("link", { name: "Comprar agora" }).first();
		await expect(heroCta).toBeVisible();
		const href = await heroCta.getAttribute("href");
		expect(href).toBe("/product/little-fish-big-fish");

		await heroCta.click();
		await expect(page).toHaveURL(/\/product\/little-fish-big-fish$/);
		await expect(page.locator("h1").first()).toBeVisible();
	});

	test("known bug re-verification: /pre-venda/little-fish-big-fish route itself is STILL BROKEN when the campaign is unpublished", async ({
		page,
	}) => {
		// The underlying defect from the QA note -- the presale landing page
		// calls notFound() whenever the presale row isn't published (see
		// src/lib/pre-sale.server.ts:getPreSaleCampaign and
		// src/app/(store)/pre-venda/little-fish-big-fish/page.tsx) -- is
		// unrelated to whether the home page still links there. Verified via
		// `select published from presales;` = false in the local DB. Visiting
		// the route directly still renders a not-found boundary today.
		//
		// This route sits inside the `(store)` route group, which has its own
		// not-found.tsx (src/app/(store)/not-found.tsx) distinct from the
		// generic Global.notFound copy used by truly unmatched routes --
		// confirmed via a manual render probe: "PÁGINA NÃO ENCONTRADA" / "O
		// endereço que você abriu não existe ou saiu do ar. ...".
		await page.goto("/pre-venda/little-fish-big-fish");
		await expect(page.getByText("PÁGINA NÃO ENCONTRADA", { exact: false }).first()).toBeVisible();
		await expect(
			page.getByText("O endereço que você abriu não existe ou saiu do ar.", { exact: false }),
		).toBeVisible();
	});
});
