import { NextResponse } from "next/server";
import { z } from "zod";
import { findOrCreateOAuthUser } from "@/lib/auth/oauth-users";
import { mergeGuestCartIntoUserCart, resolvePostAuthRedirect } from "@/lib/auth/post-auth";
import { clearOAuthPendingCookie, readOAuthPendingCookie } from "@/lib/oauth/state";
import { createPersistentSession } from "@/lib/session";

const schema = z.object({
	email: z.string().email(),
	name: z.string().min(1).optional(),
});

export async function POST(req: Request) {
	const pending = await readOAuthPendingCookie();
	if (!pending || pending.kind !== "pending") {
		return NextResponse.json({ error: "No pending OAuth signup found." }, { status: 400 });
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
		const target = await resolvePostAuthRedirect(user.id);
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
			return NextResponse.json({ error: error.flatten() }, { status: 400 });
		}
		if (error instanceof Error && error.message.includes("blocked")) {
			return NextResponse.json({ error: error.message }, { status: 403 });
		}
		console.error("[oauth complete]", error);
		return NextResponse.json({ error: "Could not complete OAuth signup." }, { status: 500 });
	}
}
