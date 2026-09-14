import { Mail } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { EmailTemplatesPreviewClient } from "@/app/admin/email-templates/_components/email-templates-preview.client";
import { env, publicUrl } from "@/env.mjs";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { getSupportEmailSetting } from "@/lib/settings-store";
import {
	AdminEditorialHero,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";

export const dynamic = "force-dynamic";

const templateCount = 5;

export default async function EmailTemplatesPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (!hasCapability(session.user.role, "settings.write")) redirect("/forbidden");
	const configuredSupportEmail = await getSupportEmailSetting();
	const supportEmail = configuredSupportEmail ?? seloSiteMeta.email;
	const supportEmailSource = configuredSupportEmail ? "Configurações do admin" : "Padrão do projeto";
	const requestHeaders = await headers();
	const forwardedProto = requestHeaders.get("x-forwarded-proto");
	const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
	const baseUrl = host ? `${forwardedProto ?? "http"}://${host}` : publicUrl;
	const currency = String(env.CATALOG_CURRENCY ?? "BRL")
		.trim()
		.toUpperCase();

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="E-mails"
				title="Modelos de email"
				description="Revise a linguagem, a estrutura e a assinatura dos e-mails transacionais antes de alterar o envio real."
				actions={
					<div className="inline-flex items-center gap-3 border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-4 py-3 text-sm text-[var(--sl-text-muted)]">
						<Mail className="h-4 w-4 text-[var(--sl-accent)]" />
						As prévias usam dados de exemplo e o e-mail de suporte salvo em configurações.
					</div>
				}
			/>

			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat
					label="Modelos"
					value={templateCount}
					helper="Modelos ativos de e-mail para revisão."
				/>
				<AdminEditorialStat label="Prévia" value="Isolada" helper="Sem disparar e-mails reais." />
				<AdminEditorialStat
					label="E-mail de suporte"
					value={supportEmail}
					helper={`Assinatura usada nos exemplos desta tela. Origem: ${supportEmailSource.toLowerCase()}.`}
				/>
			</div>

			<EditorialPanel className="p-0">
				<div className="p-6 sm:p-8">
					<EmailTemplatesPreviewClient
						supportEmail={supportEmail}
						supportEmailSource={supportEmailSource}
						currency={currency}
						baseUrl={baseUrl}
						defaultTestRecipient={session.user.email ?? ""}
					/>
				</div>
			</EditorialPanel>
		</AdminEditorialPage>
	);
}
