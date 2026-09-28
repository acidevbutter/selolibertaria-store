import { Mail } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MetricCard } from "@/app/admin/_components/ui/MetricCard";
import { EmailTemplatesPreviewClient } from "@/app/admin/email-templates/_components/email-templates-preview.client";
import { env, publicUrl } from "@/env.mjs";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
import { seloSiteMeta } from "@/lib/selolibertaria-content";
import { getSupportEmailSetting } from "@/lib/settings-store";

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
		<>
			<div className="ad-head">
				<h1>Modelos de email</h1>
				<span className="ad-meta">
					Revise a linguagem, a estrutura e a assinatura dos e-mails transacionais antes de alterar o envio
					real.
				</span>
			</div>

			<div
				className="ad-panel flex items-center gap-3 px-4 py-3 text-sm"
				style={{ color: "var(--ad-text-muted)" }}
			>
				<Mail className="h-4 w-4" style={{ color: "var(--ad-wine)" }} />
				As prévias usam dados de exemplo e o e-mail de suporte salvo em configurações.
			</div>

			<div className="ad-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
				<MetricCard label="Modelos" value={templateCount} note="Modelos ativos de e-mail para revisão." />
				<MetricCard label="Prévia" value="Isolada" note="Sem disparar e-mails reais." />
				<MetricCard
					label="E-mail de suporte"
					value={supportEmail}
					note={`Assinatura usada nos exemplos desta tela. Origem: ${supportEmailSource.toLowerCase()}.`}
				/>
			</div>

			<EmailTemplatesPreviewClient
				supportEmail={supportEmail}
				supportEmailSource={supportEmailSource}
				currency={currency}
				baseUrl={baseUrl}
				defaultTestRecipient={session.user.email ?? ""}
			/>
		</>
	);
}
