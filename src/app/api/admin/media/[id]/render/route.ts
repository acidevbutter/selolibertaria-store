import { env } from "@/env.mjs";
import { requireCapability } from "@/lib/api-auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireCapability("admin.access");
	if ("error" in auth) return auth.error;

	const { id } = await params;
	const { searchParams } = new URL(request.url);
	const query = new URLSearchParams({
		aspect: searchParams.get("aspect") || "free",
		width: searchParams.get("width") || "900",
		format: searchParams.get("format") || "webp",
	});

	const response = await fetch(`${env.FASTAPI_API_URL}/media/internal/render/${id}?${query}`, {
		headers: { "x-internal-api-key": env.FASTAPI_INTERNAL_API_KEY },
		cache: "no-store",
	});

	if (!response.ok) {
		const payload = (await response.json().catch(() => ({}))) as { detail?: string };
		return Response.json(
			{ error: payload.detail || "Não foi possível gerar a prévia." },
			{ status: response.status },
		);
	}

	const body = await response.arrayBuffer();
	return new Response(body, {
		headers: {
			"Content-Type": response.headers.get("content-type") || "image/webp",
			"Cache-Control": response.headers.get("cache-control") || "public, max-age=3600",
		},
	});
}
