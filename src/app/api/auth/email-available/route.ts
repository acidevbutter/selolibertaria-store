import { z } from "zod";
import { env } from "@/env.mjs";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
	try {
		const body = (await req.json()) as unknown;
		const { email } = schema.parse(body);
		const response = await fetch(`${env.FASTAPI_API_URL}/auth/email-available`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: email.toLowerCase() }),
			cache: "no-store",
		});
		if (!response.ok) throw new Error("FastAPI auth unavailable");
		return new Response(JSON.stringify(await response.json()), { status: 200 });
	} catch {
		return new Response(
			JSON.stringify({ error: "Invalid request", code: "EMAIL_AVAILABILITY_INVALID_REQUEST" }),
			{
				status: 400,
			},
		);
	}
}
