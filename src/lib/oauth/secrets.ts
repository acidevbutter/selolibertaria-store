import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { env } from "@/env.mjs";

const SECRET_VERSION = "v1";
const SECRET_ALGORITHM = "aes-256-gcm";
const SECRET_IV_LENGTH = 12;
const SECRET_TAG_LENGTH = 16;
const secretKey = createHash("sha256").update(env.OAUTH_SECRETS_ENCRYPTION_KEY).digest();
const legacySecretKey = createHash("sha256")
	.update(env.OAUTH_SECRETS_ENCRYPTION_KEY)
	.update(":oauth-secrets")
	.digest();

function decryptWithKey(value: string, key: Buffer): string | null {
	const [version, ivEncoded, tagEncoded, payloadEncoded] = value.split(".");
	if (version !== SECRET_VERSION || !ivEncoded || !tagEncoded || !payloadEncoded) return null;
	try {
		const decipher = createDecipheriv(SECRET_ALGORITHM, key, Buffer.from(ivEncoded, "base64url"), {
			authTagLength: SECRET_TAG_LENGTH,
		});
		decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
		const decrypted = Buffer.concat([
			decipher.update(Buffer.from(payloadEncoded, "base64url")),
			decipher.final(),
		]);
		return decrypted.toString("utf8");
	} catch {
		return null;
	}
}

export function encryptStoredSecret(value: string | undefined | null): string | null {
	if (!value) return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	const iv = randomBytes(SECRET_IV_LENGTH);
	const cipher = createCipheriv(SECRET_ALGORITHM, secretKey, iv, { authTagLength: SECRET_TAG_LENGTH });
	const encrypted = Buffer.concat([cipher.update(trimmed, "utf8"), cipher.final()]);
	const tag = cipher.getAuthTag();
	return [
		SECRET_VERSION,
		iv.toString("base64url"),
		tag.toString("base64url"),
		encrypted.toString("base64url"),
	].join(".");
}

export function decryptStoredSecret(value: string | undefined | null): string | null {
	if (!value) return null;
	return decryptWithKey(value, secretKey) ?? decryptWithKey(value, legacySecretKey);
}

export function maskStoredSecret(value: string | undefined | null): string | null {
	if (!value) return null;
	const decrypted = decryptStoredSecret(value);
	if (!decrypted) return null;
	if (decrypted.length <= 6) return "configured";
	return `${decrypted.slice(0, 2)}***${decrypted.slice(-2)}`;
}
