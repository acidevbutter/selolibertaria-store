import Image from "next/image";
import { formatBRL, presaleDiscountPercent } from "@/lib/presales";

/**
 * Prévia do cartão de produto na loja, como aparece antes do passo 3 (aviso)
 * assumir a prévia. Puramente apresentacional, irmã de `PresaleModalContent`
 * — mesmas cores fixas do canvas "Prevenda - Sistema", não tokens do painel.
 */
export function PresaleCardPreview({
	fullPrice,
	presalePrice,
	coverSrc = "/images/selolibertaria/lfbf-fish-badge.png",
	title = "little fish, big fish",
}: {
	fullPrice: number;
	presalePrice: number;
	coverSrc?: string;
	title?: string;
}) {
	const pct = presaleDiscountPercent(fullPrice, presalePrice);

	return (
		<div
			style={{
				border: "1px solid rgba(11,11,11,0.14)",
				background: "#F7F4EF",
				padding: 18,
				display: "flex",
				flexDirection: "column",
				gap: 14,
			}}
		>
			<div style={{ position: "relative", width: "100%", height: 190, background: "#0B0B0B" }}>
				<Image src={coverSrc} alt="" fill className="object-cover" />
			</div>
			<p
				style={{
					margin: 0,
					fontSize: 20,
					fontWeight: 900,
					lineHeight: 1.05,
					textTransform: "uppercase",
					letterSpacing: "-0.03em",
					color: "#0B0B0B",
				}}
			>
				{title}
			</p>
			<div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
				<span style={{ fontSize: 18, color: "rgba(11,11,11,0.45)", textDecoration: "line-through" }}>
					{formatBRL(fullPrice)}
				</span>
				<span style={{ fontSize: 28, fontWeight: 700, color: "#7A1E22" }}>{formatBRL(presalePrice)}</span>
			</div>
			<span
				style={{
					alignSelf: "flex-start",
					display: "inline-flex",
					alignItems: "center",
					height: 24,
					padding: "0 10px",
					background: "#7A1E22",
					color: "#F7F4EF",
					fontSize: 10,
					fontWeight: 900,
					letterSpacing: "0.16em",
					textTransform: "uppercase",
				}}
			>
				Pré-venda · −{pct}%
			</span>
			<p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "rgba(11,11,11,0.6)" }}>
				Cobrado na hora, ao reservar — sem cobrança extra na estreia.
			</p>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					height: 48,
					background: "#0B0B0B",
					color: "#F7F4EF",
					fontSize: 12,
					fontWeight: 900,
					letterSpacing: "0.2em",
					textTransform: "uppercase",
				}}
			>
				Reservar
			</div>
		</div>
	);
}
