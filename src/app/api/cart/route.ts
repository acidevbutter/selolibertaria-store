import { NextResponse } from "next/server";
import { getCartAction } from "@/actions/cart-actions";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
	"Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
};

export async function GET() {
	try {
		const cart = await getCartAction();
		return NextResponse.json({ cart }, { headers: NO_STORE_HEADERS });
	} catch (error) {
		console.error("GET /api/cart error", error);
		return NextResponse.json(
			{ error: "Failed to load cart", code: "CART_LOAD_FAILED" },
			{ status: 500, headers: NO_STORE_HEADERS },
		);
	}
}
