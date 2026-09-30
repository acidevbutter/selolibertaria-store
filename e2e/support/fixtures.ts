/**
 * Shared test data/helpers for the Selo Libertária e2e suite. Both the
 * shopper and admin journey specs import from here so DB/mailpit access
 * conventions stay in one place.
 *
 * Local infra assumed running (docker compose, see CLAUDE.md):
 * - frontend dev server: http://localhost:3001 (this repo's `yarn dev`)
 * - FastAPI backend: http://localhost:9001 (container `selolibertaria-backend-api`)
 * - Postgres: localhost:5436 (container `infra-shared-postgres-1`, db `selolibertaria_backend`)
 * - Mailpit: http://localhost:8025 (SMTP capture, container `selolibertaria-mailpit`)
 */
import { execFileSync } from "node:child_process";

const RUN_ID = process.env.E2E_RUN_ID || Date.now().toString(36);

export function e2eEmail(journey: string) {
	return `e2e.${journey}.${RUN_ID}@selolibertaria.com.br`;
}

/** Checksum-valid CPF (not a real person's document) used across checkout specs. */
export const TEST_CPF = "529.982.247-25";

/** Av. Paulista, São Paulo — resolves via ViaCEP-backed /api/address/postal-lookup. */
export const TEST_CEP = "01310-100";

/** Shared strong-password fixture satisfying the length/upper/lower/digit/special rule. */
export const TEST_PASSWORD = "Selolibertaria!2026";

const MAILPIT_BASE = process.env.E2E_MAILPIT_URL || "http://localhost:8025";

type MailpitMessageSummary = { ID: string; To: { Address: string }[]; Subject: string };

/** Polls Mailpit's REST API for the newest message to `to`, up to `timeoutMs`. */
export async function waitForMailpitMessage(
	to: string,
	timeoutMs = 15_000,
): Promise<{ subject: string; text: string; html: string }> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		const res = await fetch(`${MAILPIT_BASE}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`);
		if (res.ok) {
			const data = (await res.json()) as { messages: MailpitMessageSummary[] };
			const match = data.messages?.find((m) => m.To?.some((addr) => addr.Address === to));
			if (match) {
				const detail = (await fetch(`${MAILPIT_BASE}/api/v1/message/${match.ID}`).then((r) => r.json())) as {
					Subject: string;
					Text: string;
					HTML: string;
				};
				return { subject: detail.Subject, text: detail.Text, html: detail.HTML };
			}
		}
		await new Promise((resolve) => setTimeout(resolve, 750));
	}
	throw new Error(`No Mailpit message arrived for ${to} within ${timeoutMs}ms`);
}

/** Extracts the first absolute http(s) URL from an email body (verification/reset links). */
export function extractFirstLink(body: string): string {
	const match = body.match(/https?:\/\/[^\s"'<>]+/);
	if (!match) throw new Error(`No link found in email body: ${body.slice(0, 200)}`);
	return match[0];
}

/**
 * Promotes a user to ADMIN directly in the local dev Postgres. Only for
 * this e2e suite's own throwaway accounts (emails created via e2eEmail());
 * never point this at a real customer's address.
 */
export function promoteToAdminInDb(email: string) {
	if (!email.startsWith("e2e.")) {
		throw new Error(`Refusing to promote non-e2e account to ADMIN: ${email}`);
	}
	execFileSync("docker", [
		"exec",
		"infra-shared-postgres-1",
		"psql",
		"-U",
		"selolibertaria",
		"-d",
		"selolibertaria_backend",
		"-c",
		`UPDATE users SET role='ADMIN' WHERE email='${email}';`,
	]);
}

export function queryDb(sql: string): string {
	return execFileSync("docker", [
		"exec",
		"infra-shared-postgres-1",
		"psql",
		"-U",
		"selolibertaria",
		"-d",
		"selolibertaria_backend",
		"-t",
		"-A",
		"-c",
		sql,
	]).toString();
}
