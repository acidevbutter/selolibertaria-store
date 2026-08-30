import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import { requireCapability } from "@/lib/api-auth";

export async function GET(request: Request) {
	const auth = await requireCapability("customers.read");
	if ("error" in auth) return auth.error;
	const token = (await cookies()).get("session")?.value;
	if (!token) return Response.json({ error: "Não autorizado" }, { status: 401 });
	const source = new URL(request.url);
	const page = Math.max(1, Number(source.searchParams.get("page") || 1));
	const limit = Math.max(1, Math.min(100, Number(source.searchParams.get("limit") || 20)));
	const query = source.searchParams.get("q")?.trim() || "";
	const target = new URL(`${env.FASTAPI_API_URL}/users/`);
	target.searchParams.set("page", String(page));
	target.searchParams.set("page_size", String(limit));
	if (query) target.searchParams.set("q", query);
	const response = await fetch(target, {
		headers: { authorization: `Bearer ${token}` },
		cache: "no-store",
	});
	if (!response.ok) return Response.json({ error: "Usuários indisponíveis" }, { status: response.status });
	const body = (await response.json()) as {
		items: Array<{
			id: string;
			email: string;
			name: string | null;
			role: "admin" | "vendor" | "customer";
			blocked_at: string | null;
			created_at: string;
		}>;
		total: number;
	};
	return Response.json({
		page,
		limit,
		total: body.total,
		items: body.items.map((item) => ({
			...item,
			_id: item.id,
			access: { blockedAt: item.blocked_at },
			createdAt: item.created_at,
		})),
	});
}
