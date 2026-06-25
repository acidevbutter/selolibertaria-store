"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/ui/shadcn/badge";
import { Button } from "@/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/shadcn/dialog";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/ui/shadcn/table";
import { StatusBadge } from "@/ui/status-badge";

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

type RetryVia = "api" | "smtp";

function formatJson(value: unknown) {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

function providerLabel(provider: string | null) {
	if (provider === "brevo") return "API do Brevo";
	if (provider === "smtp") return "SMTP";
	return "-";
}

export function EmailLogTable({ items, limit }: { items: EmailLogTableItem[]; limit: number }) {
	const router = useRouter();
	const [selected, setSelected] = useState<EmailLogTableItem | null>(null);
	const [retryingKey, setRetryingKey] = useState<string | null>(null);

	async function retryEmail(item: EmailLogTableItem, via: RetryVia) {
		setRetryingKey(`${item.id}:${via}`);
		try {
			const res = await fetch(`/api/admin/emails/${item.id}/retry`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ via }),
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
					? `Uma nova tentativa pelo canal ${via === "api" ? "API" : "SMTP"} foi enviada para ${item.email}.`
					: `Uma nova tentativa pelo canal ${via === "api" ? "API" : "SMTP"} foi enviada com sucesso.`,
			});
			router.refresh();
		} catch (error) {
			const message = error instanceof Error ? error.message : "Não foi possível reenviar o e-mail.";
			toast.error(`Falha no reenvio pelo canal ${via === "api" ? "API" : "SMTP"}`, { description: message });
		} finally {
			setRetryingKey(null);
		}
	}

	function canRetry(item: EmailLogTableItem) {
		return Boolean(item.email && item.subject && (item.emailBody || item.textBody));
	}

	return (
		<>
			<div className="w-full overflow-x-auto">
				<Table className="w-full table-fixed">
					<TableHeader>
						<TableRow>
							<TableHead className="w-[160px]">Data</TableHead>
							<TableHead className="w-[120px]">Status</TableHead>
							<TableHead className="w-[180px]">Tipo</TableHead>
							<TableHead>Destinatário</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.map((item) => (
							<TableRow
								key={item.id}
								className="cursor-pointer hover:bg-muted/40"
								onClick={() => setSelected(item)}
								onKeyDown={(event) => {
									if (event.key === "Enter" || event.key === " ") {
										event.preventDefault();
										setSelected(item);
									}
								}}
								role="button"
								tabIndex={0}
							>
								<TableCell>{item.sentAtLabel}</TableCell>
								<TableCell>
									<StatusBadge status={item.status || "unknown"} />
								</TableCell>
								<TableCell>
									<Badge variant="outline" className="max-w-full truncate">
										{item.kindLabel}
									</Badge>
								</TableCell>
								<TableCell className="font-mono text-xs">
									<div className="truncate" title={item.email || "-"}>
										{item.email || "-"}
									</div>
								</TableCell>
							</TableRow>
						))}
						{items.length === 0 && (
							<TableRow>
								<TableCell colSpan={4} className="py-8 text-muted-foreground">
									Nenhum e-mail encontrado para os filtros atuais.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
					<TableCaption>Mostrando até {limit} registros, do mais recente para o mais antigo.</TableCaption>
				</Table>
			</div>

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
										<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
											<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-destructive">
												Falha de envio
											</p>
											<p className="break-words text-sm text-destructive">{selected.error}</p>
										</div>
									) : null}
									<div className="flex items-center gap-2">
										<Button
											type="button"
											size="sm"
											variant="secondary"
											disabled={retryingKey !== null || !canRetry(selected)}
											onClick={() => void retryEmail(selected, "api")}
										>
											{retryingKey === `${selected.id}:api` ? "Reenviando API..." : "Reenviar via API"}
										</Button>
										<Button
											type="button"
											size="sm"
											variant="outline"
											disabled={retryingKey !== null || !canRetry(selected)}
											onClick={() => void retryEmail(selected, "smtp")}
										>
											{retryingKey === `${selected.id}:smtp` ? "Reenviando SMTP..." : "Reenviar via SMTP"}
										</Button>
									</div>
									<div>
										<p className="mb-1 text-xs font-medium text-muted-foreground">Status</p>
										<StatusBadge status={selected.status || "unknown"} />
									</div>
									<div>
										<p className="mb-1 text-xs font-medium text-muted-foreground">Tipo</p>
										<Badge variant="outline">{selected.kindLabel}</Badge>
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
										<p className="mb-1 text-xs font-medium text-muted-foreground">Canal de envio</p>
										<p>{providerLabel(selected.provider)}</p>
									</div>
									<div>
										<p className="mb-1 text-xs font-medium text-muted-foreground">Enviado em</p>
										<p>{selected.sentAtLabel}</p>
									</div>
									<div>
										<p className="mb-1 text-xs font-medium text-muted-foreground">Modelo do e-mail</p>
										<p>{selected.template || "Não informado"}</p>
									</div>
									<div>
										<p className="mb-1 text-xs font-medium text-muted-foreground">ID da mensagem</p>
										<p className="font-mono text-xs break-all">{selected.messageId || "-"}</p>
									</div>
									<div>
										<p className="mb-1 text-xs font-medium text-muted-foreground">Destinatários</p>
										<pre className="max-h-40 overflow-auto rounded-md border bg-muted p-3 text-xs">
											{formatJson(selected.recipients || {})}
										</pre>
									</div>
									<div>
										<p className="mb-1 text-xs font-medium text-muted-foreground">Histórico de tentativas</p>
										<pre className="max-h-40 overflow-auto rounded-md border bg-muted p-3 text-xs">
											{formatJson(selected.attempts || [])}
										</pre>
									</div>
								</div>
							</div>

							<div className="flex min-h-0 flex-col bg-muted/20">
								<div className="border-b px-6 py-3 text-sm text-muted-foreground">
									{selected.emailBody ? "Prévia do e-mail" : "Versão em texto"}
								</div>
								<div className="min-h-0 flex-1 p-4">
									{selected.emailBody ? (
										<iframe
											title={`Prévia do e-mail ${selected.subject || selected.id}`}
											srcDoc={selected.emailBody}
											sandbox=""
											className="h-full w-full rounded-md border bg-white"
										/>
									) : (
										<pre className="h-full overflow-auto rounded-md border bg-background p-4 text-xs whitespace-pre-wrap">
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
