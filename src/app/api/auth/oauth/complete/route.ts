import { NextResponse } from "next/server";
import { z } from "zod";
import { env, publicUrl } from "@/env.mjs";
import { findOrCreateOAuthUser } from "@/lib/auth/oauth-users";
import { mergeGuestCartIntoUserCart, resolvePostAuthRedirect } from "@/lib/auth/post-auth";
import { clearOAuthPendingCookie, readOAuthPendingCookie } from "@/lib/oauth/state";
import { createPersistentSession } from "@/lib/session";

const schema = z.object({
	email: z.string().email(),
	name: z.string().min(1).optional(),
});

export async function GET(req: Request) {
	const ticket = new URL(req.url).searchParams.get("ticket");
	if (!ticket) return NextResponse.redirect(new URL("/login?oauth_error=ticket", publicUrl));
	const backend = await fetch(`${env.FASTAPI_API_URL}/auth/oauth/complete`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ ticket }),
		cache: "no-store",
	});
	if (!backend.ok) return NextResponse.redirect(new URL("/login?oauth_error=callback", publicUrl));
	const session = (await backend.json()) as {
		access_token: string;
		expires_at: string;
		user: { role: string; id: string };
	};
	const target = await resolvePostAuthRedirect(session.user.id, session.user.role as never);
	const response = NextResponse.redirect(new URL(target, publicUrl));
	response.cookies.set({
		name: "session",
		value: session.access_token,
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		expires: new Date(session.expires_at),
	});
	return response;
}

export async function POST(req: Request) {
	const pending = await readOAuthPendingCookie();
	if (!pending || pending.kind !== "pending") {
		return NextResponse.json(
			{ error: "Nenhum cadastro OAuth pendente foi encontrado.", code: "OAUTH_PENDING_NOT_FOUND" },
			{ status: 400 },
		);
	}
	try {
		const body = schema.parse(await req.json());
		const user = await findOrCreateOAuthUser({
			provider: pending.provider,
			providerAccountId: pending.providerAccountId,
			email: body.email,
			name: body.name ?? pending.displayName,
			avatarUrl: pending.avatarUrl,
			verified: true,
		});
		await clearOAuthPendingCookie();
		await mergeGuestCartIntoUserCart(user.id);
		const target = await resolvePostAuthRedirect(user.id, user.role);
		const session = await createPersistentSession(user);
		const response = NextResponse.json({ ok: true, redirectTo: target });
		response.cookies.set({
			name: "session",
			value: session.jwt,
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			expires: new Date(session.expires),
		});
		return response;
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: error.flatten(), code: "OAUTH_COMPLETE_INVALID_REQUEST" },
				{ status: 400 },
			);
		}
		if (error instanceof Error && error.message.includes("blocked")) {
			return NextResponse.json(
				{ error: error.message, code: "OAUTH_COMPLETE_ACCOUNT_BLOCKED" },
				{ status: 403 },
			);
		}
		console.error("[oauth complete]", error);
		return NextResponse.json(
			{ error: "Não foi possível concluir o cadastro com OAuth.", code: "OAUTH_COMPLETE_FAILED" },
			{ status: 500 },
		);
	}
}
