import { env } from "@/env.mjs";
import { issuePasswordResetToken } from "@/lib/account-access";
import { sendEmail } from "@/lib/email";
import { passwordResetEmailHtml } from "@/lib/email-templates/password-reset";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
	try {
		const body = (await req.json()) as { email?: string };
		const email = String(body?.email || "")
			.trim()
			.toLowerCase();

		if (!email) {
			return new Response(JSON.stringify({ ok: true }), { status: 200 });
		}

		const db = await getDb();
		const user = await db
			.collection("users")
			.findOne<{ _id: { toString(): string }; email: string; name?: string }>(
				{ email },
				{ projection: { email: 1, name: 1 } },
			);

		let token: string | undefined;
		if (user?._id) {
			const issued = await issuePasswordResetToken({
				userId: String(user._id),
				purpose: "reset",
			});
			token = issued.token;
		}

		if (user && token && process.env.NODE_ENV !== "test" && process.env.SKIP_EMAILS !== "1") {
			try {
				const resetUrl = new URL(
					"/reset-password",
					process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
				).toString();

				const html = passwordResetEmailHtml({
					name: user.name || "",
					resetUrl: `${resetUrl}?token=${token}`,
					supportEmail: env.SMTP_USER,
				});

				await sendEmail({
					to: user.email,
					subject: "Redefina sua senha",
					text: `${resetUrl}?token=${token}`,
					html,
					log: {
						kind: "password_reset",
						source: "api/auth/forgot-password",
						userId: String(user._id),
						template: "password-reset",
					},
				});
			} catch (err) {
				console.error("Failed send password reset email", err);
			}
		}

		return new Response(JSON.stringify({ ok: true }), { status: 200 });
	} catch (err) {
		console.error(err);
		return new Response(JSON.stringify({ ok: true }), { status: 200 });
	}
}
