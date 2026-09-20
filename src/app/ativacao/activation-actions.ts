"use server";

import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import { auth } from "@/lib/auth";
import { normalizeUserRole } from "@/lib/authz";

export type ActivationRecord = { activated: boolean; activatedAt: string | null };

/** Forwards the admin's own session as a bearer token — the backend's
 * site-activation endpoints are CurrentUser + require_admin, the same
 * "logged-in admin already has a session" shape as `/settings/`, not the
 * internal-API-key scheme the editorial block editor uses for its own,
 * different (no user session) calling context. */
async function forwardToFastapi(path: string, init: RequestInit = {}) {
	const token = (await cookies()).get("session")?.value;
	const headers = new Headers(init.headers);
	headers.set("Content-Type", "application/json");
	if (token) headers.set("Authorization", `Bearer ${token}`);
	return fetch(`${env.FASTAPI_API_URL}${path}`, { ...init, headers, cache: "no-store" });
}

export async function getSiteActivationForAdmin(): Promise<ActivationRecord | null> {
	try {
		const response = await forwardToFastapi("/site-activation/");
		if (!response.ok) return null;
		const body = (await response.json()) as { activated: boolean; activated_at: string | null };
		return { activated: body.activated, activatedAt: body.activated_at };
	} catch (error) {
		console.error("[getSiteActivationForAdmin]", error);
		return null;
	}
}

/** Called once the little-fish-big-fish presale wizard publishes
 * successfully -- flips the global gate so /admin unblocks. */
export async function activateSiteAction(): Promise<{ ok: boolean; message?: string }> {
	const session = await auth();
	if (!session || normalizeUserRole(session.user.role) !== "admin") {
		return { ok: false, message: "Você não tem permissão para concluir a ativação do site." };
	}
	try {
		const response = await forwardToFastapi("/site-activation/activate", { method: "POST" });
		if (!response.ok) {
			return { ok: false, message: `Não foi possível ativar o site (${response.status}).` };
		}
		return { ok: true };
	} catch (error) {
		console.error("[activateSiteAction]", error);
		return { ok: false, message: "Não foi possível falar com o servidor." };
	}
}
