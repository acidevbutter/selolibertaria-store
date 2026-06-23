import { emailButtonHtml, emailShellHtml, escapeEmailHtml } from "./shell";

type Props = {
	name?: string | null;
	productName: string;
	variantLabel?: string | null;
	productUrl: string;
	basePrice: string;
	effectivePrice: string;
	promotionLabel: string;
	supportEmail?: string;
	baseUrl?: string;
};

export function favoriteDiscountEmailHtml({
	name,
	productName,
	variantLabel,
	productUrl,
	basePrice,
	effectivePrice,
	promotionLabel,
	supportEmail,
	baseUrl,
}: Props) {
	const greeting = name ? `Olá, ${escapeEmailHtml(name)}.` : "Olá.";
	const variantHtml = variantLabel
		? `<p class="note-card"><strong>Variante favoritada</strong><br />${escapeEmailHtml(variantLabel)}</p>`
		: "";
	const bodyHtml = `
		<p class="lead">${greeting}</p>
		<p>Um item da sua lista de favoritos acabou de entrar em promoção no Selo Libertária.</p>
		<span class="status-pill">${escapeEmailHtml(promotionLabel)}</span>
		<div class="meta-grid">
			<div class="meta-box">
				<span class="meta-label">Produto</span>
				<span class="meta-value">${escapeEmailHtml(productName)}</span>
			</div>
			<div class="meta-box">
				<span class="meta-label">Novo preço</span>
				<span class="meta-value price-emphasis">${escapeEmailHtml(effectivePrice)}</span>
			</div>
		</div>
		<div class="info-card">
			<strong>Preço anterior</strong>
			<p style="margin:8px 0 0">${escapeEmailHtml(basePrice)}</p>
		</div>
		${variantHtml}
		<div class="cta-wrap">
			${emailButtonHtml({ href: productUrl, label: "Ver produto" })}
		</div>
		<div class="link-block">
			Se você não quiser mais receber alertas de desconto para itens favoritados, vá ao seu perfil e desative os
			emails promocionais.
		</div>
	`;

	return emailShellHtml({
		title: "Seu item favorito entrou em promoção",
		eyebrow: "Alerta de favorito",
		preheader: `${productName} está com desconto`,
		bodyHtml,
		supportEmail,
		baseUrl,
		footerNote: "Você está recebendo este email porque alertas promocionais estão ativos na sua conta.",
	});
}
