import { NextResponse } from "next/server";
import { z } from "zod";
import { getCartCookieItems } from "@/lib/cart-cookies";
import { CURRENCY_COOKIE_NAME, resolveSupportedCurrency } from "@/lib/currency";
import { getDb } from "@/lib/mongodb";
import { createPersistentSession } from "@/lib/session";

const schema = z.object({ token: z.string().min(16) });

export async function GET(req: Request) {
	try {
		console.log("passou aqui");
		const url = new URL(req.url);
		const token = url.searchParams.get("token") || "";
		const { token: t } = schema.parse({ token });
		const db = await getDb();
		const now = new Date();
		// First find the user matching the token without updating yet. We'll create the session
		// and then set `verified: true` and unset the verification token at the end of
		// the authentication flow per the requested change.
		const found = await db
			.collection("users")
			.findOne(
				{ "verification.token": t, "verification.expiresAt": { $gt: now } },
				{ projection: { _id: 1, email: 1, preferredCurrency: 1 } },
			);
		if (!found || !found.email) {
			return new Response("Invalid or expired token", { status: 400 });
		}
		const userId =
			typeof (found._id as { toString?: () => string }).toString === "function"
				? (found._id as { toString: () => string }).toString()
				: String(found._id);

		// Decide where to redirect: if there's a guest cookie cart, go to checkout.
		// Otherwise check the user's stored cart in the DB. Default to home.
		let target = "/";
		try {
			const cookieItems = await getCartCookieItems();
			if (cookieItems && cookieItems.length > 0) {
				target = "/checkout";
			} else {
				const stored = await db
					.collection("users")
					.findOne<{ cart?: { items: { productId: string; variantId: string; quantity: number }[] } }>(
						{ _id: found._id },
						{ projection: { cart: 1 } },
					);
				const minimal = stored?.cart?.items || [];
				if (minimal.length > 0) target = "/checkout";
			}
		} catch (e) {
			// On error deciding cart, default to home
			target = "/";
		}

		const session = await createPersistentSession({
			id: userId,
			email: found.email,
			name: undefined,
			role: "customer",
		});

		// After the session is created, mark the user as verified and remove the verification token
		// so it can't be reused.
		await db
			.collection("users")
			.updateOne({ _id: found._id }, { $set: { verified: true }, $unset: { verification: "" } });
		// Ensure the session cookie is attached to the redirect response so the browser is authenticated
		const redirectRes = NextResponse.redirect(new URL(target, req.url));
		redirectRes.cookies.set({
			name: "session",
			value: session.jwt,
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			expires: new Date(session.expires),
		});
		const preferredCurrency = resolveSupportedCurrency(
			(found as { preferredCurrency?: string | null }).preferredCurrency,
		);
		if (preferredCurrency) {
			redirectRes.cookies.set(CURRENCY_COOKIE_NAME, preferredCurrency, {
				path: "/",
				maxAge: 60 * 60 * 24 * 365,
				sameSite: "lax",
			});
		}
		return redirectRes;
	} catch (err: unknown) {
		const isProd = process.env.NODE_ENV === "production";
		const message = err instanceof Error ? err.message : String(err);
		const body: Record<string, unknown> = { error: message };
		if (isProd && err instanceof Error && err.stack) body.stack = err.stack;
		return new Response(JSON.stringify(body), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}
}
