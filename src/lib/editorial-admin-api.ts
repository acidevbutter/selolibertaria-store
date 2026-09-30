import "server-only";

import { env } from "@/env.mjs";
import { describeBackendStatus } from "@/lib/editorial-backend-errors";
import type { EditorialDocument } from "@/lib/editorial-content";
import { extractImageUrls, syncMediaUsage } from "@/lib/media-usage";

/**
 * Server-only client for the admin editorial write surface of the FastAPI
 * backend. There is no database-shaped abstraction here: every function is a
 * thin `fetch` to a domain endpoint that owns the business rules (slug rename,
 * ordering, publish state). The admin server actions call these directly.
 */

const SAVE_ERROR = "Não foi possível salvar o conteúdo editorial no FastAPI.";

function internalHeaders(actor?: string | null): HeadersInit {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		"X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY,
	};
	if (actor) headers["X-Actor-User-ID"] = actor;
	return headers;
}

type UpsertInput = {
	type: EditorialDocument["type"];
	slug: string;
	title: string;
	/** Full editorial document; stored verbatim as the record `content`. */
	content: Record<string, unknown>;
	published: boolean;
	order: number;
	/** When the editor changed the slug, the previous one so the backend renames in place. */
	previousSlug?: string | null;
};

export async function upsertEditorial(input: UpsertInput, actor?: string | null): Promise<void> {
	const response = await fetch(`${env.FASTAPI_API_URL}/editorial/internal/admin`, {
		method: "PUT",
		headers: internalHeaders(actor),
		body: JSON.stringify({
			type: input.type,
			slug: input.slug,
			title: input.title,
			content: input.content,
			published: input.published,
			order: input.order,
			previous_slug: input.previousSlug && input.previousSlug !== input.slug ? input.previousSlug : null,
		}),
		cache: "no-store",
	});
	if (!response.ok) throw new Error(SAVE_ERROR);
	await syncMediaUsage({
		entityType: `editorial_${input.type}`,
		entityId: input.slug,
		entityLabel: input.title,
		field: "content",
		imageUrls: extractImageUrls(input.content),
	});
}

export async function deleteEditorial(type: EditorialDocument["type"], slug: string): Promise<void> {
	const response = await fetch(
		`${env.FASTAPI_API_URL}/editorial/internal/admin/${encodeURIComponent(type)}/${encodeURIComponent(slug)}`,
		{
			method: "DELETE",
			headers: internalHeaders(),
			cache: "no-store",
		},
	);
	if (!response.ok && response.status !== 404) {
		throw new Error("Não foi possível remover o conteúdo editorial.");
	}
}

export async function reorderEditorial(
	type: EditorialDocument["type"],
	slug: string,
	direction: "up" | "down",
	actor?: string | null,
): Promise<void> {
	const response = await fetch(
		`${env.FASTAPI_API_URL}/editorial/internal/admin/${encodeURIComponent(type)}/reorder`,
		{
			method: "POST",
			headers: internalHeaders(actor),
			body: JSON.stringify({ slug, direction }),
			cache: "no-store",
		},
	);
	if (!response.ok) throw new Error("Não foi possível reordenar o conteúdo editorial.");
}

export async function setEditorialPublished(
	type: EditorialDocument["type"],
	slug: string,
	published: boolean,
	actor?: string | null,
): Promise<void> {
	const response = await fetch(
		`${env.FASTAPI_API_URL}/editorial/internal/admin/${encodeURIComponent(type)}/${encodeURIComponent(slug)}/publish`,
		{
			method: "PATCH",
			headers: internalHeaders(actor),
			body: JSON.stringify({ published }),
			cache: "no-store",
		},
	);
	if (!response.ok) throw new Error(SAVE_ERROR);
}

export type EditorialBackendProbe = { ok: true } | { ok: false; httpStatus: number | null; message: string };

/**
 * One cheap authenticated read against the editorial admin surface. The admin pages fall back to
 * built-in copy when the backend says no, which used to hide a broken internal key behind a page
 * that looked merely "unedited" -- this lets the index say out loud that the backend refused us.
 */
export async function probeEditorialBackend(): Promise<EditorialBackendProbe> {
	try {
		const response = await fetch(`${env.FASTAPI_API_URL}/editorial/internal/admin/page_home`, {
			headers: { "X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY },
			cache: "no-store",
		});
		if (response.ok) return { ok: true };
		return {
			ok: false,
			httpStatus: response.status,
			message: describeBackendStatus(response.status, "as páginas"),
		};
	} catch {
		return {
			ok: false,
			httpStatus: null,
			message: "Não foi possível falar com o servidor do conteúdo editorial.",
		};
	}
}
