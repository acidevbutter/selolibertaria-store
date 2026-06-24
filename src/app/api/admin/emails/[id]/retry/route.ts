import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { sendEmail } from "@/lib/email";
import type { SendEmailMode } from "@/lib/email-delivery-plan";
import { getDb } from "@/lib/mongodb";

interface CommunicationLogDoc {
	_id: ObjectId;
	email?: string | null;
	subject?: string | null;
	kind?: string | null;
	source?: string | null;
	userId?: string | null;
	purchaseId?: string | null;
	orderStatus?: string | null;
	template?: string | null;
	emailBody?: string | null;
	textBody?: string | null;
}

function extractErrorMessage(value: unknown) {
	if (!value) return "Não foi possível reenviar o email.";
	if (typeof value === "string") return value;
	if (value instanceof Error) return value.message;
	if (typeof value === "object" && "error" in value) {
		const errorValue = (value as { error?: unknown }).error;
		if (typeof errorValue === "string") return errorValue;
	}
	return "Não foi possível reenviar o email.";
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin();
	if ("error" in auth) return auth.error;

	const { id } = await params;
	if (!ObjectId.isValid(id)) {
		return new Response(
			JSON.stringify({ error: "ID do email inválido.", code: "ADMIN_EMAIL_RETRY_INVALID_ID" }),
			{ status: 400 },
		);
	}

	try {
		const body = (await req.json().catch(() => null)) as { via?: string } | null;
		const via = body?.via === "api" || body?.via === "smtp" || body?.via === "auto" ? body.via : "auto";
		const db = await getDb();
		const communication = db.collection<CommunicationLogDoc>("communication");
		const doc = await communication.findOne({ _id: new ObjectId(id) });

		if (!doc) {
			return new Response(
				JSON.stringify({ error: "Registro de email não encontrado.", code: "ADMIN_EMAIL_RETRY_NOT_FOUND" }),
				{ status: 404 },
			);
		}
		if (!doc.email) {
			return new Response(
				JSON.stringify({
					error: "Este registro de email não tem destinatário.",
					code: "ADMIN_EMAIL_RETRY_RECIPIENT_MISSING",
				}),
				{ status: 400 },
			);
		}
		if (!doc.subject) {
			return new Response(
				JSON.stringify({ error: "Este registro de email não tem assunto.", code: "ADMIN_EMAIL_RETRY_SUBJECT_MISSING" }),
				{ status: 400 },
			);
		}
		if (!doc.emailBody && !doc.textBody) {
			return new Response(
				JSON.stringify({
					error: "Este registro de email não tem conteúdo para nova tentativa.",
					code: "ADMIN_EMAIL_RETRY_CONTENT_MISSING",
				}),
				{ status: 400 },
			);
		}

		const result = await sendEmail({
			to: doc.email,
			subject: doc.subject,
			html: doc.emailBody ?? undefined,
			text: doc.textBody ?? undefined,
			mode: via as SendEmailMode,
			log: {
				kind: doc.kind ?? "transactional",
				source: "api/admin/emails/retry",
				userId: doc.userId ?? undefined,
				purchaseId: doc.purchaseId ?? undefined,
				orderStatus: doc.orderStatus ?? undefined,
				template: doc.template ?? undefined,
				retryOfCommunicationId: String(doc._id),
			},
		});

		if (!result.sent) {
			return new Response(
				JSON.stringify({
					error: result.error || "Não foi possível concluir a nova tentativa.",
					code: "ADMIN_EMAIL_RETRY_FAILED",
					persistenceError: result.persistenceError,
				}),
				{ status: 502 },
			);
		}

		await communication.updateOne(
			{ _id: doc._id },
			{
				$set: {
					lastRetryRequestedAt: new Date(),
					lastRetryRequestedBy: auth.session.sub,
				},
			},
		);

		return new Response(
			JSON.stringify({
				ok: true,
				messageId: result.messageId,
			}),
			{ status: 200 },
		);
	} catch (error) {
		return new Response(
			JSON.stringify({ error: extractErrorMessage(error), code: "ADMIN_EMAIL_RETRY_UNEXPECTED" }),
			{ status: 500 },
		);
	}
}
