"use server";

import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { type EditorialContentDoc, editorialContentDocSchema } from "@/lib/editorial-blocks";

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

	// Optimistic concurrency: the editor sends the publishedAt it loaded with.
	const seen = String(formData.get("publishedAt") ?? "");
	const theirs = String(formData.get("serverPublishedAt") ?? "");
	if (theirs && seen && theirs !== seen) {
		return {
			status: "conflict",
			message: `Alguém publicou esta página às ${timeLabel(new Date(theirs))}. Veja o que mudou antes de publicar por cima.`,
			theirs,
		};
	}

	// TODO(fatia 02.3): POST …/publish once the endpoint exists; it also rewrites
	// the page's MediaUsage. Until then the validated document is returned so the
	// screen reports exactly what would be sent.
	return {
		status: "published",
		publishedAt: new Date().toISOString(),
		blocks: doc.length,
		images: countImages(doc),
	};
}
