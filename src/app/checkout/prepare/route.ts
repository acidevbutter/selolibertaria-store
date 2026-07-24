import { NextResponse } from "next/server";
import { mergeGuestCartIntoUser } from "@/actions/cart-actions";
import { requireAuth } from "@/lib/api-auth";

/**
 * Prepares checkout in a Route Handler so cookie mutations remain allowed.
 * Logged-in users still merge any guest cart before continuing, while guests
 * now continue straight into checkout without an auth gate.
 */
export async function GET() {
	const auth = await requireAuth();

	if (!("error" in auth)) {
		try {
			await mergeGuestCartIntoUser();
		} catch (error) {
			console.error("[checkout/prepare] failed to merge guest cart", error);
		}
	}

	return new NextResponse(null, {
		status: 307,
		headers: { Location: "/checkout?prepared=1" },
	});
}
