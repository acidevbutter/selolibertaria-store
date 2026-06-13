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
					"Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
			},
			{ status: 500 },
		);
	}

	const body = (await request.json().catch(() => null)) as { url?: string } | null;
	const imageUrl = typeof body?.url === "string" ? body.url.trim() : "";
	if (!imageUrl) {
		return Response.json({ error: "A valid image URL is required." }, { status: 400 });
	}

	const publicId = extractCloudinaryPublicId(imageUrl);
	if (!publicId) {
		return Response.json({ error: "Could not resolve the Cloudinary asset to delete." }, { status: 400 });
	}

	try {
		const client = getCloudinaryClient();
		const result = await client.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
		if (result.result !== "ok" && result.result !== "not found") {
			return Response.json({ error: "Cloudinary could not delete the requested image." }, { status: 500 });
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
			},
			{ status: 500 },
		);
	}
}
