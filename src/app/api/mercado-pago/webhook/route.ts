import type { NextRequest } from "next/server";
import { recordMercadoPagoCheckout } from "@/actions/mercado-pago-order-actions";
import { env } from "@/env.mjs";
import { validateMercadoPagoWebhookSignature } from "@/lib/mercado-pago";
import { getDb } from "@/lib/mongodb";

function safeParseJson(bodyText: string) {
	try {
		return JSON.parse(bodyText) as Record<string, unknown>;
	} catch {
		return null;
	}
}

function extractPaymentId(req: NextRequest, body: Record<string, unknown> | null) {
	const queryDataId = req.nextUrl.searchParams.get("data.id") || req.nextUrl.searchParams.get("id");
	if (queryDataId) return queryDataId;
	const data = body?.data;
	if (data && typeof data === "object" && "id" in data) {
		const value = (data as { id?: unknown }).id;
		if (typeof value === "string" || typeof value === "number") return String(value);
	}
	const id = body?.id;
	if (typeof id === "string" || typeof id === "number") return String(id);
	return null;
}

export async function POST(req: NextRequest) {
	const requestHeaders = Object.fromEntries(req.headers.entries());
	const bodyText = await req.text().catch(() => "");
	const body = bodyText ? safeParseJson(bodyText) : null;
	const paymentId = extractPaymentId(req, body);
	const db = await getDb();
	const webhooksCol = db.collection("webhooks");
	const logResult = await webhooksCol.insertOne({
		eventId: body?.id ? String(body.id) : paymentId,
		type: body?.type ? String(body.type) : req.nextUrl.searchParams.get("type"),
		provider: "mercado_pago",
		raw: body,
		headers: requestHeaders,
		verified: false,
		receivedAt: new Date(),
		status: "pending",
		error: null,
		processedAt: null,
	});
	const logId = logResult.insertedId;

	if (!paymentId) {
		await webhooksCol.updateOne(
			{ _id: logId },
			{ $set: { status: "ignored", error: "Missing Mercado Pago payment id", processedAt: new Date() } },
		);
		return new Response("ignored", { status: 200 });
	}

	const signatureOk = validateMercadoPagoWebhookSignature({
		xSignature: req.headers.get("x-signature"),
		xRequestId: req.headers.get("x-request-id"),
		dataId: paymentId,
		secret: env.MERCADO_PAGO_WEBHOOK_SECRET,
	});
	if (!signatureOk) {
		await webhooksCol.updateOne(
			{ _id: logId },
			{ $set: { status: "failed", error: "Invalid Mercado Pago signature", processedAt: new Date() } },
		);
		return new Response("invalid signature", { status: 401 });
	}

	try {
		const finalized = await recordMercadoPagoCheckout({ paymentId, createSession: false });
		if ("error" in finalized && finalized.status !== "failed") throw new Error(finalized.error);

		await webhooksCol.updateOne(
			{ _id: logId },
			{
				$set: {
					eventId: body?.id ? String(body.id) : paymentId,
					type: body?.type ? String(body.type) : req.nextUrl.searchParams.get("type"),
					verified: true,
					status: "processed",
					error: "error" in finalized ? finalized.error : null,
					processedAt: new Date(),
				},
			},
		);
		return new Response("ok", { status: 200 });
	} catch (error) {
		await webhooksCol.updateOne(
			{ _id: logId },
			{
				$set: {
					status: "failed",
					error: error instanceof Error ? error.message : "Failed Mercado Pago webhook sync",
					processedAt: new Date(),
				},
			},
		);
		return new Response("failed", { status: 500 });
	}
}
