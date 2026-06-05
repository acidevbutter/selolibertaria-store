import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { CURRENCY_COOKIE_NAME, CURRENCY_OPTIONS } from "@/lib/currency";
import { getDb } from "@/lib/mongodb";

const updateUserSchema = z.object({
	name: z.string().min(1).optional(),
	email: z.string().email().optional(),
	phone: z.string().min(5).optional(),
	preferredCurrency: z
		.enum(CURRENCY_OPTIONS.map((option) => option.code) as [string, ...string[]])
		.optional(),
	phoneDetails: z
		.object({
			country: z.string().min(2).max(2).optional(),
			dialCode: z.string().min(2).optional(),
			national: z.string().min(3).optional(),
			display: z.string().min(3).optional(),
		})
		.optional(),
	password: z.string().min(6).optional(),
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
			country: z
				.string()
				.min(2)
				.max(64)
				.transform((v) => v.trim().toUpperCase())
				.optional(),
		})
		.optional(),
	marketing: z
		.object({
			email: z
				.object({
					optIn: z.boolean().optional(),
				})
				.optional(),
		})
		.optional(),
});

function isValidObjectId(id: string | undefined | null): id is string {
	return !!id && /^[0-9a-fA-F]{24}$/.test(id);
}

function parseObjectId(idRaw: string | undefined) {
	if (!isValidObjectId(idRaw))
		return { error: new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400 }) };
	try {
		return { value: new ObjectId(idRaw) };
	} catch {
		return { error: new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400 }) };
	}
}

type RouteParams = { id?: string | string[] };
type RouteContext = { params: Promise<RouteParams> };

async function resolveParams(ctx: RouteContext): Promise<RouteParams> {
	try {
		const params = await ctx.params;
		return params ?? {};
	} catch {
		return {};
	}
}

function extractId(value: RouteParams["id"]): string | undefined {
	if (typeof value === "string") return value;
	if (Array.isArray(value)) return value[0];
	return undefined;
}

async function resolveId(ctx: RouteContext): Promise<string | undefined> {
	const { id } = await resolveParams(ctx);
	return extractId(id);
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
	const idRaw = await resolveId(ctx);
	const parsed = parseObjectId(idRaw);
	if ("error" in parsed) return parsed.error;
	const db = await getDb();
	const user = await db
		.collection("users")
		.findOne<{ _id: ObjectId; email: string; name?: string; createdAt: Date; updatedAt: Date }>(
			{ _id: parsed.value },
			{ projection: { passwordHash: 0 } },
		);
	if (!user) {
		const res = new Response(JSON.stringify({ error: "Not found", code: "USER_NOT_FOUND", id: idRaw }), {
			status: 404,
		});
		res.headers.set("x-route-hit", "users/[id]/GET");
		return res;
	}
	const json = Response.json({ ...user, _id: user._id.toString() });
	json.headers.set("x-route-hit", "users/[id]/GET");
	return json;
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
	const auth = await requireAuth();
	if ("error" in auth) return auth.error;
	const idRaw = await resolveId(ctx);
	const parsed = parseObjectId(idRaw);
	if ("error" in parsed) return parsed.error;
	try {
		const body = await req.json();
		const data = updateUserSchema.parse(body);
		const db = await getDb();
		// Pre-check: user exists and fetch verification state
		const existingUser = await db
			.collection("users")
			.findOne<{ _id: ObjectId; verified?: boolean }>(
				{ _id: parsed.value },
				{ projection: { _id: 1, verified: 1 } },
			);
		if (!existingUser) {
			const res = new Response(
				JSON.stringify({ error: "Usuária não encontrada", code: "USER_NOT_FOUND_BEFORE_UPDATE", id: idRaw }),
				{ status: 404 },
			);
			res.headers.set("x-route-hit", "users/[id]/PUT");
			return res;
		}
		// If the user exists but is not verified, block profile updates
		if (existingUser && existingUser.verified === false) {
			const res = new Response(
				JSON.stringify({
					error: "E-mail não verificado. Não é possível editar o perfil antes da confirmação.",
				}),
				{
					status: 403,
				},
			);
			res.headers.set("x-route-hit", "users/[id]/PUT");
			return res;
		}
		const now = new Date();
		const update: Record<string, unknown> = { updatedAt: now };
		if (data.name) update.name = data.name;
		if (data.phone) update.phone = data.phone;
		if (data.preferredCurrency) update.preferredCurrency = data.preferredCurrency;
		if (data.phoneDetails) update.phoneDetails = data.phoneDetails;
		if (data.address) update.address = data.address;
		if (data.marketing?.email) {
			update.marketing = {
				email: {
					optIn: Boolean(data.marketing.email.optIn),
					optInAt: data.marketing.email.optIn ? now : null,
					optInSource: data.marketing.email.optIn ? "profile_editor" : null,
					unsubscribedAt: data.marketing.email.optIn ? null : now,
					lastPreferenceChangeAt: now,
				},
			};
		}
		if (data.email) {
			const emailLower = data.email.toLowerCase();
			// Check if email already exists in another user
			const existing = await db
				.collection("users")
				.findOne({ email: emailLower, _id: { $ne: parsed.value } });
			if (existing) {
				return new Response(JSON.stringify({ error: "E-mail já está em uso" }), { status: 409 });
			}
			update.email = emailLower;
		}
		if (data.password) update.passwordHash = await bcrypt.hash(data.password, 10);
		const result = await db
			.collection("users")
			.findOneAndUpdate(
				{ _id: parsed.value },
				{ $set: update },
				{ returnDocument: "after", projection: { passwordHash: 0 } },
			);
		interface UpdatedUserDoc {
			_id: ObjectId;
			email: string;
			name?: string;
			phone?: string;
			address?: Record<string, unknown>;
			createdAt?: Date;
			updatedAt?: Date;
		}
		let updated = result?.value as UpdatedUserDoc | null;
		// Fallback: if driver didn't return value (rare or no-op) fetch manually
		if (!updated) {
			updated = await db
				.collection<UpdatedUserDoc>("users")
				.findOne({ _id: parsed.value }, { projection: { passwordHash: 0 } });
		}
		if (!updated) {
			const res = new Response(
				JSON.stringify({ error: "Usuária não encontrada", code: "NOT_FOUND_AFTER_UPDATE_FALLBACK" }),
				{ status: 404 },
			);
			res.headers.set("x-route-hit", "users/[id]/PUT");
			return res;
		}
		const json = NextResponse.json({ ...updated, _id: updated._id.toString() });
		if (data.preferredCurrency) {
			json.cookies.set(CURRENCY_COOKIE_NAME, data.preferredCurrency, {
				path: "/",
				maxAge: 60 * 60 * 24 * 365,
				sameSite: "lax",
			});
		}
		json.headers.set("x-route-hit", "users/[id]/PUT");
		return json;
	} catch (err) {
		if (err instanceof z.ZodError) {
			return new Response(JSON.stringify({ error: err.flatten() }), { status: 400 });
		}
		console.error("[PUT /api/users/:id]", err);
		return new Response(JSON.stringify({ error: "Falha ao atualizar" }), { status: 500 });
	}
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
	const auth = await requireAuth();
	if ("error" in auth) return auth.error;
	const idRaw = await resolveId(ctx);
	const parsed = parseObjectId(idRaw);
	if ("error" in parsed) return parsed.error;
	const db = await getDb();
	const res = await db.collection("users").deleteOne({ _id: parsed.value });
	if (!res.deletedCount)
		return new Response(JSON.stringify({ error: "Usuária não encontrada" }), { status: 404 });
	return new Response(null, { status: 204 });
}
