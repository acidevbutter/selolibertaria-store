import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { publicUrl } from "@/env.mjs";
import { requireAuth } from "@/lib/api-auth";

const REDIRECT_PARAM = "checkout";

export async function GET(req: NextRequest) {
	const orderId = req.nextUrl.searchParams.get("order");
	const paymentId = req.nextUrl.searchParams.get("mp_payment") || req.nextUrl.searchParams.get("payment_id");
	const cancel = req.nextUrl.searchParams.get("cancel");
	const redirectBase = publicUrl.replace(/\/$/, "");

	if (cancel) {
		return NextResponse.redirect(buildRedirectUrl(redirectBase, { [REDIRECT_PARAM]: "cancel" }));
	}

	if (!orderId?.startsWith("ord_")) {
		return NextResponse.redirect(buildRedirectUrl(redirectBase, { [REDIRECT_PARAM]: "missing_order" }));
	}

	if (paymentId && !/^[0-9A-Za-z_-]+$/.test(paymentId)) {
		return NextResponse.redirect(buildRedirectUrl(redirectBase, { [REDIRECT_PARAM]: "invalid_payment" }));
	}

	const auth = await requireAuth();
	const processingUrl = new URL("/checkout/processing", redirectBase);
	processingUrl.searchParams.set("order", orderId);
	if (paymentId) processingUrl.searchParams.set("mp_payment", paymentId);
	processingUrl.searchParams.set("guest", "error" in auth ? "1" : "0");
	return NextResponse.redirect(processingUrl);
}

function buildRedirectUrl(base: string, params: Record<string, string | undefined>) {
	const searchParams = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value) searchParams.set(key, value);
	}
	const qs = searchParams.toString();
	return `${base}/${qs ? `?${qs}` : ""}`;
}
