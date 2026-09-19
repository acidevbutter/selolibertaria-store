import "server-only";

import { cookies } from "next/headers";
import { env } from "@/env.mjs";

/** LFBF é o único produto em pré-venda desta fatia (06) -- o menu vira
 * genérico para múltiplas campanhas numa fatia futura (ver plano). */
export const LFBF_PRODUCT_ID = "product_little-fish-big-fish";

export type PresaleStatus = "rascunho" | "no_ar" | "encerrada";

export type Presale = {
	id: string;
	productId: string;
	variantId: string;
	startsAt: string;
	launchAt: string;
	presalePrice: number;
	fullPrice: number;
	published: boolean;
	status: PresaleStatus;
	modalEnabled: boolean;
	modalIntervalHours: number;
	modalTitle: string;
	modalBody: string;
	reservationsCount: number;
	amountToCharge: number;
	setupSkippedAt: string | null;
	createdAt: string;
	updatedAt: string;
};

/** Recorte público de `Presale` -- sem reservationsCount/amountToCharge,
 * que são números internos do negócio, não algo pra expor a visitantes. */
export type PublicPresale = {
	productId: string;
	variantId: string;
	launchAt: string;
	presalePrice: number;
	fullPrice: number;
	status: PresaleStatus;
	modalEnabled: boolean;
	modalIntervalHours: number;
	modalTitle: string;
	modalBody: string;
};

export type PresaleReservation = {
	id: string;
	presaleId: string;
	orderId: string;
	userId: string | null;
	amount: number;
	chargeStatus: string;
	createdAt: string;
};

export type PresaleCreateInput = {
	productId: string;
	variantId: string;
	launchAt: string;
	presalePrice: number;
	fullPrice: number;
	modalTitle: string;
	modalBody: string;
	modalIntervalHours: number;
};

export type PresaleUpdateInput = Partial<{
	launchAt: string;
	presalePrice: number;
	fullPrice: number;
	published: boolean;
	modalEnabled: boolean;
	modalTitle: string;
	modalBody: string;
	modalIntervalHours: number;
}>;

type ApiPresale = {
	id: string;
	product_id: string;
	variant_id: string;
	starts_at: string;
	launch_at: string;
	presale_price: number;
	full_price: number;
	published: boolean;
	status: PresaleStatus;
	modal_enabled: boolean;
	modal_interval_hours: number;
	modal_title: string;
	modal_body: string;
	reservations_count: number;
	amount_to_charge: number;
	setup_skipped_at: string | null;
	created_at: string;
	updated_at: string;
};

type ApiReservation = {
	id: string;
	presale_id: string;
	order_id: string;
	user_id: string | null;
	amount: number;
	charge_status: string;
	created_at: string;
};

function fromApi(presale: ApiPresale): Presale {
	return {
		id: presale.id,
		productId: presale.product_id,
		variantId: presale.variant_id,
		startsAt: presale.starts_at,
		launchAt: presale.launch_at,
		presalePrice: presale.presale_price,
		fullPrice: presale.full_price,
		published: presale.published,
		status: presale.status,
		modalEnabled: presale.modal_enabled,
		modalIntervalHours: presale.modal_interval_hours,
		modalTitle: presale.modal_title,
		modalBody: presale.modal_body,
		reservationsCount: presale.reservations_count,
		amountToCharge: presale.amount_to_charge,
		setupSkippedAt: presale.setup_skipped_at,
		createdAt: presale.created_at,
		updatedAt: presale.updated_at,
	};
}

function reservationFromApi(reservation: ApiReservation): PresaleReservation {
	return {
		id: reservation.id,
		presaleId: reservation.presale_id,
		orderId: reservation.order_id,
		userId: reservation.user_id,
		amount: reservation.amount,
		chargeStatus: reservation.charge_status,
		createdAt: reservation.created_at,
	};
}

/** Mesmo padrão de `@/lib/catalog`: o cookie `session` já guarda o token
 * Bearer que o backend FastAPI espera -- não existe uma troca de credencial
 * separada entre o Next e o FastAPI. */
async function request<T>(path: string, options: RequestInit = {}): Promise<T | null> {
	const token = (await cookies()).get("session")?.value;
	if (!token) throw new Error("Autenticação obrigatória");
	const headers = new Headers(options.headers);
	headers.set("authorization", `Bearer ${token}`);
	const response = await fetch(`${env.FASTAPI_API_URL}${path}`, {
		...options,
		headers,
		cache: "no-store",
	});
	if (response.status === 404) return null;
	if (response.status === 204) return null;
	if (!response.ok) {
		const detail = (await response.json().catch(() => null)) as { detail?: string } | null;
		throw new Error(detail?.detail || "Pré-venda indisponível");
	}
	const text = await response.text();
	return text ? (JSON.parse(text) as T) : null;
}

export async function listPresales(): Promise<Presale[]> {
	const items = await request<ApiPresale[]>("/presales/");
	return (items ?? []).map(fromApi);
}

export async function getPresale(id: string): Promise<Presale | null> {
	const item = await request<ApiPresale>(`/presales/${encodeURIComponent(id)}`);
	return item ? fromApi(item) : null;
}

export async function getPresaleByProduct(productId: string): Promise<Presale | null> {
	const item = await request<ApiPresale>(`/presales/product/${encodeURIComponent(productId)}`);
	return item ? fromApi(item) : null;
}

export async function createPresale(input: PresaleCreateInput): Promise<Presale> {
	const created = await request<ApiPresale>("/presales/", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			product_id: input.productId,
			variant_id: input.variantId,
			launch_at: input.launchAt,
			presale_price: input.presalePrice,
			full_price: input.fullPrice,
			modal_title: input.modalTitle,
			modal_body: input.modalBody,
			modal_interval_hours: input.modalIntervalHours,
		}),
	});
	if (!created) throw new Error("Não foi possível criar a pré-venda.");
	return fromApi(created);
}

export async function updatePresale(id: string, input: PresaleUpdateInput): Promise<Presale> {
	const body: Record<string, unknown> = {};
	if (input.launchAt !== undefined) body.launch_at = input.launchAt;
	if (input.presalePrice !== undefined) body.presale_price = input.presalePrice;
	if (input.fullPrice !== undefined) body.full_price = input.fullPrice;
	if (input.published !== undefined) body.published = input.published;
	if (input.modalEnabled !== undefined) body.modal_enabled = input.modalEnabled;
	if (input.modalTitle !== undefined) body.modal_title = input.modalTitle;
	if (input.modalBody !== undefined) body.modal_body = input.modalBody;
	if (input.modalIntervalHours !== undefined) body.modal_interval_hours = input.modalIntervalHours;
	const updated = await request<ApiPresale>(`/presales/${encodeURIComponent(id)}`, {
		method: "PATCH",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!updated) throw new Error("Não foi possível salvar a pré-venda.");
	return fromApi(updated);
}

export async function publishPresale(id: string): Promise<Presale> {
	const updated = await request<ApiPresale>(`/presales/${encodeURIComponent(id)}/publish`, {
		method: "POST",
	});
	if (!updated) throw new Error("Não foi possível publicar a pré-venda.");
	return fromApi(updated);
}

export async function skipPresaleSetup(id: string): Promise<void> {
	await request(`/presales/${encodeURIComponent(id)}/skip-setup`, { method: "POST" });
}

export async function closePresale(id: string): Promise<Presale> {
	const updated = await request<ApiPresale>(`/presales/${encodeURIComponent(id)}/close`, {
		method: "POST",
	});
	if (!updated) throw new Error("Não foi possível encerrar a pré-venda.");
	return fromApi(updated);
}

export async function deletePresale(id: string): Promise<void> {
	await request(`/presales/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listPresaleReservations(id: string): Promise<PresaleReservation[]> {
	const items = await request<ApiReservation[]>(`/presales/${encodeURIComponent(id)}/reservations`);
	return (items ?? []).map(reservationFromApi);
}

type ApiPublicPresale = {
	product_id: string;
	variant_id: string;
	launch_at: string;
	presale_price: number;
	full_price: number;
	status: PresaleStatus;
	modal_enabled: boolean;
	modal_interval_hours: number;
	modal_title: string;
	modal_body: string;
};

/**
 * Unauthenticated: hits `/presales/public/product/{id}`, the one presales
 * endpoint that doesn't require an admin session. Every other function in
 * this module sends the `session` cookie as a Bearer token, which a
 * storefront visitor never has -- calling those from a public page (landing,
 * countdown popup) would silently look like "no presale" for every real
 * customer.
 */
export async function getPublicPresaleByProduct(productId: string): Promise<PublicPresale | null> {
	const response = await fetch(
		`${env.FASTAPI_API_URL}/presales/public/product/${encodeURIComponent(productId)}`,
		{ cache: "no-store" },
	);
	if (!response.ok) return null;
	const text = await response.text();
	if (!text) return null;
	const presale = JSON.parse(text) as ApiPublicPresale;
	return {
		productId: presale.product_id,
		variantId: presale.variant_id,
		launchAt: presale.launch_at,
		presalePrice: presale.presale_price,
		fullPrice: presale.full_price,
		status: presale.status,
		modalEnabled: presale.modal_enabled,
		modalIntervalHours: presale.modal_interval_hours,
		modalTitle: presale.modal_title,
		modalBody: presale.modal_body,
	};
}
