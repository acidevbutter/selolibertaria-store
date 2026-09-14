import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
	AdminEditorialHero,
	AdminEditorialNote,
	AdminEditorialPage,
	AdminEditorialStat,
	EditorialPanel,
} from "@/ui/editorial/editorial-primitives";
import AdminOAuthProviders from "../_components/admin-oauth-providers.client";
import AdminPaymentMethods from "../_components/admin-payment-methods.client";
import AdminRegionalSettings from "../_components/admin-regional-settings.client";
import AdminShippingProviders from "../_components/admin-shipping-providers.client";
import AdminSupportEmail from "../_components/admin-support-email.client";
import { AdminThemeSelector } from "./theme-selector.client";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
	const session = await auth();
	if (!session) redirect("/login");
	if (session.user.role !== "admin") redirect("/forbidden");

	return (
		<AdminEditorialPage>
			<AdminEditorialHero
				eyebrow="Configurações"
				title="Configurações"
				description="Centralize idioma, suporte, autenticação e frete em blocos curtos, com contexto claro antes de cada ajuste."
			/>
			<div className="grid gap-5 lg:grid-cols-3">
				<AdminEditorialStat label="Blocos" value="6" helper="Ajustes organizados por tema." />
				<AdminEditorialStat
					label="Padrão regional"
					value="Idioma e país"
					helper="Usados quando a pessoa usuária ainda não definiu preferências."
				/>
				<AdminEditorialNote
					title="Visão rápida"
					description="Abra apenas a seção necessária para reduzir ruído visual e preservar contexto ao salvar cada ajuste."
				/>
			</div>
			<div className="grid gap-5">
				<EditorialPanel className="p-0">
					<details open className="group">
						<summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 sm:px-8">
							<div className="space-y-2">
								<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-accent)]">
									Aparência
								</p>
								<div className="text-lg font-semibold text-[var(--sl-ink)]">Tema do admin</div>
								<p className="max-w-2xl text-sm leading-6 text-[var(--sl-text-muted)]">
									Defina o clima visual usado no admin sem misturar esse ajuste com preferências públicas da
									loja.
								</p>
							</div>
							<span className="pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)] group-open:hidden">
								Expandir
							</span>
							<span className="hidden pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)] group-open:block">
								Recolher
							</span>
						</summary>
						<div className="border-t border-[var(--sl-line)] px-6 py-6 sm:px-8">
							<AdminThemeSelector />
						</div>
					</details>
				</EditorialPanel>

				<EditorialPanel className="p-0">
					<details open className="group">
						<summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 sm:px-8">
							<div className="space-y-2">
								<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-accent)]">
									Região
								</p>
								<div className="text-lg font-semibold text-[var(--sl-ink)]">Idioma e país padrão</div>
								<p className="max-w-2xl text-sm leading-6 text-[var(--sl-text-muted)]">
									Define o idioma padrão e a região inicial dos formulários quando a pessoa ainda não salvou
									seus dados.
								</p>
							</div>
							<span className="pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)] group-open:hidden">
								Expandir
							</span>
							<span className="hidden pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)] group-open:block">
								Recolher
							</span>
						</summary>
						<div className="border-t border-[var(--sl-line)] px-6 py-6 sm:px-8">
							<AdminRegionalSettings />
						</div>
					</details>
				</EditorialPanel>

				<EditorialPanel className="p-0">
					<details className="group">
						<summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 sm:px-8">
							<div className="space-y-2">
								<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-accent)]">
									Suporte
								</p>
								<div className="text-lg font-semibold text-[var(--sl-ink)]">E-mail de suporte</div>
								<p className="max-w-2xl text-sm leading-6 text-[var(--sl-text-muted)]">
									Usado nos e-mails transacionais e nos pontos de contato do admin.
								</p>
							</div>
							<span className="pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)] group-open:hidden">
								Expandir
							</span>
							<span className="hidden pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)] group-open:block">
								Recolher
							</span>
						</summary>
						<div className="border-t border-[var(--sl-line)] px-6 py-6 sm:px-8">
							<AdminSupportEmail />
						</div>
					</details>
				</EditorialPanel>

				<EditorialPanel className="p-0">
					<details className="group">
						<summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 sm:px-8">
							<div className="space-y-2">
								<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-accent)]">
									Pagamento
								</p>
								<div className="text-lg font-semibold text-[var(--sl-ink)]">Métodos de pagamento</div>
								<p className="max-w-2xl text-sm leading-6 text-[var(--sl-text-muted)]">
									Pix e cartão ficam sempre ativos; o boleto é opcional.
								</p>
							</div>
							<span className="pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)] group-open:hidden">
								Expandir
							</span>
							<span className="hidden pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)] group-open:block">
								Recolher
							</span>
						</summary>
						<div className="border-t border-[var(--sl-line)] px-6 py-6 sm:px-8">
							<AdminPaymentMethods />
						</div>
					</details>
				</EditorialPanel>

				<EditorialPanel className="p-0">
					<details className="group">
						<summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 sm:px-8">
							<div className="space-y-2">
								<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-accent)]">
									Acesso
								</p>
								<div className="text-lg font-semibold text-[var(--sl-ink)]">Provedores sociais</div>
								<p className="max-w-2xl text-sm leading-6 text-[var(--sl-text-muted)]">
									Ative ou revise integrações de login social sem espalhar credenciais por telas secundárias.
								</p>
							</div>
							<span className="pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)] group-open:hidden">
								Expandir
							</span>
							<span className="hidden pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)] group-open:block">
								Recolher
							</span>
						</summary>
						<div className="border-t border-[var(--sl-line)] px-6 py-6 sm:px-8">
							<AdminOAuthProviders />
						</div>
					</details>
				</EditorialPanel>

				<EditorialPanel className="p-0">
					<details className="group">
						<summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 sm:px-8">
							<div className="space-y-2">
								<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-accent)]">
									Entrega
								</p>
								<div className="text-lg font-semibold text-[var(--sl-ink)]">Cálculo de frete</div>
								<p className="max-w-2xl text-sm leading-6 text-[var(--sl-text-muted)]">
									Ative a cotação e ajuste apenas os parâmetros operacionais do Melhor Envio, mantendo o token
									técnico fora do admin.
								</p>
							</div>
							<span className="pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)] group-open:hidden">
								Expandir
							</span>
							<span className="hidden pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)] group-open:block">
								Recolher
							</span>
						</summary>
						<div className="border-t border-[var(--sl-line)] px-6 py-6 sm:px-8">
							<AdminShippingProviders />
						</div>
					</details>
				</EditorialPanel>
			</div>
		</AdminEditorialPage>
	);
}
