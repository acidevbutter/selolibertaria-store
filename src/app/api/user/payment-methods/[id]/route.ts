import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "@/env.mjs";
import { requireStorefrontBuyer } from "@/lib/api-auth";
import { getDb } from "@/lib/mongodb";

type RouteContext = { params: Promise<{ id?: string | string[] }> };

function extractId(value?: string | string[]) {
	if (typeof value === "string") return value;
	if (Array.isArray(value)) return value[0];
	return undefined;
}

export async function DELETE(_req: Request, ctx: RouteContext) {
	if (!env.STRIPE_SECRET_KEY) {
		return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
	}

	const auth = await requireStorefrontBuyer();
	if ("error" in auth) return auth.error;

	const params = await ctx.params;
	const paymentMethodId = extractId(params?.id);
	if (!paymentMethodId || !paymentMethodId.startsWith("pm_")) {
		return NextResponse.json({ error: "Invalid payment method id" }, { status: 400 });
	}

	const db = await getDb();
	const user = await db
		.collection("users")
		.findOne<{ stripeCustomerId?: string }>(
			{ _id: new ObjectId(String(auth.session.sub)) },
			{ projection: { stripeCustomerId: 1 } },
		);

	if (!user?.stripeCustomerId) {
		return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 });
	}

	const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: undefined });
	const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
	if (paymentMethod.customer !== user.stripeCustomerId) {
		return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
	}

	await stripe.paymentMethods.detach(paymentMethodId);
	return NextResponse.json({ ok: true });
}
