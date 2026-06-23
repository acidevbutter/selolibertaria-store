"use client";

import { useMemo, useState } from "react";
import { emailTemplatePreviewDefinitions } from "@/lib/admin-email-template-previews";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";

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
			<section className="space-y-4 border border-[color:var(--editorial-border)] bg-[#fbf7f1] p-5">
				<div className="space-y-2">
					<h2 className="editorial-serif text-2xl font-semibold">Biblioteca de modelos</h2>
					<p className="text-sm leading-6 text-[color:var(--editorial-muted)]">
						Escolha um modelo para revisar a estrutura, a copy e a assinatura.
					</p>
				</div>
				<div className="space-y-2">
					<label htmlFor="email-template-search" className="text-sm font-medium">
						Buscar modelo
					</label>
					<Input
						id="email-template-search"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Conta, pedido, promoção..."
						className="rounded-none bg-white"
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
						className="flex h-10 w-full rounded-none border border-[color:var(--editorial-border)] bg-white px-3 py-2 text-sm"
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
										? "border-[color:var(--editorial-ink)] bg-[color:var(--editorial-paper)]"
										: "border-[color:var(--editorial-border)] bg-white hover:border-[color:var(--editorial-muted)]"
								}`}
							>
								<div className="flex items-start justify-between gap-3">
									<div className="space-y-2">
										<div className="flex flex-wrap items-center gap-2">
											<div className="text-sm font-semibold text-[color:var(--editorial-ink)]">
												{template.label}
											</div>
											<span className="border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
												{template.category}
											</span>
										</div>
										<p className="text-sm leading-6 text-[color:var(--editorial-muted)]">
											{template.description}
										</p>
									</div>
									{active ? (
										<span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
											Prévia
										</span>
									) : null}
								</div>
							</button>
						);
					})}
					{filteredTemplates.length === 0 ? (
						<div className="border border-dashed border-[color:var(--editorial-border)] bg-white px-4 py-6 text-sm text-[color:var(--editorial-muted)]">
							Nenhum modelo encontrado para essa busca.
						</div>
					) : null}
					</div>
				</section>

			<section className="space-y-4 border border-[color:var(--editorial-border)] bg-[color:var(--editorial-paper)] p-5">
				<div className="flex flex-col gap-4 border-b border-[color:var(--editorial-border)] pb-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="space-y-2">
						<h2 className="editorial-serif text-2xl font-semibold">{current?.label ?? "Prévia"}</h2>
						<p className="max-w-2xl text-sm leading-6 text-[color:var(--editorial-muted)]">
							{current?.description ?? "Refine a busca ou limpe o filtro para visualizar uma prévia."}
						</p>
						{current ? (
							<div className="flex flex-wrap gap-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--editorial-muted)]">
								<span className="border border-[color:var(--editorial-border)] px-2 py-1">
									{current.category}
								</span>
								<span className="border border-[color:var(--editorial-border)] px-2 py-1">
									Assunto: {current.testSubject}
								</span>
							</div>
						) : null}
					</div>
					<div className="grid gap-3 border border-[color:var(--editorial-border)] bg-[#fbf7f1] px-4 py-3 text-sm">
						<div>
							<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
								E-mail de suporte
							</div>
							<div className="mt-2 font-medium text-[color:var(--editorial-ink)]">
								{supportEmail || "Ainda não configurado"}
							</div>
						</div>
						<div className="text-xs leading-5 text-[color:var(--editorial-muted)]">
							Origem atual: {supportEmailSource}
						</div>
					</div>
				</div>

				{current ? (
					<div className="grid gap-4 border border-[color:var(--editorial-border)] bg-[#fbf7f1] p-4 xl:grid-cols-[minmax(0,1fr)_320px]">
						<div className="space-y-3">
							<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
								Variáveis de exemplo
							</div>
							<div className="grid gap-2 sm:grid-cols-2">
								{current.variables.map((variable) => (
									<div key={`${current.id}:${variable.name}`} className="border border-[color:var(--editorial-border)] bg-white px-3 py-3">
										<div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--editorial-muted)]">
											{variable.name}
										</div>
										<div className="mt-2 text-sm text-[color:var(--editorial-ink)]">{variable.example}</div>
									</div>
								))}
							</div>
						</div>
						<div className="space-y-3">
							<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--editorial-accent)]">
								Envio de teste
							</div>
							<label htmlFor="email-template-test-recipient" className="text-sm font-medium">
								Enviar para
							</label>
							<Input
								id="email-template-test-recipient"
								type="email"
								value={testRecipient}
								onChange={(event) => setTestRecipient(event.target.value)}
								placeholder="operacao@selolibertaria.com"
								className="rounded-none bg-white"
								autoCapitalize="none"
								autoCorrect="off"
								spellCheck={false}
							/>
							<Button
								type="button"
								className="w-full rounded-none"
								onClick={sendTestEmail}
								disabled={!current || isSendingTest}
							>
								{isSendingTest ? "Enviando teste..." : "Enviar e-mail de teste"}
							</Button>
							<p className="text-xs leading-5 text-[color:var(--editorial-muted)]">
								O envio usa o HTML real deste modelo e registra a tentativa no histórico de comunicação.
							</p>
							{testStatus ? (
								<div className="border border-[color:var(--editorial-border)] bg-white px-3 py-3 text-sm text-[color:var(--editorial-ink)]">
									{testStatus}
								</div>
							) : null}
						</div>
					</div>
				) : null}

				<div className="flex flex-wrap gap-3">
					<Button
						type="button"
						variant="outline"
						className="rounded-none bg-white"
						onClick={() => setPreviewVersion((value) => value + 1)}
						disabled={!current}
					>
						Atualizar prévia
					</Button>
				</div>

				{current ? (
					<iframe
						key={`${current.id}:${previewVersion}:${supportEmail}`}
						title={`Prévia do modelo ${current.label}`}
						srcDoc={html}
						sandbox=""
						className="min-h-[760px] w-full border border-[color:var(--editorial-border)] bg-white"
					/>
				) : (
					<div className="grid min-h-[760px] place-items-center border border-dashed border-[color:var(--editorial-border)] bg-white px-6 text-center text-sm leading-6 text-[color:var(--editorial-muted)]">
						Nenhum modelo corresponde ao filtro atual. Limpe a busca para continuar.
					</div>
				)}
			</section>
		</div>
	);
}
