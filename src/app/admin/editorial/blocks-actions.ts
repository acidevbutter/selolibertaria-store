"use server";

import { env } from "@/env.mjs";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { type EditorialContentDoc, editorialContentDocSchema } from "@/lib/editorial-blocks";

/** The nine editorial page identities the block editor can load/save (§1). */
export type EditorialPageType =
	| "page_home"
	| "page_events"
	| "page_projects"
	| "page_products"
	| "page_product"
	| "page_about"
	| "page_contact"
	| "page_sarau"
	| "site_global";

export type EditorialBlocksRecord = {
	title: string;
	content: Record<string, unknown>;
	draftDoc: EditorialContentDoc | null;
	publishedDoc: EditorialContentDoc | null;
	publishedAt: string | null;
};

type FastApiEditorialFull = {
	slug: string;
	title: string;
	content: Record<string, unknown>;
	draft_doc: EditorialContentDoc | null;
	published_doc: EditorialContentDoc | null;
	published_at: string | null;
};

/**
 * Reads the record behind a page's block editor, including `draft_doc`/
 * `published_doc` — fields `editorial-content-store.ts`'s `mapEditorial()`
 * discards, since that module only serves the legacy per-field forms.
 * There is no admin GET-by-slug endpoint, so this lists the content type and
 * filters (same pattern as `getEditorialProjectRecordBySlug` in actions.ts).
 */
export async function getEditorialBlocksRecord(
	type: EditorialPageType,
	slug: string,
): Promise<EditorialBlocksRecord | null> {
	try {
		const response = await fetch(`${env.FASTAPI_API_URL}/editorial/internal/admin/${type}`, {
			headers: { "X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY },
			cache: "no-store",
		});
		if (!response.ok) return null;
		const items = (await response.json()) as FastApiEditorialFull[];
		const item = items.find((entry) => entry.slug === slug);
		if (!item) return null;
		return {
			title: item.title,
			content: item.content ?? {},
			draftDoc: item.draft_doc,
			publishedDoc: item.published_doc,
			publishedAt: item.published_at,
		};
	} catch {
		return null;
	}
}

function backendHeaders(actorId: string) {
	return {
		"Content-Type": "application/json",
		"X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY,
		"X-Actor-User-ID": actorId,
	};
}

/** Shared by the explicit "Publicar" action and the editor's own autosave —
 *  both write the same `draft_doc` field on the same record. */
function putDraftDoc(type: string, slug: string, actorId: string, doc: EditorialContentDoc) {
	return fetch(`${env.FASTAPI_API_URL}/editorial/internal/admin/${type}/${slug}/draft`, {
		method: "PUT",
		headers: backendHeaders(actorId),
		body: JSON.stringify({ draft_doc: doc }),
		cache: "no-store",
	});
}

export type SaveDraftState = { status: "saved"; savedAt: string } | { status: "failed"; message: string };

/**
 * The editor's autosave calls this on a debounce (§9 draft semantics): the
 * "Rascunho salvo às HH:MM" indicator used to be cosmetic -- it flipped a
 * local timer without ever reaching the backend, so a closed tab silently
 * lost every unpublished edit. This is the only place that fixes that: it
 * writes `draft_doc` for real, the same PUT the publish flow already used.
 */
export async function saveEditorialDraftAction(
	type: EditorialPageType,
	slug: string,
	doc: EditorialContentDoc,
): Promise<SaveDraftState> {
	const session = await auth();
	if (!session || !hasCapability(session.user.role, "editorial.write")) {
		return { status: "failed", message: "Você não tem permissão para editar esta página." };
	}

	const result = editorialContentDocSchema.safeParse(doc);
	if (!result.success) {
		return { status: "failed", message: "O documento local ficou inválido — recarregue a página." };
	}

	try {
		const response = await putDraftDoc(type, slug, session.user.id, result.data);
		if (!response.ok) {
			return { status: "failed", message: `Não foi possível salvar o rascunho (${response.status}).` };
		}
		return { status: "saved", savedAt: timeLabel(new Date()) };
	} catch (error) {
		console.error("[saveEditorialDraftAction]", error);
		return { status: "failed", message: "Não foi possível falar com o servidor." };
	}
}

export type PublishState =
	| { status: "idle" }
	| { status: "published"; publishedAt: string; blocks: number; images: number }
	/** The schema refused a node: a 12th type never renders silently. */
	| { status: "invalid"; code: 422; message: string }
	| { status: "failed"; message: string }
	| { status: "conflict"; message: string; theirs: string };

/** An image whose upload has not finished yet still carries a local blob URL. */
function firstPendingImage(doc: EditorialContentDoc) {
	return doc.findIndex((node) => node.type === "image" && (!node.src || node.src.startsWith("blob:")));
}

function countImages(doc: EditorialContentDoc) {
	return doc.reduce(
		(total, node) => total + (node.type === "image" ? 1 : node.type === "gallery" ? node.images.length : 0),
		0,
	);
}

function timeLabel(date: Date) {
	return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/**
 * Publica o rascunho (§9). Validation is Zod against the closed list of eleven
 * types — anything else is a 422, never a silent render. The draft is never
 * discarded by a refusal: every failure says what to do and what was not lost.
 *
 * `type`/`slug` identify which of the nine pages this is — the editor is one
 * component/route, parameterized by these two hidden fields instead of the
 * fixed demo document the route used to carry.
 */
export async function publishEditorialDraftAction(
	_state: PublishState,
	formData: FormData,
): Promise<PublishState> {
	const session = await auth();
	if (!session || !hasCapability(session.user.role, "editorial.write")) {
		return { status: "failed", message: "Você não tem permissão para publicar esta página." };
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(String(formData.get("contentDoc") ?? "null"));
	} catch {
		return { status: "invalid", code: 422, message: "O documento não é um JSON válido." };
	}

	const result = editorialContentDocSchema.safeParse(parsed);
	if (!result.success) {
		const badType = result.error.issues[0]?.path?.[0];
		return {
			status: "invalid",
			code: 422,
			message: `O servidor recusou o bloco ${typeof badType === "number" ? badType + 1 : "?"}: tipo fora dos onze permitidos.`,
		};
	}

	const doc = result.data;
	const pending = firstPendingImage(doc);
	const savedAt = timeLabel(new Date());
	if (pending >= 0) {
		return {
			status: "failed",
			message: `A imagem ${pending + 1} não terminou de subir. O rascunho está salvo às ${savedAt} — tente publicar de novo.`,
		};
	}

	const type = String(formData.get("type") ?? "");
	const slug = String(formData.get("slug") ?? "");
	if (!type || !slug) {
		return { status: "failed", message: "Página inválida: identidade da página ausente." };
	}

	const actorId = session.user.id;
	const seen = String(formData.get("publishedAt") ?? "") || null;

	try {
		// PUT …/draft first: publish() on the backend promotes whatever
		// draft_doc is currently stored, so the doc being published has to
		// land there before the publish call.
		const draftResponse = await putDraftDoc(type, slug, actorId, doc);
		if (draftResponse.status === 403) {
			return { status: "failed", message: "Você não tem permissão para publicar esta página." };
		}
		if (!draftResponse.ok) {
			return {
				status: "failed",
				message: `Não foi possível salvar o rascunho no servidor (${draftResponse.status}). O rascunho local está salvo às ${savedAt}.`,
			};
		}

		const publishResponse = await fetch(
			`${env.FASTAPI_API_URL}/editorial/internal/admin/${type}/${slug}/publish`,
			{
				method: "POST",
				headers: backendHeaders(actorId),
				body: JSON.stringify({ publishedAt: seen }),
				cache: "no-store",
			},
		);

		if (publishResponse.status === 409) {
			const body = (await publishResponse.json().catch(() => null)) as { publishedAt?: string } | null;
			const theirs = body?.publishedAt ?? new Date().toISOString();
			return {
				status: "conflict",
				message: `Alguém publicou esta página às ${timeLabel(new Date(theirs))}. Veja o que mudou antes de publicar por cima.`,
				theirs,
			};
		}
		if (publishResponse.status === 403) {
			return { status: "failed", message: "Você não tem permissão para publicar esta página." };
		}
		if (publishResponse.status === 422) {
			const body = (await publishResponse.json().catch(() => null)) as { detail?: unknown } | null;
			return {
				status: "invalid",
				code: 422,
				message: `O servidor recusou o documento: ${JSON.stringify(body?.detail ?? "erro de validação")}.`,
			};
		}
		if (!publishResponse.ok) {
			return {
				status: "failed",
				message: `Não foi possível publicar (${publishResponse.status}). O rascunho está salvo às ${savedAt}.`,
			};
		}

		const published = (await publishResponse.json()) as { published_at: string };
		return {
			status: "published",
			publishedAt: published.published_at,
			blocks: doc.length,
			images: countImages(doc),
		};
	} catch (error) {
		console.error("[publishEditorialDraftAction]", error);
		return {
			status: "failed",
			message: `Não foi possível falar com o servidor. O rascunho está salvo às ${savedAt} — tente publicar de novo.`,
		};
	}
}
