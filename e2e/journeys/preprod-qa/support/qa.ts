/**
 * Shared support for the preprod QA suite (e2e/journeys/preprod-qa).
 *
 * Unlike the local suites, this one needs nothing but the public preprod URLs and two fixed accounts
 * (docs/qa/e2e-preprod-2026-09-30/README.md): no docker-exec Postgres helpers, no Mailpit. Credentials
 * come from the environment, never from source:
 *
 *   set -a; . ./.env.e2e.preprod.local; set +a
 *   yarn playwright test e2e/journeys/preprod-qa
 *
 * Every step can leave a screenshot under docs/qa/e2e-preprod-<date>/screenshots (see `shot`) and every
 * finding is recorded by name, so the report maps each screenshot to what was asserted.
 */
import fs from "node:fs";
import path from "node:path";
import type { Page, TestInfo } from "@playwright/test";
import { expect } from "@playwright/test";

export const QA_DATE = process.env.E2E_QA_DATE || "2026-09-30";
export const SHOT_DIR = path.resolve(process.cwd(), "docs", "qa", `e2e-preprod-${QA_DATE}`, "screenshots");

export function env(name: string): string {
	const value = process.env[name];
	if (!value)
		throw new Error(`Missing ${name}. Load .env.e2e.preprod.local before running the preprod QA suite.`);
	return value;
}

export const creds = {
	admin: () => ({ email: env("E2E_ADMIN_EMAIL"), password: env("E2E_ADMIN_PASSWORD") }),
	customer: () => ({ email: env("E2E_CUSTOMER_EMAIL"), password: env("E2E_CUSTOMER_PASSWORD") }),
};

export const API_URL = () => process.env.E2E_API_URL || "https://api-preprod.selolibertaria.com.br";

/** Full-page screenshot named `<spec>--<slug>.png` (stable across re-runs), also attached to the report. */
export async function shot(
	page: Page,
	testInfo: TestInfo,
	name: string,
	options: { fullPage?: boolean } = {},
) {
	fs.mkdirSync(SHOT_DIR, { recursive: true });
	const spec = path.basename(testInfo.file).replace(/\.spec\.ts$/, "");
	const slug = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
	const file = path.join(SHOT_DIR, `${spec}--${slug}.png`);
	const body = await page.screenshot({ path: file, fullPage: options.fullPage ?? true });
	await testInfo.attach(name, { body, contentType: "image/png" });
	return file;
}

const ERROR_BOUNDARY =
	/Ooops, algo deu errado|Algo deu errado|Application error|Internal Server Error|Não foi possível recuperar o carrinho/i;

/** Console errors + 5xx responses seen since `watch()`; assert with `expectClean()`. */
export function watch(page: Page, options: { ignore?: RegExp[] } = {}) {
	// Benign: the e-mail template preview renders untrusted HTML in `<iframe sandbox="">`, so the browser
	// logs that it blocked the HTML's scripts -- that is the sandbox working, not a defect.
	const ignore = options.ignore ?? [
		/favicon/i,
		/\/stats\/api\/send/i,
		/umami/i,
		/googletagmanager|google-analytics/i,
		/Blocked script execution in 'about:srcdoc'/i,
	];
	const problems: string[] = [];
	const keep = (text: string) => !ignore.some((re) => re.test(text));
	page.on("console", (msg) => {
		if (msg.type() === "error" && keep(msg.text())) problems.push(`[console] ${msg.text()}`);
	});
	page.on("pageerror", (err) => {
		if (keep(err.message)) problems.push(`[pageerror] ${err.message}`);
	});
	page.on("response", (res) => {
		if (res.status() >= 500 && keep(res.url()))
			problems.push(`[${res.status()}] ${res.request().method()} ${res.url()}`);
	});
	return {
		problems,
		async expectClean(label: string) {
			const body =
				(await page
					.locator("body")
					.innerText()
					.catch(() => "")) || "";
			expect(body, `${label}: error boundary visible`).not.toMatch(ERROR_BOUNDARY);
			expect(problems, `${label}: console/5xx problems`).toEqual([]);
		},
	};
}

/** Real login through /login (the same form customers use). Lands wherever the app sends that role. */
export async function login(page: Page, account: { email: string; password: string }) {
	await page.goto("/login");
	await page.locator("#login-email").fill(account.email);
	await page.locator("#login-password").fill(account.password);
	await page.getByRole("button", { name: "Entrar" }).click();
	await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 45_000 });
}

/** A valid 1x1 PNG, for exercising real uploads without shipping a fixture file. */
export const TINY_PNG = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
	"base64",
);

/** The live presale notice pops up a few seconds after load and covers the page until dismissed, like for a visitor. */
export async function dismissPresaleNotice(page: Page, waitMs = 10_000) {
	const later = page.getByRole("button", { name: "Agora não" });
	const appeared = await later
		.waitFor({ state: "visible", timeout: waitMs })
		.then(() => true)
		.catch(() => false);
	if (appeared) await later.click();
}
