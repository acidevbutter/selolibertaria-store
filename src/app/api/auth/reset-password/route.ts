import { z } from "zod";
import { env } from "@/env.mjs";

const schema = z.object({ token: z.string().min(16), password: z.string().min(10) });

export async function POST(request: Request) {
	try {
		const payload = schema.parse(await request.json());
		const response = await fetch(`${env.FASTAPI_API_URL}/auth/password-reset/confirm`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(payload),
			cache: "no-store",
		});
		if (!response.ok) return Response.json({ error: "Token inválido ou expirado" }, { status: 400 });
		return Response.json({ ok: true });
	} catch {
		return Response.json({ error: "Requisição inválida" }, { status: 400 });
	}
}

export async function GET(request: Request) {
	const token = new URL(request.url).searchParams.get("token");
	if (!token) return Response.json({ valid: false, error: "Token ausente" }, { status: 400 });
	try {
		const response = await fetch(`${env.FASTAPI_API_URL}/auth/password-reset/validate`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ token }),
			cache: "no-store",
		});
		if (!response.ok) return Response.json({ valid: false, error: "Token inválido" });
		return Response.json(await response.json());
	} catch {
		return Response.json({ valid: false, error: "Erro no servidor" }, { status: 502 });
	}
}
