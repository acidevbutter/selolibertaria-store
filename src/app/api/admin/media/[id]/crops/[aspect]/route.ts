import { env } from "@/env.mjs";
import { requireCapability } from "@/lib/api-auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; aspect: string }> }) {
	const auth = await requireCapability("admin.access");
	if ("error" in auth) return auth.error;

	const { id, aspect } = await params;
	const body = await request.json().catch(() => null);
	if (!body) {
		return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
	}

	const response = await fetch(
		`${env.FASTAPI_API_URL}/media/internal/admin/${id}/crops/${encodeURIComponent(aspect)}`,
		{
			method: "PUT",
			headers: { "Content-Type": "application/json", "x-internal-api-key": env.FASTAPI_INTERNAL_API_KEY },
			body: JSON.stringify(body),
			cache: "no-store",
		},
	);
	const payload = await response.json().catch(() => ({}));
	return Response.json(payload, { status: response.status });
}
