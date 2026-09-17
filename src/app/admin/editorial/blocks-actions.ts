"use server";

import { env } from "@/env.mjs";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { type EditorialContentDoc, editorialContentDocSchema } from "@/lib/editorial-blocks";

/**
 * The block editor screen (fatia 05.3-05.4) is currently a single fixed demo
 * route (src/app/admin/editorial/blocos/page.tsx), not yet wired to a real
 * per-page picker -- that's later fatia work. Until the route carries a real
 * content_type/slug, this is the one page identity the editor writes to on
 * the backend (app/editorial/router.py's {content_type}/{slug} path params).
 */
const CONTENT_TYPE = "page";
const DEFAULT_SLUG = "blocos-demo";

function backendHeaders(actorId: string) {
	return {
		"Content-Type": "application/json",
		"X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY,
		"X-Actor-User-ID": actorId,
	};
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

	const actorId = session.user.id;
	const slug = String(formData.get("slug") ?? "") || DEFAULT_SLUG;
	const seen = String(formData.get("publishedAt") ?? "") || null;

	try {
		// PUT …/draft first: publish() on the backend promotes whatever
		// draft_doc is currently stored, so the doc being published has to
		// land there before the publish call.
		const draftResponse = await fetch(
			`${env.FASTAPI_API_URL}/editorial/internal/admin/${CONTENT_TYPE}/${slug}/draft`,
			{
				method: "PUT",
				headers: backendHeaders(actorId),
				body: JSON.stringify({ draft_doc: doc }),
				cache: "no-store",
			},
		);
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
			`${env.FASTAPI_API_URL}/editorial/internal/admin/${CONTENT_TYPE}/${slug}/publish`,
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
