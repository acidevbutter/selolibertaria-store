import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/env.mjs";
import { CURRENCY_COOKIE_NAME, CURRENCY_OPTIONS } from "@/lib/currency";

const addressSchema = z.object({
	line1: z.string().optional(),
	line2: z.string().optional(),
	number: z.string().optional(),
	complement: z.string().optional(),
	district: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	postalCode: z.string().optional(),
	country: z.string().optional(),
});

const phoneDetailsSchema = z.object({
	country: z.string().optional(),
	dialCode: z.string().optional(),
	national: z.string().optional(),
	display: z.string().optional(),
});

const registerSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
	name: z.string().min(1),
	phone: z.string().min(6).optional(),
	phoneDetails: phoneDetailsSchema.optional(),
	preferredCurrency: z
		.enum(CURRENCY_OPTIONS.map((option) => option.code) as [string, ...string[]])
		.optional(),
	address: addressSchema.optional(),
	marketing: z
		.object({
			email: z.object({ optIn: z.boolean().optional() }).optional(),
		})
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
				phone_details: data.phoneDetails
					? {
							country: data.phoneDetails.country,
							dial_code: data.phoneDetails.dialCode,
							national: data.phoneDetails.national,
							display: data.phoneDetails.display,
						}
					: undefined,
				preferred_currency: data.preferredCurrency,
				address: data.address
					? {
							line1: data.address.line1,
							line2: data.address.line2,
							number: data.address.number,
							complement: data.address.complement,
							district: data.address.district,
							city: data.address.city,
							state: data.address.state,
							postal_code: data.address.postalCode,
							country: data.address.country,
						}
					: undefined,
				marketing_email_opt_in: data.marketing?.email?.optIn,
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
