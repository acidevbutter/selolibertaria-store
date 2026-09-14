import { env } from "@/env.mjs";
import { requireCapability } from "@/lib/api-auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireCapability("admin.access");
	if ("error" in auth) return auth.error;

	const { id } = await params;
	const response = await fetch(`${env.FASTAPI_API_URL}/media/internal/admin/${id}/crops`, {
		headers: { "x-internal-api-key": env.FASTAPI_INTERNAL_API_KEY },
		cache: "no-store",
	});
	const payload = await response.json().catch(() => ({}));
	return Response.json(payload, { status: response.status });
}
