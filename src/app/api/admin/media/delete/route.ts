import { env } from "@/env.mjs";
import { requireCapability } from "@/lib/api-auth";

export async function POST(request: Request) {
	const auth = await requireCapability("admin.access");
	if ("error" in auth) return auth.error;

	const body = (await request.json().catch(() => null)) as { url?: string } | null;
	const imageUrl = typeof body?.url === "string" ? body.url.trim() : "";
	if (!imageUrl) {
		return Response.json(
			{ error: "Informe uma URL de imagem válida.", code: "ADMIN_MEDIA_DELETE_URL_REQUIRED" },
			{ status: 400 },
		);
	}

	try {
		const response = await fetch(`${env.FASTAPI_API_URL}/media/internal/admin/delete`, {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Internal-API-Key": env.FASTAPI_INTERNAL_API_KEY },
			body: JSON.stringify({ url: imageUrl }),
			cache: "no-store",
		});
		const payload = await response.json().catch(() => ({}));
		return Response.json(payload, { status: response.status });
	} catch (error) {
		console.error("[admin media delete]", error);
		return Response.json(
			{
				error:
					error instanceof Error
						? `Não foi possível excluir a imagem: ${error.message}`
						: "Não foi possível excluir a imagem.",
				code: "ADMIN_MEDIA_DELETE_UNEXPECTED",
			},
			{ status: 500 },
		);
	}
}
