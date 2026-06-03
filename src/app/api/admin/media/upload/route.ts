import { nanoid } from "nanoid";
import { env } from "@/env.mjs";
import { requireAdmin } from "@/lib/api-auth";
import { getCloudinaryClient, isCloudinaryConfigured } from "@/lib/cloudinary";

const MAX_UPLOAD_SIZE = 8 * 1024 * 1024;

function sanitizeFilename(filename: string) {
	return filename
		.toLowerCase()
		.replace(/[^a-z0-9.-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
	const auth = await requireAdmin();
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

	const filename = sanitizeFilename(file.name || "image");
	const folder = env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "products";
	const bytes = Buffer.from(await file.arrayBuffer());
	const client = getCloudinaryClient();

	const result = await new Promise<{
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
					reject(error || new Error("Could not upload the image."));
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

	return Response.json({
		url: result.secure_url,
		publicId: result.public_id,
	});
}
