import { env } from "@/env.mjs";
import { requireAdmin } from "@/lib/api-auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin();
	if ("error" in auth) return auth.error;

	const { id } = await params;
	const response = await fetch(`${env.FASTAPI_API_URL}/communications/${encodeURIComponent(id)}/retry`, {
		method: "POST",
		headers: { "x-internal-api-key": env.FASTAPI_INTERNAL_API_KEY },
		cache: "no-store",
	});
	const payload = await response.text();
	return new Response(payload, {
		status: response.status,
		headers: { "content-type": response.headers.get("content-type") || "application/json" },
	});
}
