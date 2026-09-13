import { ADMIN_IMAGE_UPLOAD_TOO_LARGE_MESSAGE, assertAdminImageUploadFile } from "@/lib/admin-image-upload";
import { requireCapability } from "@/lib/api-auth";
import { uploadImageFileToFastAPI } from "@/lib/media-upload";

export async function POST(request: Request) {
	const auth = await requireCapability("admin.access");
	if ("error" in auth) return auth.error;

	const formData = await request.formData();
	const file = formData.get("file");

	if (!(file instanceof File)) {
		return Response.json(
			{ error: "Selecione um arquivo de imagem.", code: "ADMIN_MEDIA_UPLOAD_FILE_REQUIRED" },
			{ status: 400 },
		);
	}

	try {
		assertAdminImageUploadFile(file);
	} catch (error) {
		return Response.json(
			{
				error: error instanceof Error ? error.message : "Não foi possível validar a imagem.",
				code:
					error instanceof Error && error.message === ADMIN_IMAGE_UPLOAD_TOO_LARGE_MESSAGE
						? "ADMIN_MEDIA_UPLOAD_FILE_TOO_LARGE"
						: "ADMIN_MEDIA_UPLOAD_INVALID_TYPE",
			},
			{ status: 400 },
		);
	}
	try {
		const result = await uploadImageFileToFastAPI(file, auth.session.sub);

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
