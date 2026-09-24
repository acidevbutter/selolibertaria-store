"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import type { PresalePublic } from "@/lib/presales";
import { PresaleModalContent } from "@/ui/pre-venda/presale-modal-content";

const EXCLUDED_PATH_PREFIXES = ["/cart", "/checkout"];

/**
 * Modal de pré-venda da loja (canvas: "Modal na loja"). Reaparece a cada
 * `modalIntervalHours`, por navegador (localStorage), e nunca em
 * /cart ou /checkout. Some pra sempre depois que o visitante clica em
 * "Reservar" (mesma semântica do protótipo: clicar = `reservou`, sem
 * depender de confirmação de pedido).
 */
export function PresaleModal({ presale, buyHref }: { presale: PresalePublic; buyHref: string }) {
	const pathname = usePathname();
	const titleId = useId();
	const storageKeyNextShow = `presale:${presale.productId}:next-show-at`;
	const storageKeyReserved = `presale:${presale.productId}:reserved`;
	const [open, setOpen] = useState(false);

	const excluded = EXCLUDED_PATH_PREFIXES.some((prefix) => pathname?.startsWith(prefix));
	const eligible = presale.modalEnabled && presale.status === "no_ar" && !excluded;

	useEffect(() => {
		if (!eligible) return;
		try {
			if (window.localStorage.getItem(storageKeyReserved) === "true") return;
			const nextShowAt = Number(window.localStorage.getItem(storageKeyNextShow)) || 0;
			if (Date.now() < nextShowAt) return;
		} catch {
			// localStorage indisponível (modo privado etc.) — abrir mesmo assim é aceitável.
		}
		setOpen(true);
	}, [eligible, storageKeyNextShow, storageKeyReserved]);

	const dismiss = useCallback(() => {
		setOpen(false);
		try {
			window.localStorage.setItem(
				storageKeyNextShow,
				String(Date.now() + presale.modalIntervalHours * 3_600_000),
			);
		} catch {
			// silencioso é aceitável.
		}
	}, [presale.modalIntervalHours, storageKeyNextShow]);

	const reservar = useCallback(() => {
		setOpen(false);
		try {
			window.localStorage.setItem(storageKeyReserved, "true");
		} catch {
			// silencioso é aceitável.
		}
	}, [storageKeyReserved]);

	useEffect(() => {
		if (!open) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") dismiss();
		};
		document.addEventListener("keydown", onKey);
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = previousOverflow;
		};
	}, [open, dismiss]);

	if (!open || !eligible) return null;

	return (
		<div
			role="presentation"
			onClick={(event) => {
				if (event.target === event.currentTarget) dismiss();
			}}
			className="motion-safe:animate-[fade-in_0.2s_ease-out]"
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 200,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "rgba(11,11,11,0.82)",
				padding: 24,
			}}
		>
			<div role="dialog" aria-modal="true" aria-labelledby={titleId} style={{ width: "100%", maxWidth: 480 }}>
				<PresaleModalContent
					titleId={titleId}
					title={presale.modalTitle}
					body={presale.modalBody}
					fullPrice={presale.fullPrice}
					presalePrice={presale.presalePrice}
					launchAt={presale.launchAt}
					ctaHref={buyHref}
					onCtaClick={reservar}
					onDismiss={dismiss}
				/>
			</div>
		</div>
	);
}
