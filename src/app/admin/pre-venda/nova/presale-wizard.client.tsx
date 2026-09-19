"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
	createPresaleAction,
	publishPresaleAction,
	skipPresaleSetupAction,
	updatePresaleAction,
} from "@/app/admin/pre-venda/actions";
import type { Presale } from "@/lib/presales";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";

const STEP_LABELS = ["Quando estreia", "Quanto custa", "Como aparece", "Revisar e publicar"];

function centsToReaisInput(cents: number) {
	return (cents / 100).toFixed(2);
}

function reaisInputToCents(value: string) {
	const parsed = Number.parseFloat(value.replace(",", "."));
	return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function brl(cents: number) {
	return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function splitDateTime(iso: string) {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return { date: "", time: "19:00" };
	const pad = (value: number) => String(value).padStart(2, "0");
	return {
		date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
		time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
	};
}

function toIsoLocal(date: string, time: string) {
	if (!date) return null;
	const combined = new Date(`${date}T${time || "19:00"}:00`);
	return Number.isNaN(combined.getTime()) ? null : combined.toISOString();
}

function formatLongDate(date: string) {
	if (!date) return "—";
	const parsed = new Date(`${date}T00:00:00`);
	if (Number.isNaN(parsed.getTime())) return "—";
	return parsed.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

export function PresaleWizard({
	initialPresale,
	productId,
	variantId,
	fallbackFullPriceCents,
}: {
	initialPresale: Presale | null;
	productId: string;
	variantId: string;
	fallbackFullPriceCents: number;
}) {
	const router = useRouter();
	const [presale, setPresale] = useState(initialPresale);
	const [step, setStep] = useState(1);
	const [saving, setSaving] = useState(false);
	const [status, setStatus] = useState<string | null>(null);

	const initialSplit = splitDateTime(
		initialPresale?.launchAt ?? new Date(Date.now() + 7 * 86_400_000).toISOString(),
	);
	const [launchDate, setLaunchDate] = useState(initialSplit.date);
	const [launchTime, setLaunchTime] = useState(initialSplit.time);
	const [fullPriceCents] = useState(initialPresale?.fullPrice ?? fallbackFullPriceCents);
	const [presalePriceCents, setPresalePriceCents] = useState(
		initialPresale?.presalePrice ?? Math.round(fallbackFullPriceCents * 0.75),
	);
	const [modalTitle, setModalTitle] = useState(
		initialPresale?.modalTitle ?? "little fish, big fish está em pré-venda",
	);
	const [modalBody, setModalBody] = useState(
		initialPresale?.modalBody ??
			"Terceiro livro de poesia de Natália Nolli Sasso. Reserve agora com desconto — o exemplar sai na estreia.",
	);
	const [modalIntervalHours, setModalIntervalHours] = useState(initialPresale?.modalIntervalHours ?? 2);

	const creating = useRef(false);
	useEffect(() => {
		if (presale || creating.current) return;
		creating.current = true;
		void createPresaleAction({
			productId,
			variantId,
			launchAt: toIsoLocal(launchDate, launchTime) ?? new Date().toISOString(),
			presalePrice: presalePriceCents,
			fullPrice: fullPriceCents,
			modalTitle,
			modalBody,
			modalIntervalHours,
		})
			.then((created) => {
				setPresale(created);
				setStatus("Rascunho salvo.");
			})
			.catch(() => setStatus("Não foi possível salvar o rascunho."))
			.finally(() => {
				creating.current = false;
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps -- runs once to seed the draft
	}, []);

	async function persist(patch: Partial<Parameters<typeof updatePresaleAction>[1]> = {}) {
		if (!presale) return;
		setSaving(true);
		setStatus(null);
		try {
			const updated = await updatePresaleAction(presale.id, {
				launchAt: toIsoLocal(launchDate, launchTime) ?? presale.launchAt,
				presalePrice: presalePriceCents,
				fullPrice: fullPriceCents,
				modalTitle,
				modalBody,
				modalIntervalHours,
				...patch,
			});
			setPresale(updated);
		} catch {
			setStatus("Não foi possível salvar as alterações.");
		} finally {
			setSaving(false);
		}
	}

	async function goToStep(next: number) {
		await persist();
		setStep(next);
	}

	async function handleAdvance() {
		if (step < 4) {
			await goToStep(step + 1);
			return;
		}
		if (!presale) return;
		setSaving(true);
		try {
			const published = await publishPresaleAction(presale.id);
			setPresale(published);
			setStatus("Pré-venda publicada.");
		} catch {
			setStatus("Não foi possível publicar a pré-venda.");
		} finally {
			setSaving(false);
		}
	}

	async function handleSkip() {
		if (!presale) return;
		await skipPresaleSetupAction(presale.id);
		router.push("/admin/pre-venda");
	}

	const discountPct = fullPriceCents > 0 ? Math.round((1 - presalePriceCents / fullPriceCents) * 100) : 0;
	const daysRemaining = launchDate
		? Math.max(0, Math.ceil((new Date(`${launchDate}T00:00:00`).getTime() - Date.now()) / 86_400_000))
		: 0;
	const shortcuts = [10, 25, 40].map((pct) => Math.round((fullPriceCents * (100 - pct)) / 100));
	const isPublished = presale?.status === "no_ar" || presale?.published;

	return (
		<div className="grid gap-6 lg:grid-cols-[268px_minmax(0,1fr)_320px]">
			<nav className="flex flex-col gap-1 border border-[var(--sl-line)] bg-[var(--sl-ink)] p-4 text-[var(--sl-text-on-ink)] lg:h-fit">
				<p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--sl-text-on-ink-soft)]">
					Primeiro acesso
				</p>
				{STEP_LABELS.map((label, index) => {
					const n = index + 1;
					const active = n === step;
					const done = n < step;
					return (
						<button
							key={label}
							type="button"
							onClick={() => void goToStep(n)}
							className={`flex items-start gap-3 px-2 py-2 text-left text-sm transition-colors ${
								active
									? "bg-[var(--sl-paper)] text-[var(--sl-ink)]"
									: done
										? "text-[var(--sl-text-on-ink)]"
										: "text-[var(--sl-text-on-ink-soft)]"
							}`}
						>
							<span className="font-mono text-xs">{String(n).padStart(2, "0")}</span>
							<span>{label}</span>
						</button>
					);
				})}
				<div className="mt-4 border-t border-[var(--sl-text-on-ink-soft)]/20 pt-4 text-xs leading-5 text-[var(--sl-text-on-ink-soft)]">
					Rascunho salvo. Nada vai ao ar antes do passo 4.
					<button
						type="button"
						onClick={() => void handleSkip()}
						className="mt-2 block text-left uppercase tracking-[0.18em] underline underline-offset-4"
					>
						Configurar depois
					</button>
				</div>
			</nav>

			<div className="space-y-6">
				{step === 1 ? (
					<section className="space-y-5">
						<div className="space-y-2">
							<h2 className="text-2xl font-black uppercase tracking-[-0.03em] text-[var(--sl-ink)]">
								Quando o livro estreia
							</h2>
							<p className="text-sm leading-6 text-[var(--sl-text-muted)]">
								A pré-venda começa hoje e termina nessa data. É nesse dia que a compra de quem reservou é
								processada.
							</p>
						</div>
						<div className="flex flex-wrap gap-4">
							<label className="flex flex-col gap-2">
								<span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)]">
									Data da estreia
								</span>
								<Input type="date" value={launchDate} onChange={(e) => setLaunchDate(e.target.value)} />
							</label>
							<label className="flex flex-col gap-2">
								<span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)]">
									Hora
								</span>
								<Input type="time" value={launchTime} onChange={(e) => setLaunchTime(e.target.value)} />
							</label>
						</div>
						<div className="border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] p-5">
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sl-accent)]">
								A janela fica assim
							</p>
							<div className="mt-3 flex flex-wrap items-center gap-4 font-mono text-sm">
								<span>hoje reservas abrem</span>
								<span aria-hidden>→</span>
								<span>
									{daysRemaining} dias · modal a cada {modalIntervalHours}h
								</span>
								<span aria-hidden>→</span>
								<span>{formatLongDate(launchDate)} estreia</span>
							</div>
						</div>
					</section>
				) : null}

				{step === 2 ? (
					<section className="space-y-5">
						<div className="space-y-2">
							<h2 className="text-2xl font-black uppercase tracking-[-0.03em] text-[var(--sl-ink)]">
								Quanto custa na pré-venda
							</h2>
							<p className="text-sm leading-6 text-[var(--sl-text-muted)]">
								Quem reserva agora paga esse valor, cobrado na hora da reserva via Asaas.
							</p>
						</div>
						<div className="flex flex-wrap items-end gap-4">
							<div className="flex flex-col gap-2">
								<span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)]">
									Preço cheio
								</span>
								<div className="flex h-11 items-center border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] px-3 font-mono">
									{brl(fullPriceCents)}
								</div>
							</div>
							<label className="flex flex-col gap-2">
								<span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)]">
									Preço de pré-venda
								</span>
								<Input
									type="number"
									step="0.01"
									className="w-40 font-mono"
									value={centsToReaisInput(presalePriceCents)}
									onChange={(e) => setPresalePriceCents(reaisInputToCents(e.target.value))}
								/>
							</label>
							<div className="flex gap-2 pb-0.5">
								{shortcuts.map((cents, index) => (
									<Button
										key={cents}
										type="button"
										variant={cents === presalePriceCents ? "default" : "outline"}
										onClick={() => setPresalePriceCents(cents)}
									>
										−{[10, 25, 40][index]}%
									</Button>
								))}
							</div>
						</div>
						<div className="flex flex-wrap gap-8 border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] p-5">
							<div>
								<div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)]">
									Desconto
								</div>
								<div className="mt-1 font-mono text-xl text-[var(--sl-accent)]">−{discountPct}%</div>
							</div>
							<div>
								<div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)]">
									Cliente economiza
								</div>
								<div className="mt-1 font-mono text-xl">{brl(fullPriceCents - presalePriceCents)}</div>
							</div>
						</div>
					</section>
				) : null}

				{step === 3 ? (
					<section className="space-y-5">
						<div className="space-y-2">
							<h2 className="text-2xl font-black uppercase tracking-[-0.03em] text-[var(--sl-ink)]">
								Como aparece no site
							</h2>
							<p className="text-sm leading-6 text-[var(--sl-text-muted)]">
								O aviso abre sozinho para quem está navegando. A prévia à direita é o que o visitante vê.
							</p>
						</div>
						<label className="flex flex-col gap-2">
							<span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)]">
								Título do aviso
							</span>
							<Input value={modalTitle} onChange={(e) => setModalTitle(e.target.value)} />
						</label>
						<label className="flex flex-col gap-2">
							<span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)]">
								Frase
							</span>
							<Input value={modalBody} onChange={(e) => setModalBody(e.target.value)} />
						</label>
						<div className="space-y-2">
							<span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sl-text-muted)]">
								Aparece de novo a cada
							</span>
							<div className="flex flex-wrap gap-2">
								{[1, 2, 6, 24].map((hours) => (
									<Button
										key={hours}
										type="button"
										variant={hours === modalIntervalHours ? "default" : "outline"}
										onClick={() => setModalIntervalHours(hours)}
									>
										{hours === 24 ? "1 dia" : `${hours} horas`}
									</Button>
								))}
							</div>
							<p className="text-xs leading-5 text-[var(--sl-text-muted)]">
								Contado por navegador. Não aparece no carrinho, nem para quem já reservou.
							</p>
						</div>
					</section>
				) : null}

				{step === 4 ? (
					<section className="space-y-5">
						<h2 className="text-2xl font-black uppercase tracking-[-0.03em] text-[var(--sl-ink)]">
							Revisar e publicar
						</h2>
						<div className="border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] p-5 text-sm leading-7">
							Quem reservar até {formatLongDate(launchDate)} leva little fish, big fish por{" "}
							{brl(presalePriceCents)} em vez de {brl(fullPriceCents)} (−{discountPct}%), com a compra
							processada no dia da estreia, às {launchTime}.
						</div>
						<ul className="space-y-2 text-sm leading-6">
							<li className="border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] p-4">
								Reservas abrem agora e o aviso entra no ar no site.
							</li>
							<li className="border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] p-4">
								Em {formatLongDate(launchDate)} o produto passa a valer o preço cheio e o aviso some.
							</li>
							<li className="border border-[var(--sl-accent)]/50 bg-[var(--sl-accent)]/5 p-4 text-[var(--sl-accent)]">
								Assim que existir uma reserva, esta pré-venda e o produto não podem mais ser apagados — só
								encerrados.
							</li>
						</ul>
						{isPublished ? (
							<div className="flex flex-wrap items-center justify-between gap-4 border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] p-5">
								<p className="text-sm font-semibold">No ar desde agora.</p>
								<Button type="button" onClick={() => router.push("/admin/pre-venda")}>
									Ver a pré-venda
								</Button>
							</div>
						) : null}
					</section>
				) : null}

				<div className="flex justify-end gap-3 border-t border-[var(--sl-line)] pt-5">
					<Button
						type="button"
						variant="outline"
						disabled={step === 1}
						onClick={() => void goToStep(step - 1)}
					>
						Voltar
					</Button>
					<Button type="button" disabled={saving || !presale} onClick={() => void handleAdvance()}>
						{step < 4 ? "Continuar" : isPublished ? "Publicado" : "Publicar pré-venda"}
					</Button>
				</div>
				{status ? <p className="text-sm text-[var(--sl-text-muted)]">{status}</p> : null}
			</div>

			<aside className="space-y-3 border border-[var(--sl-line)] bg-[var(--sl-paper)] p-5">
				<p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sl-accent)]">
					{step >= 3 ? "Prévia · aviso no site" : "Prévia · cartão na loja"}
				</p>
				{step < 3 ? (
					<div className="space-y-3 border border-[var(--sl-line)] bg-[var(--sl-paper-pure)] p-4">
						<div className="h-32 w-full bg-[var(--sl-ink)]" />
						<p className="text-base font-black uppercase leading-tight">little fish, big fish</p>
						<div className="flex items-baseline gap-2 font-mono">
							<span className="text-[var(--sl-text-muted)] line-through">{brl(fullPriceCents)}</span>
							<span className="text-lg text-[var(--sl-accent)]">{brl(presalePriceCents)}</span>
						</div>
						<span className="inline-flex h-6 items-center bg-[var(--sl-accent)] px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--sl-text-on-ink)]">
							Pré-venda · −{discountPct}%
						</span>
					</div>
				) : (
					<div className="space-y-3 border border-[var(--sl-ink)] bg-[var(--sl-ink)] p-5 text-[var(--sl-text-on-ink)]">
						<p className="text-sm font-black leading-tight">{modalTitle}</p>
						<p className="text-xs leading-5 text-[var(--sl-text-on-ink-soft)]">{modalBody}</p>
						<div className="flex items-baseline gap-2 font-mono text-sm">
							<span className="text-[var(--sl-text-on-ink-soft)] line-through">{brl(fullPriceCents)}</span>
							<span>{brl(presalePriceCents)}</span>
						</div>
					</div>
				)}
			</aside>
		</div>
	);
}
