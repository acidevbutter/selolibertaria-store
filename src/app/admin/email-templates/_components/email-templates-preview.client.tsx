"use client";

import { useMemo, useState } from "react";
import { emailTemplatePreviewDefinitions } from "@/lib/admin-email-template-previews";
import { SlButton } from "@/ui/sl/sl-button";

const fieldClassName =
	"h-10 w-full border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-3 text-sm text-[var(--sl-ink)] outline-none placeholder:text-[color:var(--sl-text-disabled)]";
const fieldStyle = { borderRadius: "var(--sl-radius)" } as const;

export function EmailTemplatesPreviewClient({
	supportEmail,
	supportEmailSource,
	currency,
	baseUrl,
	defaultTestRecipient,
}: {
	supportEmail: string;
	supportEmailSource: string;
	currency: string;
	baseUrl: string;
	defaultTestRecipient: string;
}) {
	const [selected, setSelected] = useState<string>(emailTemplatePreviewDefinitions[0]?.id ?? "");
	const [search, setSearch] = useState("");
	const [previewVersion, setPreviewVersion] = useState(0);
	const [testRecipient, setTestRecipient] = useState(defaultTestRecipient);
	const [testStatus, setTestStatus] = useState<string | null>(null);
	const [isSendingTest, setIsSendingTest] = useState(false);

	const filteredTemplates = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return emailTemplatePreviewDefinitions;
		return emailTemplatePreviewDefinitions.filter((template) =>
			`${template.label} ${template.description} ${template.category}`.toLowerCase().includes(query),
		);
	}, [search]);

	const selectedValue =
		filteredTemplates.find((template) => template.id === selected)?.id ?? filteredTemplates[0]?.id ?? "";
	const current = filteredTemplates.find((template) => template.id === selectedValue) ?? null;
	const html = current ? current.render({ supportEmail, currency, baseUrl }) : "";

	async function sendTestEmail() {
		if (!current) return;
		const recipient = testRecipient.trim().toLowerCase();
		if (!recipient) {
			setTestStatus("Informe um e-mail de destino para enviar a prévia.");
			return;
		}

		setIsSendingTest(true);
		setTestStatus(null);

		try {
			const response = await fetch("/api/admin/email-templates/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ templateId: current.id, to: recipient }),
			});
			const data = (await response.json().catch(() => null)) as { error?: string; messageId?: string } | null;
			if (!response.ok) {
				setTestStatus(data?.error ?? "Não foi possível enviar o e-mail de teste agora.");
				return;
			}
			setTestStatus(
				data?.messageId
					? `E-mail de teste enviado. ID da mensagem: ${data.messageId}`
					: "E-mail de teste enviado com sucesso.",
			);
		} catch {
			setTestStatus("Não foi possível enviar o e-mail de teste agora.");
		} finally {
			setIsSendingTest(false);
		}
	}

	return (
		<div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
			<section className="space-y-4 border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] p-5">
				<div className="space-y-2">
					<h2 className="editorial-serif text-2xl font-semibold">Biblioteca de modelos</h2>
					<p className="text-sm leading-6 text-[var(--sl-text-muted)]">
						Escolha um modelo para revisar a estrutura, a copy e a assinatura.
					</p>
				</div>
				<div className="space-y-2">
					<label htmlFor="email-template-search" className="text-sm font-medium">
						Buscar modelo
					</label>
					<input
						id="email-template-search"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Conta, pedido, promoção..."
						className={fieldClassName}
						style={fieldStyle}
					/>
				</div>
				<div className="space-y-2">
					<label htmlFor="email-template-select" className="text-sm font-medium">
						Modelo em revisão
					</label>
					<select
						id="email-template-select"
						value={selectedValue}
						onChange={(event) => setSelected(event.target.value)}
						className={fieldClassName}
						style={fieldStyle}
						disabled={filteredTemplates.length === 0}
					>
						{filteredTemplates.map((template) => (
							<option key={template.id} value={template.id}>
								{template.label}
							</option>
						))}
					</select>
				</div>
				<div className="space-y-3">
					{filteredTemplates.map((template) => {
						const active = template.id === current?.id;
						return (
							<button
								key={template.id}
								type="button"
								onClick={() => setSelected(template.id)}
								className={`w-full border px-4 py-4 text-left transition-colors ${
									active
										? "border-[var(--sl-ink)] bg-[var(--sl-paper)]"
										: "border-[var(--sl-line)] bg-[var(--sl-paper-pure)] hover:border-[var(--sl-text-muted)]"
								}`}
							>
								<div className="flex items-start justify-between gap-3">
									<div className="space-y-2">
										<div className="flex flex-wrap items-center gap-2">
											<div className="text-sm font-semibold text-[var(--sl-ink)]">{template.label}</div>
											<span className="border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)]">
												{template.category}
											</span>
										</div>
										<p className="text-sm leading-6 text-[var(--sl-text-muted)]">{template.description}</p>
									</div>
									{active ? (
										<span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-accent)]">
											Prévia
										</span>
									) : null}
								</div>
							</button>
						);
					})}
					{filteredTemplates.length === 0 ? (
						<div className="border border-dashed border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-4 py-6 text-sm text-[var(--sl-text-muted)]">
							Nenhum modelo encontrado para essa busca.
						</div>
					) : null}
				</div>
			</section>

			<section className="space-y-4 border border-[var(--sl-line)] bg-[var(--sl-paper)] p-5">
				<div className="flex flex-col gap-4 border-b border-[var(--sl-line)] pb-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="space-y-2">
						<h2 className="editorial-serif text-2xl font-semibold">{current?.label ?? "Prévia"}</h2>
						<p className="max-w-2xl text-sm leading-6 text-[var(--sl-text-muted)]">
							{current?.description ?? "Refine a busca ou limpe o filtro para visualizar uma prévia."}
						</p>
						{current ? (
							<div className="flex flex-wrap gap-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--sl-text-muted)]">
								<span className="border border-[var(--sl-line)] px-2 py-1">{current.category}</span>
								<span className="border border-[var(--sl-line)] px-2 py-1">
									Assunto: {current.testSubject}
								</span>
							</div>
						) : null}
					</div>
					<div className="grid gap-3 border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-4 py-3 text-sm">
						<div>
							<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-accent)]">
								E-mail de suporte
							</div>
							<div className="mt-2 font-medium text-[var(--sl-ink)]">
								{supportEmail || "Ainda não configurado"}
							</div>
						</div>
						<div className="text-xs leading-5 text-[var(--sl-text-muted)]">
							Origem atual: {supportEmailSource}
						</div>
					</div>
				</div>

				{current ? (
					<div className="grid gap-4 border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] p-4 xl:grid-cols-[minmax(0,1fr)_320px]">
						<div className="space-y-3">
							<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-accent)]">
								Variáveis de exemplo
							</div>
							<div className="grid gap-2 sm:grid-cols-2">
								{current.variables.map((variable) => (
									<div
										key={`${current.id}:${variable.name}`}
										className="border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-3 py-3"
									>
										<div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sl-text-muted)]">
											{variable.name}
										</div>
										<div className="mt-2 text-sm text-[var(--sl-ink)]">{variable.example}</div>
									</div>
								))}
							</div>
						</div>
						<div className="space-y-3">
							<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sl-accent)]">
								Envio de teste
							</div>
							<label htmlFor="email-template-test-recipient" className="text-sm font-medium">
								Enviar para
							</label>
							<input
								id="email-template-test-recipient"
								type="email"
								value={testRecipient}
								onChange={(event) => setTestRecipient(event.target.value)}
								placeholder="operacao@selolibertaria.com"
								className={fieldClassName}
								style={fieldStyle}
								autoCapitalize="none"
								autoCorrect="off"
								spellCheck={false}
							/>
							<SlButton
								type="button"
								variant="primary"
								fullWidth
								onClick={sendTestEmail}
								disabled={!current || isSendingTest}
							>
								{isSendingTest ? "Enviando teste..." : "Enviar e-mail de teste"}
							</SlButton>
							<p className="text-xs leading-5 text-[var(--sl-text-muted)]">
								O envio usa o HTML real deste modelo e registra a tentativa no histórico de comunicação.
							</p>
							{testStatus ? (
								<div className="border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-3 py-3 text-sm text-[var(--sl-ink)]">
									{testStatus}
								</div>
							) : null}
						</div>
					</div>
				) : null}

				<div className="flex flex-wrap gap-3">
					<SlButton
						type="button"
						variant="secondary"
						onClick={() => setPreviewVersion((value) => value + 1)}
						disabled={!current}
					>
						Atualizar prévia
					</SlButton>
				</div>

				{current ? (
					<iframe
						key={`${current.id}:${previewVersion}:${supportEmail}`}
						title={`Prévia do modelo ${current.label}`}
						srcDoc={html}
						sandbox=""
						className="min-h-[760px] w-full border border-[var(--sl-line)] bg-[var(--sl-paper-pure)]"
					/>
				) : (
					<div className="grid min-h-[760px] place-items-center border border-dashed border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-6 text-center text-sm leading-6 text-[var(--sl-text-muted)]">
						Nenhum modelo corresponde ao filtro atual. Limpe a busca para continuar.
					</div>
				)}
			</section>
		</div>
	);
}
