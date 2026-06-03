import { NextResponse } from "next/server";
import { mergeGuestCartIntoUser } from "@/actions/cart-actions";
import { requireAuth } from "@/lib/api-auth";

/**
 * Prepares checkout by merging any guest cart in a Route Handler, where cookie
 * mutations are allowed by Next.js.
 */
export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const auth = await requireAuth();

	if ("error" in auth) {
		return NextResponse.redirect(new URL("/login?next=checkout", requestUrl));
	}

	try {
		await mergeGuestCartIntoUser();
	} catch (error) {
		console.error("[checkout/prepare] failed to merge guest cart", error);
	}

	return NextResponse.redirect(new URL("/checkout?prepared=1", requestUrl));
}
