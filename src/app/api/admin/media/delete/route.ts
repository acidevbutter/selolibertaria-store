import { requireCapability } from "@/lib/api-auth";
import { getCloudinaryClient, isCloudinaryConfigured } from "@/lib/cloudinary";

function extractCloudinaryPublicId(imageUrl: string) {
	try {
		const parsed = new URL(imageUrl);
		if (!parsed.hostname.includes("res.cloudinary.com")) {
			return null;
		}

		const uploadIndex = parsed.pathname.indexOf("/upload/");
		if (uploadIndex === -1) {
			return null;
		}

		const remainder = parsed.pathname.slice(uploadIndex + "/upload/".length);
		const withoutVersion = remainder.replace(/^v\d+\//, "");
		const lastDotIndex = withoutVersion.lastIndexOf(".");
		return lastDotIndex > 0 ? withoutVersion.slice(0, lastDotIndex) : withoutVersion;
	} catch {
		return null;
	}
}

export async function POST(request: Request) {
	const auth = await requireCapability("admin.access");
	if ("error" in auth) return auth.error;

	if (!isCloudinaryConfigured()) {
		return Response.json(
			{
				error:
					"Cloudinary não está configurado. Adicione CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.",
				code: "ADMIN_MEDIA_DELETE_CLOUDINARY_NOT_CONFIGURED",
			},
			{ status: 500 },
		);
	}

	const body = (await request.json().catch(() => null)) as { url?: string } | null;
	const imageUrl = typeof body?.url === "string" ? body.url.trim() : "";
	if (!imageUrl) {
		return Response.json(
			{ error: "Informe uma URL de imagem válida.", code: "ADMIN_MEDIA_DELETE_URL_REQUIRED" },
			{ status: 400 },
		);
	}

	const publicId = extractCloudinaryPublicId(imageUrl);
	if (!publicId) {
		return Response.json(
			{
				error: "Não foi possível identificar a imagem da Cloudinary para exclusão.",
				code: "ADMIN_MEDIA_DELETE_PUBLIC_ID_NOT_FOUND",
			},
			{ status: 400 },
		);
	}

	try {
		const client = getCloudinaryClient();
		const result = await client.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
		if (result.result !== "ok" && result.result !== "not found") {
			return Response.json(
				{
					error: "A Cloudinary não conseguiu excluir a imagem solicitada.",
					code: "ADMIN_MEDIA_DELETE_FAILED",
				},
				{ status: 500 },
			);
		}

		return Response.json({ ok: true, publicId, result: result.result });
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
