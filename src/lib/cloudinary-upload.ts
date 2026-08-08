import { nanoid } from "nanoid";
import { env } from "@/env.mjs";
import { getCloudinaryClient, isCloudinaryConfigured } from "@/lib/cloudinary";

const CLOUDINARY_UPLOAD_TIMEOUT_MS = 45_000;

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
		let settled = false;
		let timeout: ReturnType<typeof setTimeout> | undefined;
		const settle = (callback: () => void) => {
			if (settled) return;
			settled = true;
			if (timeout) clearTimeout(timeout);
			callback();
		};
		const stream = client.uploader.upload_stream(
			{
				folder,
				public_id: `${nanoid(10)}-${filename}`,
				resource_type: "image",
				overwrite: false,
			},
			(error, uploadResult) => {
				if (error || !uploadResult) {
					settle(() => reject(error || new Error("Não foi possível enviar a imagem.")));
					return;
				}

				settle(() =>
					resolve({
						secure_url: uploadResult.secure_url,
						public_id: uploadResult.public_id,
					}),
				);
			},
		);
		timeout = setTimeout(() => {
			const error = new Error("O envio da imagem demorou demais. Verifique a conexão e tente novamente.");
			stream.destroy(error);
			settle(() => reject(error));
		}, CLOUDINARY_UPLOAD_TIMEOUT_MS);

		stream.end(bytes);
	});
}
