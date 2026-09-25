import { expect, test } from "@playwright/test";
import { e2eEmail } from "../../support/fixtures";

/**
 * Contato e newsletter.
 *
 * Source read first: src/ui/contact/contact-form.client.tsx. Validation
 * here is native HTML5 (`required`/`type="email"`), NOT a custom
 * inline-error component -- but the component overrides the native bubble's
 * text via `setCustomValidity()` in its `onInvalid` handler specifically
 * because (per its own code comment) Chromium's native validation-bubble
 * text follows the browser UI language, not the page's `lang`, so without
 * that override it shows English even on this pt-BR-only site. This is
 * exactly the bug the 2026-09-23 QA pass flagged
 * (docs/qa/e2e-2026-09-23.md #2: "Please fill out this field." in English).
 * The submit itself never calls a real API (it's a client-only mock -- see
 * the file header note in the spec below).
 *
 * Newsletter: the only opt-in distinct from the contact form and from the
 * register form's marketing checkbox is the footer newsletter (see
 * src/ui/footer/newsletter.client.tsx) -- a separate email field + a Server
 * Action (`signForNewsletter`) that shows a `sonner` toast on success.
 */

test("contact form: empty submit — checking native validation language (known bug re-verification)", async ({
	page,
}) => {
	await page.goto("/contact");

	await page.getByRole("button", { name: "Enviar mensagem" }).click();

	// The first required field to fail constraint validation is #name. Read
	// its actual `validationMessage` -- this is exactly the text the native
	// bubble shows, and it reflects setCustomValidity() when the onInvalid
	// handler has run (which happens as part of the browser's own submit-time
	// validation pass, i.e. synchronously by the time click() resolves).
	const nameValidationMessage = await page
		.locator("#name")
		.evaluate((el) => (el as HTMLInputElement).validationMessage);

	test.info().annotations.push({
		type: "contact-form-validation-language",
		description: `validationMessage observed: ${JSON.stringify(nameValidationMessage)}`,
	});

	// pt-BR text from /contact.form.validation.required ("Preencha este
	// campo.") means the 2026-09-23 bug is NOW FIXED. The stale English
	// default ("Please fill out this field.") would mean STILL BROKEN.
	expect(nameValidationMessage).toBe("Preencha este campo.");
});

test("contact form: valid pt-BR submission shows the success confirmation", async ({ page }) => {
	await page.goto("/contact");

	await page.locator("#name").fill("Carla Contato Teste");
	await page.locator("#email").fill(e2eEmail("contact"));
	await page.locator("#subject").fill("Dúvida sobre encomenda");
	await page.locator("#message").fill("Olá! Gostaria de saber mais sobre prazos de entrega. Obrigada.");

	await page.getByRole("button", { name: "Enviar mensagem" }).click();

	await expect(page.getByText("Mensagem enviada com sucesso")).toBeVisible({ timeout: 10_000 });
});

test("footer newsletter opt-in is a distinct flow and shows a success toast", async ({ page }) => {
	await page.goto("/");

	const newsletterForm = page.locator("form", { has: page.getByRole("button", { name: "Assinar" }) });
	await expect(newsletterForm).toBeVisible();

	await newsletterForm.locator('input[type="email"]').fill(e2eEmail("newsletter"));
	await newsletterForm.getByRole("button", { name: "Assinar" }).click();

	await expect(page.getByText("Inscrição enviada.")).toBeVisible({ timeout: 10_000 });
});
