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
					"Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
			},
			{ status: 500 },
		);
	}

	const formData = await request.formData();
	const file = formData.get("file");

	if (!(file instanceof File)) {
		return Response.json({ error: "An image file is required." }, { status: 400 });
	}

	if (!file.type.startsWith("image/")) {
		return Response.json({ error: "Only image files can be uploaded." }, { status: 400 });
	}

	if (file.size > MAX_UPLOAD_SIZE) {
		return Response.json({ error: "The image must be 8 MB or smaller." }, { status: 400 });
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
			},
			{ status: 500 },
		);
	}
}
