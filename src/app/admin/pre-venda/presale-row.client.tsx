"use client";

import Link from "next/link";
import { useState } from "react";
import { closePresaleAction, deletePresaleAction } from "@/app/admin/pre-venda/actions";
import type { Presale } from "@/lib/presales";
import { Button } from "@/ui/shadcn/button";

function brl(cents: number) {
	return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function shortDate(iso: string) {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const STATUS_LABEL: Record<Presale["status"], string> = {
	rascunho: "Rascunho",
	no_ar: "No ar",
	encerrada: "Encerrada",
};

export function PresaleRow({ presale, productName }: { presale: Presale; productName: string }) {
	const [open, setOpen] = useState(false);
	const [current, setCurrent] = useState(presale);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const canDelete = current.reservationsCount === 0;

	async function handleClose() {
		setBusy(true);
		setError(null);
		try {
			setCurrent(await closePresaleAction(current.id));
		} catch {
			setError("Não foi possível encerrar a pré-venda.");
		} finally {
			setBusy(false);
		}
	}

	async function handleDelete() {
		if (!canDelete) return;
		if (!window.confirm("Apagar esta pré-venda? Essa ação não pode ser desfeita.")) return;
		setBusy(true);
		setError(null);
		try {
			await deletePresaleAction(current.id);
			window.location.reload();
		} catch {
			setError("Não foi possível apagar a pré-venda.");
			setBusy(false);
		}
	}

	return (
		<div className="border border-[var(--sl-line)] bg-[var(--sl-paper)]">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="grid w-full grid-cols-[minmax(0,2fr)_100px_90px_110px_100px] items-center gap-3 px-5 py-4 text-left"
			>
				<span className="text-base font-bold">{productName}</span>
				<span className="inline-flex h-6 w-fit items-center bg-[var(--sl-ink)] px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--sl-text-on-ink)]">
					{STATUS_LABEL[current.status]}
				</span>
				<span className="font-mono text-sm">{current.reservationsCount}</span>
				<span className="font-mono text-sm text-[var(--sl-accent)]">{brl(current.amountToCharge)}</span>
				<span className="font-mono text-sm">{shortDate(current.launchAt)}</span>
			</button>
			{open ? (
				<div className="space-y-4 border-t border-[var(--sl-line)] bg-[var(--sl-paper-pure)] p-5">
					<div className="flex flex-wrap gap-8 text-sm">
						<div>
							<div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)]">
								Preço de pré-venda
							</div>
							<div className="mt-1 font-mono text-lg">{brl(current.presalePrice)}</div>
						</div>
						<div>
							<div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)]">
								Preço cheio
							</div>
							<div className="mt-1 font-mono text-lg">{brl(current.fullPrice)}</div>
						</div>
					</div>
					{current.reservationsCount > 0 ? (
						<div className="border border-[var(--sl-accent)]/50 bg-[var(--sl-accent)]/5 p-4 text-sm leading-6 text-[var(--sl-accent)]">
							Esta pré-venda tem {current.reservationsCount} reserva(s) — por isso ela e o produto não podem
							ser apagados. Para tirar do ar sem prejudicar quem reservou, use <strong>Encerrar</strong>: as
							reservas seguem processadas normalmente.
						</div>
					) : null}
					<div className="flex flex-wrap gap-3">
						<Link href={`/admin/pre-venda/${current.id}/reservas`}>
							<Button type="button" variant="outline">
								Ver reservas
							</Button>
						</Link>
						<Link href="/admin/pre-venda/nova">
							<Button type="button" variant="outline">
								Editar aviso
							</Button>
						</Link>
						{current.status !== "encerrada" ? (
							<Button type="button" onClick={() => void handleClose()} disabled={busy}>
								Encerrar pré-venda
							</Button>
						) : null}
						<Button
							type="button"
							variant="outline"
							disabled={!canDelete || busy}
							onClick={() => void handleDelete()}
						>
							{canDelete ? "Apagar" : "Apagar · indisponível"}
						</Button>
					</div>
					{error ? <p className="text-sm text-[var(--sl-accent)]">{error}</p> : null}
				</div>
			) : null}
		</div>
	);
}
