import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env, publicUrl } from "@/env.mjs";
import { requireAuth } from "@/lib/api-auth";
import { getDb } from "@/lib/mongodb";

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: undefined }) : null;

type CheckoutStatus =
	| "success"
	| "processing"
	| "requires_payment_method"
	| "open"
	| "expired"
	| "failed"
	| "cancel"
	| "unknown";

const REDIRECT_PARAM = "checkout";

export async function GET(req: NextRequest) {
	const orderId = req.nextUrl.searchParams.get("order");
	const paymentIntentId =
		req.nextUrl.searchParams.get("payment_intent") || req.nextUrl.searchParams.get("intent");
	const sessionId = req.nextUrl.searchParams.get("session_id");
	const cancel = req.nextUrl.searchParams.get("cancel");
	const redirectBase = publicUrl.replace(/\/$/, "");

	if (cancel) {
		return NextResponse.redirect(
			buildRedirectUrl(redirectBase, {
				[REDIRECT_PARAM]: "cancel",
			}),
		);
	}

	if (orderId || paymentIntentId) {
		if (orderId && !orderId.startsWith("ord_")) {
			return NextResponse.redirect(buildRedirectUrl(redirectBase, { [REDIRECT_PARAM]: "error" }));
		}
		if (paymentIntentId && !paymentIntentId.startsWith("pi_")) {
			return NextResponse.redirect(
				buildRedirectUrl(redirectBase, {
					[REDIRECT_PARAM]: "invalid_payment_intent",
				}),
			);
		}
		if (!stripe) {
			return NextResponse.redirect(
				buildRedirectUrl(redirectBase, {
					[REDIRECT_PARAM]: "stripe_not_configured",
				}),
			);
		}

		try {
			const resolvedPaymentIntentId =
				paymentIntentId ||
				(orderId
					? (
							await (
								await getDb()
							)
								.collection<{ paymentIntentId?: string }>("orderDrafts")
								.findOne({ orderId }, { projection: { paymentIntentId: 1 } })
						)?.paymentIntentId || null
					: null);
			const paymentIntent = resolvedPaymentIntentId
				? await stripe.paymentIntents.retrieve(resolvedPaymentIntentId)
				: null;
			const status = derivePaymentIntentCheckoutStatus(paymentIntent?.status);

			if (status === "success" || status === "processing") {
				const auth = await requireAuth();
				const guest = "error" in auth ? "1" : "0";
				const processingUrl = new URL("/checkout/processing", redirectBase);
				if (orderId) processingUrl.searchParams.set("order", orderId);
				if (paymentIntent?.id) processingUrl.searchParams.set("payment_intent", paymentIntent.id);
				processingUrl.searchParams.set("guest", guest);
				return NextResponse.redirect(processingUrl);
			}

			return NextResponse.redirect(
				buildRedirectUrl(redirectBase, {
					[REDIRECT_PARAM]: status,
					order: orderId ?? paymentIntent?.metadata?.orderId ?? undefined,
					payment_intent: paymentIntent?.id,
				}),
			);
		} catch (error) {
			console.error("[checkout/return] Failed to retrieve payment intent", error);
			return NextResponse.redirect(
				buildRedirectUrl(redirectBase, {
					[REDIRECT_PARAM]: "error",
					order: orderId ?? undefined,
					payment_intent: paymentIntentId ?? undefined,
				}),
			);
		}
	}

	if (!sessionId?.startsWith("cs_")) {
		return NextResponse.redirect(
			buildRedirectUrl(redirectBase, {
				[REDIRECT_PARAM]: "missing_session",
			}),
		);
	}

	if (!stripe) {
		return NextResponse.redirect(
			buildRedirectUrl(redirectBase, {
				[REDIRECT_PARAM]: "stripe_not_configured",
			}),
		);
	}

	try {
		const session = await stripe.checkout.sessions.retrieve(sessionId, {
			expand: ["payment_intent"],
		});
		const status = deriveCheckoutStatus(session);
		return NextResponse.redirect(
			buildRedirectUrl(redirectBase, {
				[REDIRECT_PARAM]: status,
				session_id: sessionId,
			}),
		);
	} catch (error) {
		console.error("[checkout/return] Failed to retrieve session", error);
		return NextResponse.redirect(
			buildRedirectUrl(redirectBase, {
				[REDIRECT_PARAM]: "error",
				session_id: sessionId,
			}),
		);
	}
}

function deriveCheckoutStatus(session: Stripe.Checkout.Session): CheckoutStatus {
	const paymentStatus = session.payment_status;
	const sessionStatus = session.status;
	const paymentIntent =
		typeof session.payment_intent === "object" ? (session.payment_intent as Stripe.PaymentIntent) : undefined;

	if (
		paymentStatus === "paid" ||
		paymentStatus === "no_payment_required" ||
		paymentIntent?.status === "succeeded"
	) {
		return "success";
	}
	if (paymentIntent?.status === "processing") {
		return "processing";
	}
	if (
		paymentIntent?.status === "requires_payment_method" ||
		paymentIntent?.status === "requires_action" ||
		paymentIntent?.status === "requires_confirmation" ||
		paymentIntent?.status === "requires_capture"
	) {
		return "requires_payment_method";
	}
	if (sessionStatus === "expired") return "expired";
	if (sessionStatus === "open") return "open";
	if (sessionStatus === "complete" && paymentStatus === "unpaid") return "failed";
	return "unknown";
}

function derivePaymentIntentCheckoutStatus(status?: Stripe.PaymentIntent.Status | null): CheckoutStatus {
	if (status === "succeeded") return "success";
	if (status === "processing") return "processing";
	if (
		status === "requires_payment_method" ||
		status === "requires_action" ||
		status === "requires_confirmation" ||
		status === "requires_capture"
	) {
		return "requires_payment_method";
	}
	if (status === "canceled") return "cancel";
	return "unknown";
}

function buildRedirectUrl(base: string, params: Record<string, string | undefined>) {
	const searchParams = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value) searchParams.set(key, value);
	}
	const qs = searchParams.toString();
	return `${base}/${qs ? `?${qs}` : ""}`;
}
