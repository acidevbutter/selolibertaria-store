"use server";

import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import { auth } from "@/lib/auth";
import { hasCapability, normalizeUserRole } from "@/lib/authz";
import { centsToReais, reaisToCents } from "@/lib/presale-money";
import {
	LITTLE_FISH_BIG_FISH_PRODUCT_ID,
	LITTLE_FISH_BIG_FISH_SLUG,
	LITTLE_FISH_BIG_FISH_VARIANT_ID,
} from "@/lib/presales";

export type PresaleRecord = {
	id: string;
	productId: string;
	variantId: string;
	launchAt: string;
	presalePrice: number;
	fullPrice: number;
	published: boolean;
	status: "rascunho" | "no_ar" | "encerrada";
	modalEnabled: boolean;
	modalIntervalHours: number;
	modalTitle: string;
	modalBody: string;
	reservationsCount: number;
	amountToCharge: number;
};

export type PresaleReservationRecord = {
	id: string;
	amount: number;
	chargeStatus: "cobrado" | "falhou" | "cancelado";
	createdAt: string;
};

type FastApiPresaleRead = {
	id: string;
	product_id: string;
	variant_id: string;
	launch_at: string;
	presale_price: number;
	full_price: number;
	published: boolean;
	status: PresaleRecord["status"];
	modal_enabled: boolean;
	modal_interval_hours: number;
	modal_title: string;
	modal_body: string;
	reservations_count: number;
	amount_to_charge: number;
};

type FastApiReservationRead = {
	id: string;
	amount: number;
	charge_status: PresaleReservationRecord["chargeStatus"];
	created_at: string;
};

/** Forwards the admin/vendor's own session as a bearer token -- the
 * backend's presale endpoints are CurrentUser + admin-or-vendor, the same
 * "logged-in session already exists" shape as `/settings/`, not the
 * internal-API-key scheme the editorial block editor uses for a different
 * calling context. */
async function forwardToFastapi(path: string, init: RequestInit = {}) {
	const token = (await cookies()).get("session")?.value;
	const headers = new Headers(init.headers);
	headers.set("Content-Type", "application/json");
	if (token) headers.set("Authorization", `Bearer ${token}`);
	return fetch(`${env.FASTAPI_API_URL}${path}`, { ...init, headers, cache: "no-store" });
}

async function requirePresaleOperatorSession() {
	const session = await auth();
	if (!session || !hasCapability(normalizeUserRole(session.user.role), "presale.write")) return null;
	return session;
}

function mapRecord(payload: FastApiPresaleRead): PresaleRecord {
	return {
		id: payload.id,
		productId: payload.product_id,
		variantId: payload.variant_id,
		launchAt: payload.launch_at,
		// Backend amounts are centavos; everything the store shows or edits is reais (see lib/presale-money.ts).
		presalePrice: centsToReais(payload.presale_price),
		fullPrice: centsToReais(payload.full_price),
		published: payload.published,
		status: payload.status,
		modalEnabled: payload.modal_enabled,
		modalIntervalHours: payload.modal_interval_hours,
		modalTitle: payload.modal_title,
		modalBody: payload.modal_body,
		reservationsCount: payload.reservations_count,
		amountToCharge: centsToReais(payload.amount_to_charge),
	};
}

export async function listPresalesAction(): Promise<PresaleRecord[]> {
	if (!(await requirePresaleOperatorSession())) return [];
	try {
		const response = await forwardToFastapi("/presales/");
		if (!response.ok) return [];
		const items = (await response.json()) as FastApiPresaleRead[];
		return items.map(mapRecord);
	} catch (error) {
		console.error("[listPresalesAction]", error);
		return [];
	}
}

export async function listPresaleReservationsAction(presaleId: string): Promise<PresaleReservationRecord[]> {
	if (!(await requirePresaleOperatorSession())) return [];
	try {
		const response = await forwardToFastapi(`/presales/${encodeURIComponent(presaleId)}/reservations`);
		if (!response.ok) return [];
		const items = (await response.json()) as FastApiReservationRead[];
		return items.map((item) => ({
			id: item.id,
			amount: centsToReais(item.amount),
			chargeStatus: item.charge_status,
			createdAt: item.created_at,
		}));
	} catch (error) {
		console.error("[listPresaleReservationsAction]", error);
		return [];
	}
}

/** Reads the little-fish-big-fish presale, creating it (as an unpublished
 * draft, priced off the real catalog variant) the first time the wizard is
 * opened -- there's nothing to PATCH against otherwise. */
export async function getOrCreateLittleFishBigFishPresale(): Promise<PresaleRecord | null> {
	if (!(await requirePresaleOperatorSession())) return null;
	try {
		const existing = await forwardToFastapi(
			`/presales/product/${encodeURIComponent(LITTLE_FISH_BIG_FISH_PRODUCT_ID)}`,
		);
		if (existing.ok) {
			const body = (await existing.json()) as FastApiPresaleRead | null;
			if (body) return mapRecord(body);
		}

		const catalogResponse = await forwardToFastapi(
			`/catalog/management/${encodeURIComponent(LITTLE_FISH_BIG_FISH_SLUG)}`,
		);
		if (!catalogResponse.ok) return null;
		const product = (await catalogResponse.json()) as { variants: { id: string; price: number }[] };
		const variant = product.variants.find((item) => item.id === LITTLE_FISH_BIG_FISH_VARIANT_ID);
		if (!variant) return null;

		const launchAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
		const created = await forwardToFastapi("/presales/", {
			method: "POST",
			body: JSON.stringify({
				product_id: LITTLE_FISH_BIG_FISH_PRODUCT_ID,
				variant_id: LITTLE_FISH_BIG_FISH_VARIANT_ID,
				launch_at: launchAt,
				presale_price: variant.price,
				full_price: variant.price,
				modal_title: "little fish, big fish está em pré-venda",
				modal_body: "Reserve agora com desconto — o exemplar sai na estreia.",
				modal_interval_hours: 2,
			}),
		});
		if (!created.ok) return null;
		return mapRecord((await created.json()) as FastApiPresaleRead);
	} catch (error) {
		console.error("[getOrCreateLittleFishBigFishPresale]", error);
		return null;
	}
}

export type SavePresaleDraftState = { status: "saved" } | { status: "failed"; message: string };

export type PresaleDraftPatch = Partial<{
	launchAt: string;
	presalePrice: number;
	fullPrice: number;
	modalTitle: string;
	modalBody: string;
	modalIntervalHours: number;
}>;

/** Autosave on the wizard's ~3s idle debounce -- PATCH before publish acts
 * as the draft save, since `published=false` already means "not live yet". */
export async function savePresaleDraftAction(
	presaleId: string,
	patch: PresaleDraftPatch,
): Promise<SavePresaleDraftState> {
	if (!(await requirePresaleOperatorSession())) {
		return { status: "failed", message: "Você não tem permissão para editar esta pré-venda." };
	}
	try {
		const response = await forwardToFastapi(`/presales/${encodeURIComponent(presaleId)}`, {
			method: "PATCH",
			body: JSON.stringify({
				launch_at: patch.launchAt,
				presale_price: patch.presalePrice === undefined ? undefined : reaisToCents(patch.presalePrice),
				full_price: patch.fullPrice === undefined ? undefined : reaisToCents(patch.fullPrice),
				modal_title: patch.modalTitle,
				modal_body: patch.modalBody,
				modal_interval_hours: patch.modalIntervalHours,
			}),
		});
		if (!response.ok) {
			return { status: "failed", message: `Não foi possível salvar o rascunho (${response.status}).` };
		}
		return { status: "saved" };
	} catch (error) {
		console.error("[savePresaleDraftAction]", error);
		return { status: "failed", message: "Não foi possível falar com o servidor." };
	}
}

export type PublishPresaleState = { status: "idle" } | { status: "failed"; message: string };

export async function publishPresaleAction(
	presaleId: string,
	_state: PublishPresaleState,
): Promise<PublishPresaleState> {
	if (!(await requirePresaleOperatorSession())) {
		return { status: "failed", message: "Você não tem permissão para publicar esta pré-venda." };
	}
	try {
		const response = await forwardToFastapi(`/presales/${encodeURIComponent(presaleId)}/publish`, {
			method: "POST",
		});
		if (!response.ok) {
			return { status: "failed", message: `Não foi possível publicar (${response.status}).` };
		}
		return { status: "idle" };
	} catch (error) {
		console.error("[publishPresaleAction]", error);
		return { status: "failed", message: "Não foi possível falar com o servidor." };
	}
}

export async function closePresaleAction(presaleId: string): Promise<{ ok: boolean; message?: string }> {
	if (!(await requirePresaleOperatorSession())) {
		return { ok: false, message: "Você não tem permissão para encerrar esta pré-venda." };
	}
	try {
		const response = await forwardToFastapi(`/presales/${encodeURIComponent(presaleId)}/close`, {
			method: "POST",
		});
		if (!response.ok) return { ok: false, message: `Não foi possível encerrar (${response.status}).` };
		return { ok: true };
	} catch (error) {
		console.error("[closePresaleAction]", error);
		return { ok: false, message: "Não foi possível falar com o servidor." };
	}
}

export async function deletePresaleAction(presaleId: string): Promise<{ ok: boolean; message?: string }> {
	if (!(await requirePresaleOperatorSession())) {
		return { ok: false, message: "Você não tem permissão para apagar esta pré-venda." };
	}
	try {
		const response = await forwardToFastapi(`/presales/${encodeURIComponent(presaleId)}`, {
			method: "DELETE",
		});
		if (!response.ok) {
			const body = (await response.json().catch(() => null)) as { detail?: string } | null;
			return { ok: false, message: body?.detail ?? `Não foi possível apagar (${response.status}).` };
		}
		return { ok: true };
	} catch (error) {
		console.error("[deletePresaleAction]", error);
		return { ok: false, message: "Não foi possível falar com o servidor." };
	}
}
