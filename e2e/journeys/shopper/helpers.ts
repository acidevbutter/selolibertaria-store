/**
 * Shared helpers for the shopper journey specs. Keeps console-error capture
 * and a couple of small conveniences in one place so each spec file stays
 * focused on the flow it's testing.
 */
import type { Locator, Page, TestInfo } from "@playwright/test";
import { expect } from "@playwright/test";
import { extractFirstLink, queryDb, waitForMailpitMessage } from "../../support/fixtures";

/** True once `current` contains at least the digits of `value` (for fields the
 * app reformats on input, like CPF/phone -- comparing raw strings for
 * equality would always fail there). */
export function containsDigitsOf(value: string) {
	const wanted = digitsOnly(value);
	return (current: string) => digitsOnly(current).length > 0 && digitsOnly(current) === wanted;
}

/**
 * Attaches `console`/`pageerror` listeners to `page` and returns a getter for
 * any error-level messages seen so far. Call this once per test, right after
 * the page is created/before the first navigation, so nothing is missed.
 *
 * `ignore` lets a caller exclude patterns for defects that are already
 * covered by their own dedicated, deterministic test elsewhere in this
 * suite (see anonymous.spec.ts's `/stats/api/send` test) -- without this,
 * a single app-wide regression like that one would nondeterministically fail
 * every unrelated per-page test depending on network timing, which hides
 * real per-page findings instead of surfacing them.
 */
export function trackConsoleErrors(page: Page, options: { ignore?: RegExp[] } = {}) {
	const ignore = options.ignore ?? [];
	const errors: string[] = [];

	function record(message: string) {
		if (ignore.some((pattern) => pattern.test(message))) return;
		errors.push(message);
	}

	page.on("console", (msg) => {
		if (msg.type() === "error") {
			record(`[console.error] ${msg.text()}`);
		}
	});
	page.on("pageerror", (err) => {
		record(`[pageerror] ${err.message}`);
	});

	return {
		errors,
		assertNone() {
			if (errors.length > 0) {
				throw new Error(`Expected no console/page errors, got:\n${errors.join("\n")}`);
			}
		},
	};
}

/** Digits-only helper for asserting on phone/CEP/CPF inputs. */
export function digitsOnly(value: string) {
	return value.replace(/\D+/g, "");
}

/**
 * Fills a controlled-input field and verifies the value actually stuck,
 * retrying if not.
 *
 * NEW bug found while writing guest-checkout.spec.ts / account-checkout.spec.ts:
 * this dev environment's Next.js server is frequently slow to finish
 * compiling+hydrating a route (a visible "Compiling ..." badge was caught in
 * a failure screenshot), and under that load a plain `locator.fill()` can
 * land on a controlled input (e.g. `AsaasCheckoutForm`'s "Nome completo")
 * before its `onChange` handler is wired up. The browser sets the DOM value
 * immediately regardless, so it's visible on screen, but once React
 * hydration actually takes over moments later it re-renders the field from
 * its own (still-empty) state and silently wipes out what was typed -- with
 * no error, just a field that looks filled and then quietly isn't by the
 * time you submit (confirmed via a repro where the checkout form later
 * rejected the submit with "Informe seu nome completo." despite the field
 * having been filled and visibly showing text earlier in the run). Retrying
 * the fill after confirming it reverted works around this without a blind
 * sleep.
 */
export async function fillReliably(
	locator: Locator,
	value: string,
	options: { attempts?: number; isFilled?: (current: string) => boolean } = {},
) {
	const attempts = options.attempts ?? 3;
	const isFilled = options.isFilled ?? ((current: string) => current === value);
	for (let i = 0; i < attempts; i++) {
		await locator.fill(value);
		await locator.page().waitForTimeout(300);
		if (isFilled(await locator.inputValue())) return;
	}
	await expect.poll(() => locator.inputValue().then(isFilled)).toBe(true);
}

/**
 * BLOCKING ENVIRONMENT ISSUE (confirmed 2026-09-25, see
 * docs/qa/e2e-2026-09-25/shopper.md): transactional email is completely
 * non-functional in this local environment. Root cause, traced end-to-end:
 * `RELAY_PROJECT_ID` is blank in the `selolibertaria-backend-api` container
 * (`docker exec selolibertaria-backend-api env`), so
 * `RelayClient.enabled` (backend/app/core/clients/relay_client.py:16-18) is
 * `False`, and `NotificationService._send()`
 * (backend/app/notifications/service.py:31-33) then does
 * `if not self.relay.enabled: return` -- a SILENT no-op with no log, no
 * error, nothing. `/auth/register` and `/auth/password-reset` both still
 * return success to the caller. Mailpit's own inbox is confirmed completely
 * empty (`GET /api/v1/messages` -> `total: 0`) regardless of recipient, so
 * this isn't a filtering/timing issue -- no transactional email of any kind
 * is being delivered right now.
 *
 * Every spec that needs a real emailed link therefore falls back to reading
 * the token straight out of Postgres (read-only, same pattern
 * e2e/support/fixtures.ts already uses for `promoteToAdminInDb`/`queryDb`)
 * so the rest of the flow (the verify/reset route handlers, login
 * afterward) can still be exercised end-to-end. This is only possible for
 * signup verification, because `users.verification_token` is stored in
 * plaintext (backend/app/auth/service.py:38-65); the password-reset token is
 * stored as `password_reset_token_hash` (hashed), so it cannot be recovered
 * this way -- see password-reset.spec.ts for how that spec handles it.
 */
export async function resolveVerificationLink(email: string, testInfo: TestInfo): Promise<string> {
	try {
		const message = await waitForMailpitMessage(email, 6_000);
		return extractFirstLink(message.text || message.html);
	} catch {
		testInfo.annotations.push({
			type: "mailpit-blocked",
			description: `No verification email arrived for ${email} (RELAY_PROJECT_ID unset -- see helpers.ts). Falling back to reading users.verification_token directly from Postgres.`,
		});
		const escaped = email.replace(/'/g, "''");
		const token = queryDb(`select verification_token from users where email = '${escaped}';`).trim();
		if (!token)
			throw new Error(
				`No verification_token found in DB for ${email} either -- registration may have failed`,
			);
		return `/api/auth/verify?token=${encodeURIComponent(token)}`;
	}
}
