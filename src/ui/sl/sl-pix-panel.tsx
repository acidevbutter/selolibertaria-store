import type { ReactNode } from "react";

/**
 * Pix payment panel. Always states the expiry and that items stay reserved during
 * it. The QR is a real image, never a drawing — when it's missing we show the
 * checkered placeholder from the design system.
 */
export function SlPixPanel({
	qrCodeBase64,
	code,
	expiresLabel,
	ticketUrl,
	onCopy,
	copyMessage,
	footer,
}: {
	qrCodeBase64?: string | null;
	code?: string | null;
	expiresLabel?: ReactNode;
	ticketUrl?: string | null;
	onCopy?: () => void;
	copyMessage?: ReactNode;
	footer?: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-start">
			{qrCodeBase64 ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					alt="QR Code Pix"
					src={`data:image/png;base64,${qrCodeBase64}`}
					className="h-[132px] w-[132px] flex-none border border-[color:var(--sl-ink)] bg-white p-1"
				/>
			) : (
				<div
					aria-hidden
					className="h-[132px] w-[132px] flex-none border border-[color:var(--sl-ink)] bg-white"
					style={{
						backgroundImage:
							"repeating-linear-gradient(90deg,#0B0B0B 0 8px,transparent 8px 16px),repeating-linear-gradient(0deg,#0B0B0B 0 8px,transparent 8px 16px)",
						backgroundBlendMode: "multiply",
					}}
				/>
			)}

			<div className="flex flex-1 flex-col gap-2.5">
				<p className="m-0 text-[14px] leading-[1.6]">
					Escaneie no app do banco ou copie o código. Reservamos os itens do carrinho enquanto o Pix não
					expira.
				</p>
				{code ? (
					<input
						readOnly
						value={code}
						aria-label="Código Pix copia e cola"
						className="sl-field w-full truncate bg-[color:var(--sl-surface-card)] text-[13px] text-[color:var(--sl-text-soft)] outline-none"
					/>
				) : null}
				{onCopy ? (
					<button type="button" className="sl-btn sl-btn-primary w-full" onClick={onCopy}>
						Copiar código Pix
					</button>
				) : null}
				{copyMessage ? (
					<p className="m-0 text-[12px] text-[color:var(--sl-text-soft)]" role="status">
						{copyMessage}
					</p>
				) : null}
				{expiresLabel ? (
					<div
						className="flex items-center justify-between px-3.5 py-3 text-[13px]"
						style={{ background: "var(--sl-surface-band)" }}
					>
						<span>Prazo</span>
						<span className="sl-price text-[18px]">{expiresLabel}</span>
					</div>
				) : null}
				{ticketUrl ? (
					<a className="sl-link text-[13px]" href={ticketUrl} rel="noreferrer" target="_blank">
						Abrir Pix no Mercado Pago
					</a>
				) : null}
				{footer}
			</div>
		</div>
	);
}
