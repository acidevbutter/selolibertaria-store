import "server-only";

import { env } from "@/env.mjs";

type PasswordPurpose = "setup" | "reset";

async function internalPost(path: string, body: Record<string, unknown>) {
	const response = await fetch(`${env.FASTAPI_API_URL}${path}`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"x-internal-api-key": env.FASTAPI_INTERNAL_API_KEY,
		},
		body: JSON.stringify(body),
		cache: "no-store",
	});
	if (response.ok) return response.json() as Promise<{ token: string; expires_at: string }>;
	throw new Error("Não foi possível emitir o token de acesso.");
}

export async function issueAccountAccessToken(input: { userId: string; orderId: string }) {
	const result = await internalPost("/auth/internal/account-access", {
		user_id: input.userId,
		order_id: input.orderId,
	});
	return { token: result.token, expiresAt: new Date(result.expires_at) };
}

export async function issuePasswordResetToken(input: { userId: string; purpose?: PasswordPurpose }) {
	const result = await internalPost("/auth/internal/password-token", {
		user_id: input.userId,
		purpose: input.purpose ?? "reset",
	});
	return { token: result.token, expiresAt: new Date(result.expires_at) };
}

export async function issuePasswordSetupToken(userId: string) {
	return issuePasswordResetToken({ userId, purpose: "setup" });
}
