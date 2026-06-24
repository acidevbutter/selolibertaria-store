import { ObjectId } from "mongodb";
import { nanoid } from "nanoid";
import { env } from "@/env.mjs";
import { requireAuth } from "@/lib/api-auth";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
	const auth = await requireAuth();
	if ("error" in auth) return auth.error;
	try {
		const db = await getDb();
		const userId = auth.session?.sub;
		if (!userId)
			return new Response(
				JSON.stringify({ error: "Não autorizado", code: "RESEND_VERIFICATION_UNAUTHORIZED" }),
				{
					status: 401,
				},
			);
		const oid = new ObjectId(String(userId));
		const user = await db.collection("users").findOne({ _id: oid });
		if (!user)
			return new Response(
				JSON.stringify({ error: "Usuária não encontrada", code: "RESEND_VERIFICATION_USER_NOT_FOUND" }),
				{
					status: 404,
				},
			);
		if (user.verified) return new Response(JSON.stringify({ ok: true, message: "E-mail já verificado" }));

		const now = new Date();
		let token = user.verification?.token;
		let expiresAt = user.verification?.expiresAt ? new Date(user.verification.expiresAt) : undefined;
		if (!token || !expiresAt || expiresAt <= now) {
			token = nanoid(48);
			expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
			await db
				.collection("users")
				.updateOne({ _id: user._id }, { $set: { verification: { token, expiresAt } } });
		}

		try {
			const { confirmationEmailHtml } = await import("@/lib/email-templates/confirmation");
			const verifyUrl = new URL(
				"/api/auth/verify",
				process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
			).toString();
			const html = confirmationEmailHtml({
				name: user.name || "",
				verifyUrl: `${verifyUrl}?token=${token}`,
				supportEmail: env.SMTP_USER,
			});
			const { sendEmail } = await import("@/lib/email");
			const result = await sendEmail({
				to: user.email,
				subject: "Confirme seu e-mail",
				text: `Confirme sua conta: ${verifyUrl}?token=${token}`,
				html,
				log: {
					kind: "email_confirmation",
					source: "api/auth/resend-verification",
					userId: String(user._id),
					template: "confirmation",
				},
			});
			if (!result.sent || result.persistenceError) {
				console.warn(
					"Resend verification: email send/persistence issue",
					result.error,
					result.persistenceError,
				);
				return new Response(
					JSON.stringify({
						ok: false,
						sent: !!result.sent,
						error: result.error,
						persistenceError: result.persistenceError,
						code: "RESEND_VERIFICATION_SEND_FAILED",
					}),
					{ status: 500 },
				);
			}
		} catch (err) {
			console.error("Failed to send verification email", err);
			return new Response(
				JSON.stringify({ error: "Falha ao enviar o e-mail", code: "RESEND_VERIFICATION_SEND_FAILED" }),
				{
					status: 500,
				},
			);
		}

		return new Response(JSON.stringify({ ok: true }));
	} catch (err) {
		console.error(err);
		return new Response(
			JSON.stringify({ error: "Erro no servidor", code: "RESEND_VERIFICATION_SERVER_ERROR" }),
			{
				status: 500,
			},
		);
	}
}
