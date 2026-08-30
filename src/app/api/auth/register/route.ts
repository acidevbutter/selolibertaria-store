import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/env.mjs";
import { CURRENCY_COOKIE_NAME, CURRENCY_OPTIONS } from "@/lib/currency";

const registerSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
	name: z.string().min(1),
	phone: z.string().min(6).optional(),
	preferredCurrency: z
		.enum(CURRENCY_OPTIONS.map((option) => option.code) as [string, ...string[]])
		.optional(),
});

export async function POST(request: Request) {
	try {
		const data = registerSchema.parse(await request.json());
		const response = await fetch(`${env.FASTAPI_API_URL}/auth/register`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				email: data.email.toLowerCase(),
				password: data.password,
				name: data.name,
				phone: data.phone,
				preferred_currency: data.preferredCurrency,
			}),
			cache: "no-store",
		});
		if (response.status === 409) {
			return NextResponse.json(
				{ error: "E-mail já cadastrado", code: "REGISTER_EMAIL_TAKEN" },
				{ status: 409 },
			);
		}
		if (!response.ok) throw new Error("FastAPI auth unavailable");

		const result = NextResponse.json({ pending: true, email: data.email.toLowerCase() }, { status: 201 });
		if (data.preferredCurrency) {
			result.cookies.set(CURRENCY_COOKIE_NAME, data.preferredCurrency, {
				path: "/",
				maxAge: 60 * 60 * 24 * 365,
				sameSite: "lax",
			});
		}
		return result;
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.flatten(), code: "REGISTER_INVALID_REQUEST" }, { status: 400 });
		}
		return NextResponse.json(
			{ error: "Não foi possível concluir o cadastro.", code: "REGISTER_FAILED" },
			{ status: 502 },
		);
	}
}
