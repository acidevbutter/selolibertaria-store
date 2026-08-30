"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { type PreSaleCampaign, resolveCountdownTarget } from "@/lib/pre-sale";
import { YnsLink } from "@/ui/yns-link";

type Remaining = { days: string; hours: string; minutes: string; seconds: string; done: boolean };

const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0");

function computeRemaining(target: number, now: number): Remaining {
	let diff = Math.max(0, target - now);
	const days = Math.floor(diff / 86_400_000);
	diff -= days * 86_400_000;
	const hours = Math.floor(diff / 3_600_000);
	diff -= hours * 3_600_000;
	const minutes = Math.floor(diff / 60_000);
	diff -= minutes * 60_000;
	const seconds = Math.floor(diff / 1000);
	return {
		days: pad(days),
		hours: pad(hours),
		minutes: pad(minutes),
		seconds: pad(seconds),
		done: target - now <= 0,
	};
}

/**
 * Pop-up de contagem regressiva da pré-venda.
 *
 * - Abre sozinho depois de `campaign.popup.autoOpenDelayMs`.
 * - Ao ser fechado, fica em silêncio por `campaign.popup.snoozeHours` (localStorage).
 * - Fecha com ✕, clique no backdrop, tecla Esc e no link "Continuar navegando".
 * - Respeita `prefers-reduced-motion` (sem fade/scale).
 *
 * A afinação fina (capping por sessão vs. persistente, testes A/B do delay,
 * telemetria de conversão) está em `docs/prompts/pre-venda-02-countdown-popup.md`.
 */
export function PreSaleCountdownPopup({ campaign }: { campaign: PreSaleCampaign }) {
	const titleId = useId();
	const storageKey = `presale:${campaign.slug}:popup-dismissed-until`;
	const target = useMemo(() => resolveCountdownTarget(campaign), [campaign]);

	const [open, setOpen] = useState(false);
	const [remaining, setRemaining] = useState<Remaining>(() => computeRemaining(target, Date.now()));
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const lastFocusedRef = useRef<HTMLElement | null>(null);

	const dismiss = useCallback(() => {
		setOpen(false);
		try {
			const until = Date.now() + campaign.popup.snoozeHours * 3_600_000;
			window.localStorage.setItem(storageKey, String(until));
		} catch {
			// localStorage indisponível (modo privado etc.) — silencioso é aceitável.
		}
	}, [campaign.popup.snoozeHours, storageKey]);

	// Abertura automática, respeitando o "snooze" salvo.
	useEffect(() => {
		let snoozedUntil = 0;
		try {
			snoozedUntil = Number(window.localStorage.getItem(storageKey)) || 0;
		} catch {
			snoozedUntil = 0;
		}
		if (Date.now() < snoozedUntil) return;
		const id = window.setTimeout(() => setOpen(true), campaign.popup.autoOpenDelayMs);
		return () => window.clearTimeout(id);
	}, [campaign.popup.autoOpenDelayMs, storageKey]);

	// Tick da contagem regressiva (só enquanto aberto).
	useEffect(() => {
		if (!open) return;
		const id = window.setInterval(() => setRemaining(computeRemaining(target, Date.now())), 1000);
		setRemaining(computeRemaining(target, Date.now()));
		return () => window.clearInterval(id);
	}, [open, target]);

	// Esc para fechar + trava de scroll + foco inicial/retorno de foco.
	useEffect(() => {
		if (!open) return;
		lastFocusedRef.current = document.activeElement as HTMLElement | null;
		closeButtonRef.current?.focus();
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") dismiss();
		};
		document.addEventListener("keydown", onKey);
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = previousOverflow;
			lastFocusedRef.current?.focus?.();
		};
	}, [open, dismiss]);

	if (!open) return null;

	const cells: Array<[string, string]> = [
		[remaining.days, "dias"],
		[remaining.hours, "horas"],
		[remaining.minutes, "min"],
		[remaining.seconds, "seg"],
	];

	return (
		<div
			role="presentation"
			onClick={(event) => {
				if (event.target === event.currentTarget) dismiss();
			}}
			className="fixed inset-0 z-[200] flex items-center justify-center bg-[color:rgba(11,11,11,0.72)] p-6 motion-safe:animate-[fade-in_0.2s_ease-out]"
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className="relative flex w-[420px] max-w-full flex-col items-center gap-[18px] border border-[color:rgba(242,137,30,0.4)] bg-[#0B0B0B] p-9 text-center text-[color:#F7F4EF]"
			>
				<button
					ref={closeButtonRef}
					type="button"
					onClick={dismiss}
					aria-label="Fechar"
					className="absolute right-[14px] top-[14px] flex h-7 w-7 items-center justify-center border border-[color:rgba(247,244,239,0.3)] text-sm leading-none text-[color:#F7F4EF] transition-colors hover:bg-[color:rgba(247,244,239,0.12)]"
				>
					✕
				</button>

				<div className="w-[110px] overflow-hidden">
					<Image src={campaign.images.circle} alt="" width={270} height={180} className="h-auto w-full" />
				</div>

				<p className="m-0 text-[10px] font-black uppercase tracking-[0.3em] text-[color:#F2891E]">
					{campaign.popup.eyebrow}
				</p>
				<p
					id={titleId}
					className="editorial-serif m-0 text-[22px] font-black leading-[1.2] tracking-[-0.02em]"
				>
					{remaining.done ? "little fish, big fish já está disponível" : campaign.popup.title}
				</p>

				{!remaining.done ? (
					<div className="flex gap-[10px]" aria-live="off">
						{cells.map(([value, label]) => (
							<div key={label} className="flex min-w-[52px] flex-col items-center gap-1">
								<span className="editorial-serif text-[30px] font-black text-[color:#F7F4EF]">{value}</span>
								<span className="text-[9px] uppercase tracking-[0.18em] text-[color:rgba(247,244,239,0.5)]">
									{label}
								</span>
							</div>
						))}
					</div>
				) : null}

				<YnsLink
					href={campaign.popup.primaryCta.href}
					className="mt-[6px] box-border inline-flex h-12 w-full items-center justify-center bg-[#F2891E] text-[11px] font-black uppercase tracking-[0.22em] text-[#0B0B0B]"
				>
					{campaign.popup.primaryCta.label}
				</YnsLink>
				<button
					type="button"
					onClick={dismiss}
					className="cursor-pointer border-none bg-transparent text-xs tracking-[0.05em] text-[color:rgba(247,244,239,0.5)] underline"
				>
					{campaign.popup.dismissLabel}
				</button>
			</div>
		</div>
	);
}
