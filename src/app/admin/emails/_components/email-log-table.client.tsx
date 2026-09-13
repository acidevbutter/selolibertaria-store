"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/app/admin/_components/ui/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/shadcn/dialog";
import { SlButton } from "@/ui/sl/sl-button";
import { StatusBadge } from "@/ui/status-badge";

function Tag({ children }: { children: ReactNode }) {
	return (
		<span
			className="inline-flex max-w-full items-center truncate border border-[var(--sl-line)] px-2 py-1 text-[11px] font-semibold tracking-[0.12em] text-[var(--sl-text-muted)] uppercase"
			style={{ borderRadius: "var(--sl-radius)" }}
		>
			{children}
		</span>
	);
}

export type EmailLogTableItem = {
	id: string;
	sentAtLabel: string;
	status: string;
	kindLabel: string;
	email: string;
	subject: string;
	previewBody: string;
	purchaseId: string | null;
	userId: string | null;
	orderStatus: string | null;
	source: string | null;
	error: string | null;
	template: string | null;
	messageId: string | null;
	provider: string | null;
	attempts: Array<unknown> | null;
	recipients: {
		to?: string[];
		cc?: string[];
		bcc?: string[];
	} | null;
	emailBody: string | null;
	textBody: string | null;
};

function formatJson(value: unknown) {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

function providerLabel(provider: string | null) {
	return provider ? "Butter Relay" : "-";
}

export function EmailLogTable({ items, limit }: { items: EmailLogTableItem[]; limit: number }) {
	const router = useRouter();
	const [selected, setSelected] = useState<EmailLogTableItem | null>(null);
	const [retryingKey, setRetryingKey] = useState<string | null>(null);

	async function retryEmail(item: EmailLogTableItem) {
		setRetryingKey(item.id);
		try {
			const res = await fetch(`/api/admin/emails/${item.id}/retry`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});
			const payload = (await res.json().catch(() => null)) as {
				error?: string;
				persistenceError?: string;
				messageId?: string;
			} | null;

			if (!res.ok) {
				throw new Error(payload?.error || "Não foi possível reenviar o e-mail.");
			}

			toast.success("E-mail reenviado", {
				description: item.email
					? `Uma nova tentativa pelo Butter Relay foi enviada para ${item.email}.`
					: "Uma nova tentativa pelo Butter Relay foi enviada com sucesso.",
			});
			router.refresh();
		} catch (error) {
			const message = error instanceof Error ? error.message : "Não foi possível reenviar o e-mail.";
			toast.error("Falha no reenvio pelo Butter Relay", { description: message });
		} finally {
			setRetryingKey(null);
		}
	}

	function canRetry(item: EmailLogTableItem) {
		return Boolean(item.email && item.subject && (item.emailBody || item.textBody));
	}

	return (
		<>
			<DataTable<EmailLogTableItem>
				columns={[
					{ key: "sentAtLabel", label: "Data", width: "160px" },
					{
						key: "status",
						label: "Status",
						width: "120px",
						render: (item) => <StatusBadge status={item.status || "unknown"} />,
					},
					{ key: "kindLabel", label: "Tipo", width: "180px", render: (item) => <Tag>{item.kindLabel}</Tag> },
					{
						key: "email",
						label: "Destinatário",
						render: (item) => (
							<span className="font-mono text-xs break-all" title={item.email || "-"}>
								{item.email || "-"}
							</span>
						),
					},
				]}
				rows={items}
				empty="Nenhum e-mail encontrado para os filtros atuais."
				onRowClick={setSelected}
			/>
			<p className="mt-3 text-xs text-[var(--sl-text-muted)]">
				Mostrando até {limit} registros, do mais recente para o mais antigo.
			</p>

			<Dialog
				open={selected !== null}
				onOpenChange={(open) => {
					if (!open) setSelected(null);
				}}
			>
				<DialogContent className="h-[88vh] max-w-7xl overflow-hidden p-0">
					{selected ? (
						<div className="grid h-full grid-cols-1 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
							<div className="border-b p-6 lg:border-b-0 lg:border-r">
								<DialogHeader>
									<DialogTitle>{selected.subject || "Assunto não informado"}</DialogTitle>
									<DialogDescription>
										E-mail enviado para {selected.email || "destinatário não identificado"}.
									</DialogDescription>
								</DialogHeader>

								<div className="mt-6 space-y-4 text-sm">
									{selected.error ? (
										<div
											className="border border-[var(--sl-danger-line)] bg-[var(--sl-danger-wash)] p-4"
											style={{ borderRadius: "var(--sl-radius)" }}
										>
											<p className="mb-2 text-xs font-semibold tracking-wide text-[var(--sl-danger)] uppercase">
												Falha de envio
											</p>
											<p className="text-sm break-words text-[var(--sl-danger)]">{selected.error}</p>
										</div>
									) : null}
									<div className="flex items-center gap-2">
										<SlButton
											type="button"
											variant="secondary"
											size="sm"
											disabled={retryingKey !== null || !canRetry(selected)}
											onClick={() => void retryEmail(selected)}
										>
											{retryingKey === selected.id ? "Reenviando..." : "Reenviar pelo Butter Relay"}
										</SlButton>
									</div>
									<div>
										<p className="mb-1 text-xs font-medium text-[var(--sl-text-muted)]">Status</p>
										<StatusBadge status={selected.status || "unknown"} />
									</div>
									<div>
										<p className="mb-1 text-xs font-medium text-[var(--sl-text-muted)]">Tipo</p>
										<Tag>{selected.kindLabel}</Tag>
									</div>
									<div className="space-y-1 text-xs">
										{selected.purchaseId ? (
											<div>
												Pedido:{" "}
												<Link className="underline" href={`/admin/orders/${selected.purchaseId}`}>
													{selected.purchaseId}
												</Link>
											</div>
										) : null}
										{selected.userId ? (
											<div>
												Usuário:{" "}
												<Link className="underline" href={`/admin/users/${selected.userId}`}>
													{selected.userId}
												</Link>
											</div>
										) : null}
										{selected.orderStatus ? <div>Situação do pedido: {selected.orderStatus}</div> : null}
										{selected.source ? <div>Origem do envio: {selected.source}</div> : null}
									</div>
									<div>
										<p className="mb-1 text-xs font-medium text-[var(--sl-text-muted)]">Canal de envio</p>
										<p>{providerLabel(selected.provider)}</p>
									</div>
									<div>
										<p className="mb-1 text-xs font-medium text-[var(--sl-text-muted)]">Enviado em</p>
										<p>{selected.sentAtLabel}</p>
									</div>
									<div>
										<p className="mb-1 text-xs font-medium text-[var(--sl-text-muted)]">Modelo do e-mail</p>
										<p>{selected.template || "Não informado"}</p>
									</div>
									<div>
										<p className="mb-1 text-xs font-medium text-[var(--sl-text-muted)]">ID da mensagem</p>
										<p className="font-mono text-xs break-all">{selected.messageId || "-"}</p>
									</div>
									<div>
										<p className="mb-1 text-xs font-medium text-[var(--sl-text-muted)]">Destinatários</p>
										<pre
											className="max-h-40 overflow-auto border bg-[var(--sl-surface-quiet)] p-3 text-xs"
											style={{ borderRadius: "var(--sl-radius)" }}
										>
											{formatJson(selected.recipients || {})}
										</pre>
									</div>
									<div>
										<p className="mb-1 text-xs font-medium text-[var(--sl-text-muted)]">
											Histórico de tentativas
										</p>
										<pre
											className="max-h-40 overflow-auto border bg-[var(--sl-surface-quiet)] p-3 text-xs"
											style={{ borderRadius: "var(--sl-radius)" }}
										>
											{formatJson(selected.attempts || [])}
										</pre>
									</div>
								</div>
							</div>

							<div className="flex min-h-0 flex-col bg-[var(--sl-surface-quiet)]">
								<div className="border-b border-[var(--sl-line)] px-6 py-3 text-sm text-[var(--sl-text-muted)]">
									{selected.emailBody ? "Prévia do e-mail" : "Versão em texto"}
								</div>
								<div className="min-h-0 flex-1 p-4">
									{selected.emailBody ? (
										<iframe
											title={`Prévia do e-mail ${selected.subject || selected.id}`}
											srcDoc={selected.emailBody}
											sandbox=""
											className="h-full w-full border bg-[var(--sl-paper-pure)]"
											style={{ borderRadius: "var(--sl-radius)" }}
										/>
									) : (
										<pre
											className="h-full overflow-auto border bg-[var(--sl-paper-pure)] p-4 text-xs whitespace-pre-wrap"
											style={{ borderRadius: "var(--sl-radius)" }}
										>
											{selected.textBody || "Nenhum conteúdo disponível."}
										</pre>
									)}
								</div>
							</div>
						</div>
					) : null}
				</DialogContent>
			</Dialog>
		</>
	);
}
