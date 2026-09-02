/**
 * Boleto panel. Always declares the effect on the order timeline — boleto delays
 * dispatch, and the buyer needs to know that *before* choosing it.
 */
export function SlBoletoPanel({
	line,
	onCopyLine,
	pdfUrl,
	copyMessage,
}: {
	line?: string | null;
	onCopyLine?: () => void;
	pdfUrl?: string | null;
	copyMessage?: string | null;
}) {
	return (
		<div className="flex flex-col gap-3.5">
			<p className="m-0 text-[14px] leading-[1.6]">
				Vence em 3 dias úteis. O pedido é separado só após a confirmação do banco (até 2 dias úteis).
			</p>
			{line ? (
				<div className="sl-field overflow-hidden text-[13px] text-[color:var(--sl-text-soft)]">
					<span className="truncate">{line}</span>
				</div>
			) : null}
			<div className="flex gap-2">
				{onCopyLine ? (
					<button type="button" className="sl-btn sl-btn-primary flex-1" onClick={onCopyLine}>
						Copiar linha
					</button>
				) : null}
				{pdfUrl ? (
					<a className="sl-btn sl-btn-secondary flex-1" href={pdfUrl} rel="noreferrer" target="_blank">
						Baixar PDF
					</a>
				) : null}
			</div>
			{copyMessage ? (
				<p className="m-0 text-[12px] text-[color:var(--sl-text-soft)]" role="status">
					{copyMessage}
				</p>
			) : null}
			<p className="m-0 text-[12px] text-[color:var(--sl-text-soft)]">
				Itens digitais e ingressos não aceitam boleto — o método some do seletor quando o carrinho só tem
				digitais.
			</p>
		</div>
	);
}
