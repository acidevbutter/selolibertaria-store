import { Mail } from "lucide-react";
import { redirect } from "next/navigation";
import { EmailTemplatesPreviewClient } from "@/app/admin/email-templates/_components/email-templates-preview.client";
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

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Emails"
				title="Templates de email"
				description="Revise a linguagem, a estrutura e a assinatura operacional dos emails transacionais antes de alterar o fluxo real de envio."
				actions={
					<div className="inline-flex items-center gap-3 border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3 text-sm text-[color:var(--editorial-muted)]">
						<Mail className="h-4 w-4 text-[color:var(--editorial-accent)]" />
						Os previews usam dados de exemplo e puxam o email de suporte salvo em configurações.
					</div>
				}
			/>

			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat label="Modelos" value={templateCount} helper="Modelos ativos para revisão." />
				<AdminEditorialStat label="Fluxo" value="Prévia" helper="Leitura visual antes do envio real." />
				<AdminEditorialStat
					label="Fonte"
					value="Configurações"
					helper="Assinatura de suporte vinda do backend."
				/>
			</div>

			<EditorialPanel className="p-0">
				<div className="p-6 sm:p-8">
					<EmailTemplatesPreviewClient supportEmail={supportEmail} />
				</div>
			</EditorialPanel>
		</AdminEditorialPage>
	);
}
