import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSiteActivationForAdmin } from "@/app/ativacao/activation-actions";
import { auth } from "@/lib/auth";
import AdminOAuthProviders from "../_components/admin-oauth-providers.client";
import AdminPaymentMethods from "../_components/admin-payment-methods.client";
import AdminRegionalSettings from "../_components/admin-regional-settings.client";
import AdminShippingProviders from "../_components/admin-shipping-providers.client";
import { AdminStoreActivation } from "../_components/admin-store-activation.client";
import AdminSupportEmail from "../_components/admin-support-email.client";
import { AdminThemeSelector } from "./theme-selector.client";

export const dynamic = "force-dynamic";

/** One collapsible settings block: eyebrow, title, short description, then the form. */
function SettingsSection({
	eyebrow,
	title,
	description,
	defaultOpen = false,
	children,
}: {
	eyebrow: string;
	title: string;
	description: string;
	defaultOpen?: boolean;
	children: ReactNode;
}) {
	return (
		<details open={defaultOpen} className="ad-panel group">
			<summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 sm:px-8">
				<div className="space-y-2">
					<p className="ad-eb">{eyebrow}</p>
					<div className="text-lg font-black" style={{ color: "var(--ad-text)" }}>
						{title}
					</div>
					<p className="ad-body max-w-2xl" style={{ fontSize: 13 }}>
						{description}
					</p>
				</div>
				<span className="ad-ml group-open:hidden">Expandir</span>
				<span className="ad-ml hidden group-open:block">Recolher</span>
			</summary>
			<div className="border-t px-6 py-6 sm:px-8" style={{ borderColor: "var(--ad-line)" }}>
				{children}
			</div>
		</details>
	);
}

/** Small static info card — no link/click, just an eyebrow, an optional value and a helper line. */
function InfoCard({ label, value, helper }: { label: ReactNode; value?: ReactNode; helper: ReactNode }) {
	return (
		<div className="ad-panel" style={{ padding: "var(--ad-pad-sheet)" }}>
			<span className="ad-eb">{label}</span>
			{value ? (
				<div className="ad-num mt-2" style={{ fontSize: 24 }}>
					{value}
				</div>
			) : null}
			<p className="ad-body mt-2" style={{ fontSize: 13 }}>
				{helper}
			</p>
		</div>
	);
}

export default async function AdminSettingsPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (session.user.role !== "admin") redirect("/forbidden");

	const activation = await getSiteActivationForAdmin();

	return (
		<>
			<div className="ad-head">
				<h1>Configurações</h1>
				<span className="ad-meta">idioma, suporte, autenticação e frete em blocos curtos</span>
			</div>

			<div className="ad-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
				<InfoCard label="Blocos" value="7" helper="Ajustes organizados por tema." />
				<InfoCard
					label="Padrão regional"
					value="Idioma e país"
					helper="Usados quando a pessoa usuária ainda não definiu preferências."
				/>
				<InfoCard
					label="Visão rápida"
					helper="Abra apenas a seção necessária para reduzir ruído visual e preservar contexto ao salvar cada ajuste."
				/>
			</div>

			<div className="ad-grid" style={{ gap: 20 }}>
				<SettingsSection
					eyebrow="Loja"
					title="Status da loja"
					description="Coloque a loja em manutenção ou reative o acesso público sem depender de deploy."
					defaultOpen
				>
					<AdminStoreActivation initial={activation} />
				</SettingsSection>

				<SettingsSection
					eyebrow="Aparência"
					title="Tema do admin"
					description="Defina o clima visual usado no admin sem misturar esse ajuste com preferências públicas da loja."
					defaultOpen
				>
					<AdminThemeSelector />
				</SettingsSection>

				<SettingsSection
					eyebrow="Região"
					title="Idioma e país padrão"
					description="Define o idioma padrão e a região inicial dos formulários quando a pessoa ainda não salvou seus dados."
					defaultOpen
				>
					<AdminRegionalSettings />
				</SettingsSection>

				<SettingsSection
					eyebrow="Suporte"
					title="E-mail de suporte"
					description="Usado nos e-mails transacionais e nos pontos de contato do admin."
				>
					<AdminSupportEmail />
				</SettingsSection>

				<SettingsSection
					eyebrow="Pagamento"
					title="Métodos de pagamento"
					description="Pix e cartão ficam sempre ativos; o boleto é opcional."
				>
					<AdminPaymentMethods />
				</SettingsSection>

				<SettingsSection
					eyebrow="Acesso"
					title="Provedores sociais"
					description="Ative ou revise integrações de login social sem espalhar credenciais por telas secundárias."
				>
					<AdminOAuthProviders />
				</SettingsSection>

				<SettingsSection
					eyebrow="Entrega"
					title="Cálculo de frete"
					description="Ative a cotação e ajuste apenas os parâmetros operacionais do Melhor Envio, mantendo o token técnico fora do admin."
				>
					<AdminShippingProviders />
				</SettingsSection>
			</div>
		</>
	);
}
