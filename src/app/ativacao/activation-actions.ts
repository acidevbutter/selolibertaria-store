"use server";

import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import { auth } from "@/lib/auth";
import { normalizeUserRole } from "@/lib/authz";

export type ActivationRecord = {
	activated: boolean;
	activatedAt: string | null;
	deactivatedAt: string | null;
};

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

type ActivationApiBody = {
	activated: boolean;
	activated_at: string | null;
	deactivated_at: string | null;
};

function toActivationRecord(body: ActivationApiBody): ActivationRecord {
	return { activated: body.activated, activatedAt: body.activated_at, deactivatedAt: body.deactivated_at };
}

export async function getSiteActivationForAdmin(): Promise<ActivationRecord | null> {
	try {
		const response = await forwardToFastapi("/site-activation/");
		if (!response.ok) return null;
		return toActivationRecord((await response.json()) as ActivationApiBody);
	} catch (error) {
		console.error("[getSiteActivationForAdmin]", error);
		return null;
	}
}

type ActivationActionResult = { ok: boolean; message?: string; activation?: ActivationRecord };

/** Called once the little-fish-big-fish presale wizard publishes
 * successfully -- flips the global gate so /admin unblocks. */
export async function activateSiteAction(): Promise<ActivationActionResult> {
	const session = await auth();
	if (!session || normalizeUserRole(session.user.role) !== "admin") {
		return { ok: false, message: "Você não tem permissão para concluir a ativação do site." };
	}
	try {
		const response = await forwardToFastapi("/site-activation/activate", { method: "POST" });
		if (!response.ok) {
			return { ok: false, message: `Não foi possível ativar o site (${response.status}).` };
		}
		return { ok: true, activation: toActivationRecord((await response.json()) as ActivationApiBody) };
	} catch (error) {
		console.error("[activateSiteAction]", error);
		return { ok: false, message: "Não foi possível falar com o servidor." };
	}
}

/** Puts the storefront back into maintenance (see src/proxy.ts and
 * src/lib/maintenance-mode.ts, both fail-closed to "not activated" when
 * this can't be read) without touching the database directly. */
export async function deactivateSiteAction(): Promise<ActivationActionResult> {
	const session = await auth();
	if (!session || normalizeUserRole(session.user.role) !== "admin") {
		return { ok: false, message: "Você não tem permissão para desativar o site." };
	}
	try {
		const response = await forwardToFastapi("/site-activation/deactivate", { method: "POST" });
		if (!response.ok) {
			return { ok: false, message: `Não foi possível desativar o site (${response.status}).` };
		}
		return { ok: true, activation: toActivationRecord((await response.json()) as ActivationApiBody) };
	} catch (error) {
		console.error("[deactivateSiteAction]", error);
		return { ok: false, message: "Não foi possível falar com o servidor." };
	}
}
