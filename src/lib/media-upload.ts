import { env } from "@/env.mjs";

export async function uploadImageFileToFastAPI(file: File, actor?: string | null, alt?: string) {
	const formData = new FormData();
	formData.set("file", file, file.name || "image");
	if (alt) formData.set("alt", alt);
	const headers: HeadersInit = { "X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY };
	if (actor) headers["X-Actor-User-ID"] = actor;
	const response = await fetch(`${env.FASTAPI_API_URL}/media/internal/admin/upload`, {
		method: "POST",
		headers,
		body: formData,
		cache: "no-store",
	});
	const payload = (await response.json().catch(() => null)) as {
		url?: string;
		public_id?: string;
		detail?: string;
	} | null;
	if (!response.ok || !payload?.url || !payload.public_id) {
		throw new Error(payload?.detail || "Não foi possível enviar a imagem.");
	}
	return { secure_url: payload.url, public_id: payload.public_id };
}
