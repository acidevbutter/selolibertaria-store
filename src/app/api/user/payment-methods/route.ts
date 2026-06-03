import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "@/env.mjs";
import { requireStorefrontBuyer } from "@/lib/api-auth";
import { getDb } from "@/lib/mongodb";
import { listSavedCardPaymentMethods } from "@/lib/saved-payment-methods";

export async function GET() {
	if (!env.STRIPE_SECRET_KEY) {
		return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
	}

	const auth = await requireStorefrontBuyer();
	if ("error" in auth) return auth.error;

	const db = await getDb();
	const user = await db
		.collection("users")
		.findOne<{ stripeCustomerId?: string }>(
			{ _id: new ObjectId(String(auth.session.sub)) },
			{ projection: { stripeCustomerId: 1 } },
		);

	if (!user?.stripeCustomerId) {
		return NextResponse.json({ paymentMethods: [] });
	}

	const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: undefined });
	const paymentMethods = await listSavedCardPaymentMethods(stripe, user.stripeCustomerId);

	return NextResponse.json({
		paymentMethods,
	});
}
