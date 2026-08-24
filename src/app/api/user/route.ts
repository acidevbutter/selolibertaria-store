import { cookies, headers } from "next/headers";
import { env } from "@/env.mjs";

export async function GET() {
	const requestHeaders = await headers();
	const token =
		requestHeaders.get("authorization")?.replace(/^Bearer\s+/i, "") ||
		(await cookies()).get("session")?.value;
	if (!token) return Response.json({ error: "Não autorizado" }, { status: 401 });
	const response = await fetch(`${env.FASTAPI_API_URL}/auth/me`, {
		headers: { authorization: `Bearer ${token}` },
		cache: "no-store",
	});
	if (response.status === 401) return Response.json({ error: "Não autorizado" }, { status: 401 });
	if (!response.ok) return Response.json({ error: "Usuária não encontrada" }, { status: response.status });
	const user = (await response.json()) as { id: string };
	return Response.json({ ...user, _id: user.id });
}
