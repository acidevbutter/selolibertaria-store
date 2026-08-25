// @vitest-environment node

import { createCipheriv, createHash, randomBytes } from "crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const SECRET_ALGORITHM = "aes-256-gcm";
const SECRET_IV_LENGTH = 12;
const SECRET_TAG_LENGTH = 16;

let decryptStoredSecret: typeof import("@/lib/oauth/secrets").decryptStoredSecret;
let encryptStoredSecret: typeof import("@/lib/oauth/secrets").encryptStoredSecret;

function encryptWithLegacyKey(value: string) {
	const key = createHash("sha256")
		.update(process.env.OAUTH_SECRETS_ENCRYPTION_KEY ?? "dev_oauth_secrets_key_change_me_please_123456")
		.update(":oauth-secrets")
		.digest();
	const iv = randomBytes(SECRET_IV_LENGTH);
	const cipher = createCipheriv(SECRET_ALGORITHM, key, iv, { authTagLength: SECRET_TAG_LENGTH });
	const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
	const tag = cipher.getAuthTag();
	return ["v1", iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(
		".",
	);
}

describe("oauth secret storage", () => {
	beforeAll(async () => {
		({ decryptStoredSecret, encryptStoredSecret } = await import("@/lib/oauth/secrets"));
	});

	it("roundtrips values with the JWT secret derived key", () => {
		const encrypted = encryptStoredSecret("google-client-secret-123");

		expect(encrypted).toBeTruthy();
		expect(decryptStoredSecret(encrypted)).toBe("google-client-secret-123");
	});

	it("keeps decrypting legacy values encrypted with the namespaced key", () => {
		const encrypted = encryptWithLegacyKey("legacy-secret");

		expect(decryptStoredSecret(encrypted)).toBe("legacy-secret");
	});
});
