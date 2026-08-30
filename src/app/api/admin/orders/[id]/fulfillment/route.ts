import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import { requireCapability } from "@/lib/api-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireCapability("orders.update_status");
	if ("error" in auth) return auth.error;
	const token = (await cookies()).get("session")?.value;
	if (!token) return Response.json({ error: "Não autorizado" }, { status: 401 });
	const { id } = await params;
	const body = (await request.json().catch(() => ({}))) as {
		status?: "received" | "producing" | "shipped";
		trackingNumber?: string | null;
	};
	if (!body.status) return Response.json({ error: "Situação de expedição obrigatória." }, { status: 400 });
	const response = await fetch(`${env.FASTAPI_API_URL}/orders/${encodeURIComponent(id)}/fulfillment`, {
		method: "PATCH",
		headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
		body: JSON.stringify({ status: body.status, tracking_number: body.trackingNumber }),
		cache: "no-store",
	});
	if (!response.ok) {
		const error = (await response.json().catch(() => null)) as { detail?: string } | null;
		return Response.json(
			{ error: error?.detail || "Falha ao atualizar expedição" },
			{ status: response.status },
		);
	}
	return Response.json({ ok: true });
}
