import { z } from "zod";
import { env } from "@/env.mjs";

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });

export async function POST(req: Request) {
	try {
		const response = await fetch(`${env.FASTAPI_API_URL}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(schema.parse(await req.json())),
			cache: "no-store",
		});
		const body = (await response.json().catch(() => null)) as {
			access_token?: string;
			user?: { id: string; email: string; name?: string | null; role: string };
			detail?: string;
		} | null;
		if (!response.ok || !body?.access_token || !body.user) {
			return Response.json({ error: body?.detail || "Credenciais inválidas" }, { status: response.status });
		}
		return Response.json({
			token: body.access_token,
			user: { _id: body.user.id, email: body.user.email, name: body.user.name, role: body.user.role },
		});
	} catch {
		return Response.json({ error: "Não foi possível concluir a entrada." }, { status: 400 });
	}
}
