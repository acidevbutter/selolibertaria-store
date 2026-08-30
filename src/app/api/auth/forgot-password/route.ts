import { env } from "@/env.mjs";

export async function POST(request: Request) {
	const body = (await request.json().catch(() => ({}))) as { email?: string };
	const email = String(body.email || "")
		.trim()
		.toLowerCase();
	if (!email) return Response.json({ ok: true });
	await fetch(`${env.FASTAPI_API_URL}/auth/password-reset`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ email }),
		cache: "no-store",
	}).catch(() => null);
	return Response.json({ ok: true });
}
