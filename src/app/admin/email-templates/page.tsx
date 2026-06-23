import { Mail } from "lucide-react";
import { redirect } from "next/navigation";
import { EmailTemplatesPreviewClient } from "@/app/admin/email-templates/_components/email-templates-preview.client";
import { env } from "@/env.mjs";
import { auth } from "@/lib/auth";
import { hasCapability } from "@/lib/authz";
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
	const supportEmail = (await getSupportEmailSetting()) ?? "";
	const currency = String(env.STRIPE_CURRENCY ?? "BRL")
		.trim()
		.toUpperCase();

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="E-mails"
				title="Modelos de e-mail"
				description="Revise a linguagem, a estrutura e a assinatura dos e-mails transacionais antes de alterar o envio real."
				actions={
					<div className="inline-flex items-center gap-3 border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3 text-sm text-[color:var(--editorial-muted)]">
						<Mail className="h-4 w-4 text-[color:var(--editorial-accent)]" />
						As prévias usam dados de exemplo e o e-mail de suporte salvo em configurações.
					</div>
				}
			/>

			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat label="Modelos" value={templateCount} helper="Modelos ativos de e-mail para revisão." />
				<AdminEditorialStat label="Prévia" value="Isolada" helper="Sem disparar e-mails reais." />
				<AdminEditorialStat
					label="E-mail de suporte"
					value={supportEmail || "Não informado"}
					helper="Assinatura usada nos exemplos desta tela."
				/>
			</div>

			<EditorialPanel className="p-0">
				<div className="p-6 sm:p-8">
					<EmailTemplatesPreviewClient supportEmail={supportEmail} currency={currency} />
				</div>
			</EditorialPanel>
		</AdminEditorialPage>
	);
}
