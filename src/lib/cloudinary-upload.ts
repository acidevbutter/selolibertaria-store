import { nanoid } from "nanoid";
import { env } from "@/env.mjs";
import { getCloudinaryClient, isCloudinaryConfigured } from "@/lib/cloudinary";

function sanitizeFilename(filename: string) {
	return filename
		.toLowerCase()
		.replace(/[^a-z0-9.-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

export async function uploadImageFileToCloudinary(file: File) {
	if (!isCloudinaryConfigured()) {
		throw new Error(
			"Cloudinary não está configurado. Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.",
		);
	}

	const filename = sanitizeFilename(file.name || "image");
	const folder = env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "products";
	const bytes = Buffer.from(await file.arrayBuffer());
	const client = getCloudinaryClient();

	return await new Promise<{
		secure_url: string;
		public_id: string;
	}>((resolve, reject) => {
		const stream = client.uploader.upload_stream(
			{
				folder,
				public_id: `${nanoid(10)}-${filename}`,
				resource_type: "image",
				overwrite: false,
			},
			(error, uploadResult) => {
				if (error || !uploadResult) {
					reject(error || new Error("Não foi possível enviar a imagem."));
					return;
				}

				resolve({
					secure_url: uploadResult.secure_url,
					public_id: uploadResult.public_id,
				});
			},
		);

		stream.end(bytes);
	});
}
