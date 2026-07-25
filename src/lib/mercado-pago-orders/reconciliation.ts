import "server-only";

import { recordMercadoPagoCheckout } from "@/actions/mercado-pago-order-actions";
import { getDb } from "@/lib/mongodb";

const MAX_ATTEMPTS = 5;
const BACKOFF_MS = [60_000, 300_000, 1_800_000, 7_200_000, 21_600_000];

export type ReconciliationOutcome =
	| "reconciled"
	| "still_pending"
	| "skipped_terminal"
	| "failed"
	| "alerted";

interface PendingDraft {
	orderId: string;
	status?: string;
	mercadoPagoOrderId?: string | null;
	mercadoPagoPaymentId?: string | null;
}

interface AttemptDoc {
	providerOrderId: string;
	orderId: string;
	attempts: number;
	lastAttemptAt?: Date;
	nextAttemptAt?: Date | null;
	lockedUntil?: Date | null;
	status: ReconciliationOutcome;
	lastError?: string | null;
	alert?: boolean;
	updatedAt: Date;
}

function providerOrderId(draft: PendingDraft) {
	return draft.mercadoPagoOrderId || draft.mercadoPagoPaymentId || null;
}

function isPendingStatus(status?: string) {
	return status === "pending" || status === "processing";
}

function retryDelay(attemptNumber: number) {
	return BACKOFF_MS[Math.min(attemptNumber - 1, BACKOFF_MS.length - 1)] ?? 60_000;
}

export async function reconcilePendingMercadoPagoOrders(input: { limit?: number; orderId?: string } = {}) {
	const db = await getDb();
	const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
	const drafts = db.collection<PendingDraft>("orderDrafts");
	const query = input.orderId
		? { orderId: input.orderId }
		: { paymentProvider: "mercado_pago", status: { $in: ["pending", "processing"] } };
	const candidates = await drafts.find(query).sort({ updatedAt: 1 }).limit(limit).toArray();
	const results: Array<{
		orderId: string;
		providerOrderId: string;
		outcome: ReconciliationOutcome;
		error?: string;
	}> = [];

	for (const draft of candidates) {
		const id = providerOrderId(draft);
		if (!id || !isPendingStatus(draft.status)) {
			results.push({ orderId: draft.orderId, providerOrderId: id ?? "", outcome: "skipped_terminal" });
			continue;
		}
		results.push(await reconcileOne(db, draft.orderId, id));
	}

	return { checked: candidates.length, results };
}

async function reconcileOne(db: Awaited<ReturnType<typeof getDb>>, orderId: string, providerOrderId: string) {
	const attempts = db.collection<AttemptDoc>("mercadoPagoReconciliation");
	const now = new Date();
	const current = await attempts.findOne({ providerOrderId });
	if (current?.nextAttemptAt && current.nextAttemptAt > now) {
		return { orderId, providerOrderId, outcome: current.status };
	}
	if (current && (current.alert || current.attempts >= MAX_ATTEMPTS)) {
		return { orderId, providerOrderId, outcome: "alerted" as const, error: current.lastError ?? undefined };
	}

	const attemptNumber = (current?.attempts ?? 0) + 1;
	await attempts.updateOne(
		{ providerOrderId },
		{
			$set: {
				orderId,
				attempts: attemptNumber,
				lastAttemptAt: now,
				lockedUntil: new Date(now.getTime() + 30_000),
				updatedAt: now,
				status: "still_pending",
			},
			$setOnInsert: { providerOrderId },
		},
		{ upsert: true },
	);

	try {
		const result = await recordMercadoPagoCheckout({
			mercadoPagoOrderId: providerOrderId,
			createSession: false,
		});
		if ("ok" in result) {
			const outcome: ReconciliationOutcome = result.status === "processing" ? "still_pending" : "reconciled";
			await attempts.updateOne(
				{ providerOrderId },
				{
					$set: {
						status: outcome,
						lastError: null,
						nextAttemptAt:
							outcome === "still_pending" ? new Date(now.getTime() + retryDelay(attemptNumber)) : null,
						lockedUntil: null,
						updatedAt: new Date(),
					},
				},
			);
			return { orderId, providerOrderId, outcome };
		}
		throw new Error(result.error);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Falha na reconciliação da order";
		const exhausted = attemptNumber >= MAX_ATTEMPTS;
		await attempts.updateOne(
			{ providerOrderId },
			{
				$set: {
					status: exhausted ? "alerted" : "failed",
					lastError: message,
					nextAttemptAt: exhausted ? null : new Date(now.getTime() + retryDelay(attemptNumber)),
					alert: exhausted,
					lockedUntil: null,
					updatedAt: new Date(),
				},
			},
		);
		return {
			orderId,
			providerOrderId,
			outcome: exhausted ? ("alerted" as const) : ("failed" as const),
			error: message,
		};
	}
}
