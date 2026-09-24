import { formatBRL, formatShortDate, presaleDiscountPercent } from "@/lib/presales";
import { YnsLink } from "@/ui/yns-link";

/**
 * Puramente presentational — sem estado, sem backdrop/posicionamento. Usada
 * tanto pelo preview ao vivo do assistente admin quanto pelo modal real da
 * loja (`presale-modal.client.tsx`), pra manter os dois visualmente
 * idênticos sem duplicar marcação.
 */
export function PresaleModalContent({
	title,
	body,
	fullPrice,
	presalePrice,
	launchAt,
	ctaHref,
	ctaLabel = "Reservar meu exemplar",
	dismissLabel,
	onDismiss,
	onCtaClick,
	titleId,
}: {
	title: string;
	body: string;
	fullPrice: number;
	presalePrice: number;
	launchAt: string;
	ctaHref: string;
	ctaLabel?: string;
	dismissLabel?: string;
	onDismiss?: () => void;
	onCtaClick?: () => void;
	titleId?: string;
}) {
	const pct = presaleDiscountPercent(fullPrice, presalePrice);

	return (
		<div
			style={{
				border: "1px solid rgba(247,244,239,0.25)",
				background: "#0B0B0B",
				color: "#F7F4EF",
				padding: "26px 22px",
				display: "flex",
				flexDirection: "column",
				gap: 16,
			}}
		>
			<span
				style={{
					fontSize: 10,
					fontWeight: 900,
					letterSpacing: "0.3em",
					textTransform: "uppercase",
					color: "#F2891E",
				}}
			>
				Pré-venda · até {formatShortDate(launchAt)}
			</span>
			<p
				id={titleId}
				style={{ margin: 0, fontSize: 28, lineHeight: 1, fontWeight: 900, letterSpacing: "-0.03em" }}
			>
				{title}
			</p>
			<p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "rgba(247,244,239,0.75)" }}>{body}</p>
			<div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
				<span
					style={{
						fontSize: 16,
						color: "rgba(247,244,239,0.45)",
						textDecoration: "line-through",
					}}
				>
					{formatBRL(fullPrice)}
				</span>
				<span style={{ fontSize: 26, color: "#F7F4EF", fontWeight: 700 }}>{formatBRL(presalePrice)}</span>
				<span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.18em", color: "#F2891E" }}>
					−{pct}%
				</span>
			</div>
			<p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "rgba(247,244,239,0.5)" }}>
				A cobrança acontece na hora, ao reservar — sem cobrança extra na estreia.
			</p>
			<YnsLink
				href={ctaHref}
				onClick={onCtaClick}
				style={{
					height: 46,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: "#F2891E",
					color: "#0B0B0B",
					fontSize: 11,
					fontWeight: 900,
					letterSpacing: "0.2em",
					textTransform: "uppercase",
				}}
			>
				{ctaLabel}
			</YnsLink>
			{onDismiss ? (
				<button
					type="button"
					onClick={onDismiss}
					style={{
						background: "none",
						border: "none",
						color: "rgba(247,244,239,0.5)",
						fontSize: 11,
						letterSpacing: "0.06em",
						textAlign: "center",
						cursor: "pointer",
						textDecoration: "underline",
					}}
				>
					{dismissLabel ?? "Agora não"}
				</button>
			) : null}
		</div>
	);
}
