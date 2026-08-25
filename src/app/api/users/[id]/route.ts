import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/env.mjs";
import { requireAuth } from "@/lib/api-auth";
import { CURRENCY_COOKIE_NAME, CURRENCY_OPTIONS } from "@/lib/currency";

const updateUserSchema = z.object({
	name: z.string().min(1).optional(),
	email: z.string().email().optional(),
	phone: z.string().min(5).optional(),
	preferredCurrency: z
		.enum(CURRENCY_OPTIONS.map((option) => option.code) as [string, ...string[]])
		.optional(),
	phoneDetails: z
		.object({
			country: z.string().optional(),
			dialCode: z.string().optional(),
			national: z.string().optional(),
			display: z.string().optional(),
		})
		.optional(),
	address: z
		.object({
			line1: z.string().optional(),
			line2: z.string().optional(),
			number: z.string().optional(),
			complement: z.string().optional(),
			district: z.string().optional(),
			city: z.string().optional(),
			state: z.string().optional(),
			postalCode: z.string().optional(),
		})
		.optional(),
	marketing: z.object({ email: z.object({ optIn: z.boolean().optional() }).optional() }).optional(),
});

type RouteContext = { params: Promise<{ id?: string | string[] }> };

async function resolveUserId(ctx: RouteContext) {
	const value = (await ctx.params).id;
	const id = Array.isArray(value) ? value[0] : value;
	return id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}

function toLegacy(user: Record<string, unknown>) {
	return {
		_id: user.id,
		name: user.name,
		email: user.email,
		phone: user.phone,
		cpf: user.cpf,
		verified: user.verified,
		preferredCurrency: user.preferred_currency,
		phoneDetails: {
			country: user.phone_country,
			dialCode: user.phone_dial_code,
			national: user.phone_national,
			display: user.phone_display,
		},
		address: {
			line1: user.address_line1,
			line2: user.address_line2,
			number: user.address_number,
			complement: user.address_complement,
			district: user.address_district,
			city: user.address_city,
			state: user.address_state,
			postalCode: user.address_postal_code,
			country: user.address_country,
		},
		marketing: { email: { optIn: user.marketing_email_opt_in } },
	};
}

async function fastApiUserRequest(id: string, init?: RequestInit) {
	const token = (await cookies()).get("session")?.value;
	if (!token) return null;
	return fetch(`${env.FASTAPI_API_URL}/users/${encodeURIComponent(id)}`, {
		...init,
		headers: { authorization: `Bearer ${token}`, ...(init?.headers || {}) },
		cache: "no-store",
	});
}

export async function GET(_request: NextRequest, ctx: RouteContext) {
	const auth = await requireAuth();
	if ("error" in auth) return auth.error;
	const id = await resolveUserId(ctx);
	if (!id) return Response.json({ error: "ID inválido" }, { status: 400 });
	const response = await fastApiUserRequest(id);
	if (!response) return Response.json({ error: "Não autorizado" }, { status: 401 });
	if (!response.ok) return Response.json({ error: "Usuária não encontrada" }, { status: response.status });
	return Response.json(toLegacy((await response.json()) as Record<string, unknown>));
}

export async function PUT(request: NextRequest, ctx: RouteContext) {
	const auth = await requireAuth();
	if ("error" in auth) return auth.error;
	const id = await resolveUserId(ctx);
	if (!id) return Response.json({ error: "ID inválido" }, { status: 400 });
	try {
		const data = updateUserSchema.parse(await request.json());
		const response = await fastApiUserRequest(id, {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				name: data.name,
				email: data.email,
				phone: data.phone,
				preferred_currency: data.preferredCurrency,
				phone_country: data.phoneDetails?.country,
				phone_dial_code: data.phoneDetails?.dialCode,
				phone_national: data.phoneDetails?.national,
				phone_display: data.phoneDetails?.display,
				address_line1: data.address?.line1,
				address_line2: data.address?.line2,
				address_number: data.address?.number,
				address_complement: data.address?.complement,
				address_district: data.address?.district,
				address_city: data.address?.city,
				address_state: data.address?.state,
				address_postal_code: data.address?.postalCode,
				address_country: data.address ? "BR" : undefined,
				marketing_email_opt_in: data.marketing?.email?.optIn,
			}),
		});
		if (!response) return Response.json({ error: "Não autorizado" }, { status: 401 });
		if (!response.ok)
			return Response.json({ error: "Não foi possível atualizar o perfil." }, { status: response.status });
		const output = NextResponse.json(toLegacy((await response.json()) as Record<string, unknown>));
		if (data.preferredCurrency)
			output.cookies.set(CURRENCY_COOKIE_NAME, data.preferredCurrency, {
				path: "/",
				maxAge: 31536000,
				sameSite: "lax",
			});
		return output;
	} catch (error) {
		if (error instanceof z.ZodError) return Response.json({ error: error.flatten() }, { status: 400 });
		return Response.json({ error: "Não foi possível atualizar o perfil." }, { status: 500 });
	}
}
