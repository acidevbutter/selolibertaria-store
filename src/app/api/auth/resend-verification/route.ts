import { cookies } from "next/headers";
import { env } from "@/env.mjs";

export async function POST() {
	const token = (await cookies()).get("session")?.value;
	if (!token) return Response.json({ error: "Não autorizado" }, { status: 401 });
	const response = await fetch(`${env.FASTAPI_API_URL}/auth/verification/resend`, {
		method: "POST",
		headers: { authorization: `Bearer ${token}` },
		cache: "no-store",
	});
	if (!response.ok) return Response.json({ error: "Falha ao enviar o e-mail" }, { status: response.status });
	return Response.json({ ok: true });
}
