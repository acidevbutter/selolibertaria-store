import { requireCapability } from "@/lib/api-auth";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { uploadImageFileToCloudinary } from "@/lib/cloudinary-upload";

const MAX_UPLOAD_SIZE = 8 * 1024 * 1024;
export async function POST(request: Request) {
	const auth = await requireCapability("admin.access");
	if ("error" in auth) return auth.error;

	if (!isCloudinaryConfigured()) {
		return Response.json(
			{
				error:
					"Cloudinary não está configurado. Adicione CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.",
				code: "ADMIN_MEDIA_UPLOAD_CLOUDINARY_NOT_CONFIGURED",
			},
			{ status: 500 },
		);
	}

	const formData = await request.formData();
	const file = formData.get("file");

	if (!(file instanceof File)) {
		return Response.json(
			{ error: "Selecione um arquivo de imagem.", code: "ADMIN_MEDIA_UPLOAD_FILE_REQUIRED" },
			{ status: 400 },
		);
	}

	if (!file.type.startsWith("image/")) {
		return Response.json(
			{ error: "Envie apenas arquivos de imagem.", code: "ADMIN_MEDIA_UPLOAD_INVALID_TYPE" },
			{ status: 400 },
		);
	}

	if (file.size > MAX_UPLOAD_SIZE) {
		return Response.json(
			{ error: "A imagem deve ter no máximo 8 MB.", code: "ADMIN_MEDIA_UPLOAD_FILE_TOO_LARGE" },
			{ status: 400 },
		);
	}
	try {
		const result = await uploadImageFileToCloudinary(file);

		return Response.json({
			url: result.secure_url,
			publicId: result.public_id,
		});
	} catch (error) {
		console.error("[admin media upload]", error);
		return Response.json(
			{
				error:
					error instanceof Error
						? `Não foi possível enviar a imagem: ${error.message}`
						: "Não foi possível enviar a imagem.",
				code: "ADMIN_MEDIA_UPLOAD_FAILED",
			},
			{ status: 500 },
		);
	}
}
