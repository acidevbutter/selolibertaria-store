import type { ObjectId } from "mongodb";
import type { NextRequest } from "next/server";
import { env } from "@/env.mjs";
import {
	mapMercadoPagoStatus,
	retrieveMercadoPagoPayment,
	validateMercadoPagoPaymentResponse,
	validateMercadoPagoWebhookSignature,
} from "@/lib/mercado-pago";
import { getDb } from "@/lib/mongodb";

interface OrderDraftDoc {
	_id: ObjectId;
	orderId: string;
	paymentProvider: "mercado_pago";
	mercadoPagoPaymentId?: string | null;
	amountTotal: number;
	currency: string;
}

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
		const payment = await retrieveMercadoPagoPayment(paymentId);
		const orderId =
			typeof payment.external_reference === "string"
				? payment.external_reference
				: typeof payment.metadata?.orderId === "string"
					? payment.metadata.orderId
					: null;
		const draft = await db.collection<OrderDraftDoc>("orderDrafts").findOne({
			paymentProvider: "mercado_pago",
			$or: [{ mercadoPagoPaymentId: paymentId }, ...(orderId ? [{ orderId }] : [])],
		});
		if (!draft) {
			await webhooksCol.updateOne(
				{ _id: logId },
				{
					$set: {
						verified: true,
						status: "ignored",
						error: "Order draft not found",
						processedAt: new Date(),
					},
				},
			);
			return new Response("ok", { status: 200 });
		}
		const paymentValidation = validateMercadoPagoPaymentResponse(payment, {
			amountInCents: draft.amountTotal,
			currency: draft.currency,
			externalReference: draft.orderId,
		});
		if (!paymentValidation.ok) {
			await webhooksCol.updateOne(
				{ _id: logId },
				{
					$set: { verified: true, status: "failed", error: paymentValidation.error, processedAt: new Date() },
				},
			);
			return new Response("payment mismatch", { status: 422 });
		}
		const status = mapMercadoPagoStatus(payment.status);
		const updateResult = await db.collection<OrderDraftDoc>("orderDrafts").updateOne(
			{ _id: draft._id },
			{
				$set: {
					status,
					mercadoPagoPaymentId: paymentId,
					"mercadoPago.status": payment.status ?? null,
					"mercadoPago.statusDetail": payment.status_detail ?? null,
					updatedAt: new Date(),
					confirmedAt: status === "succeeded" ? new Date() : null,
					lastMercadoPagoEventId: body?.id ? String(body.id) : null,
				},
			},
		);

		await webhooksCol.updateOne(
			{ _id: logId },
			{
				$set: {
					eventId: body?.id ? String(body.id) : paymentId,
					type: body?.type ? String(body.type) : req.nextUrl.searchParams.get("type"),
					verified: true,
					status: updateResult.matchedCount > 0 ? "processed" : "ignored",
					error: updateResult.matchedCount > 0 ? null : "Order draft not found",
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
