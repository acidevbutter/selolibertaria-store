import { env } from "@/env.mjs";
import {
	type EmailTemplatePreviewContext,
	getEmailTemplatePreviewDefinition,
} from "@/lib/admin-email-template-previews";
import { requireCapability } from "@/lib/api-auth";
import { sendEmail } from "@/lib/email";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { getSupportEmailSetting } from "@/lib/settings-store";

function isValidEmail(value: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
	const auth = await requireCapability("settings.write");
	if ("error" in auth) return auth.error;

	try {
		const body = (await req.json().catch(() => null)) as { templateId?: string; to?: string } | null;
		const templateId = typeof body?.templateId === "string" ? body.templateId.trim() : "";
		const to = typeof body?.to === "string" ? body.to.trim().toLowerCase() : "";

		if (!templateId) {
			return new Response(
				JSON.stringify({
					error: "Escolha um modelo antes de enviar o teste.",
					code: "ADMIN_EMAIL_TEMPLATE_TEST_TEMPLATE_REQUIRED",
				}),
				{ status: 400 },
			);
		}

		if (!to || !isValidEmail(to)) {
			return new Response(
				JSON.stringify({
					error: "Informe um e-mail válido para receber o teste.",
					code: "ADMIN_EMAIL_TEMPLATE_TEST_RECIPIENT_INVALID",
				}),
				{ status: 400 },
			);
		}

		const definition = getEmailTemplatePreviewDefinition(templateId);
		if (!definition) {
			return new Response(
				JSON.stringify({
					error: "Modelo de e-mail não encontrado.",
					code: "ADMIN_EMAIL_TEMPLATE_TEST_TEMPLATE_NOT_FOUND",
				}),
				{ status: 404 },
			);
		}

		const context: EmailTemplatePreviewContext = {
			supportEmail: (await getSupportEmailSetting()) ?? seloSiteMeta.email,
			currency: String(env.CATALOG_CURRENCY ?? "BRL")
				.trim()
				.toUpperCase(),
			baseUrl: new URL(req.url).origin,
		};

		const html = definition.render(context);
		const result = await sendEmail({
			to,
			subject: definition.testSubject,
			html,
			log: {
				kind: "test",
				source: "api/admin/email-templates/test",
				template: definition.id,
				userId: auth.session.sub,
			},
		});

		if (!result.sent) {
			return new Response(
				JSON.stringify({
					error: result.error || "Não foi possível enviar o e-mail de teste agora.",
					code: "ADMIN_EMAIL_TEMPLATE_TEST_SEND_FAILED",
				}),
				{ status: 502 },
			);
		}

		return new Response(JSON.stringify({ ok: true, messageId: result.messageId ?? null }), { status: 200 });
	} catch {
		return new Response(
			JSON.stringify({
				error: "Não foi possível enviar o e-mail de teste agora.",
				code: "ADMIN_EMAIL_TEMPLATE_TEST_UNEXPECTED",
			}),
			{ status: 500 },
		);
	}
}
