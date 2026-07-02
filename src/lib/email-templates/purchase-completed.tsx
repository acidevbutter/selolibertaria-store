import { emailButtonHtml, emailShellHtml, escapeEmailHtml } from "./shell";

type Props = {
	name?: string | null;
	orderId: string;
	accountUrl: string;
	passwordSetupUrl?: string;
	items: Array<{ name: string; quantity: number; price?: string }>;
	total?: string;
	supportEmail?: string;
	baseUrl?: string;
};

export function purchaseCompletedEmailHtml({
	name,
	orderId,
	accountUrl,
	passwordSetupUrl,
	items,
	total,
	supportEmail,
	baseUrl,
}: Props) {
	const greeting = name ? `Olá, ${escapeEmailHtml(name)}.` : "Olá.";
	const itemsHtml = items
		.map(
			(item) => `
				<tr class="item-row">
					<td>
						<strong>${escapeEmailHtml(item.name)}</strong><br />
						<span style="color:#64748b">Quantidade: ${escapeEmailHtml(item.quantity)}</span>
					</td>
					<td align="right">${escapeEmailHtml(item.price ?? "")}</td>
				</tr>
			`,
		)
		.join("");
	const totalHtml = total
		? `
			<div class="meta-grid">
				<div class="meta-box">
					<span class="meta-label">Pedido</span>
					<span class="meta-value">#${escapeEmailHtml(orderId)}</span>
				</div>
				<div class="meta-box">
					<span class="meta-label">Total</span>
					<span class="meta-value">${escapeEmailHtml(total)}</span>
				</div>
			</div>
		`
		: `
			<div class="meta-grid">
				<div class="meta-box">
					<span class="meta-label">Pedido</span>
					<span class="meta-value">#${escapeEmailHtml(orderId)}</span>
				</div>
			</div>
		`;
	const accountButton = emailButtonHtml({
		href: accountUrl,
		label: "Acessar minha conta",
	});
	const passwordButton = passwordSetupUrl
		? emailButtonHtml({
				href: passwordSetupUrl,
				label: "Criar minha senha",
			})
		: "";
	const passwordCard = passwordSetupUrl
		? `
			<div class="info-card">
				<strong>Defina sua senha</strong>
				<p style="margin:8px 0 0">
					Sua conta já está pronta. Use o link abaixo para criar sua senha com segurança e voltar quando quiser.
				</p>
			</div>
			<p class="cta-wrap">${passwordButton}</p>
			<div class="link-block">${escapeEmailHtml(passwordSetupUrl)}</div>
		`
		: "";
	const bodyHtml = `
		<p class="lead">${greeting}</p>
		<p>Sua compra foi confirmada no Selo Libertária.</p>
		<span class="status-pill">Compra concluída</span>
		${totalHtml}
		<div class="info-card">
			<strong>Resumo do pedido</strong>
			<table class="items-table" role="presentation">${itemsHtml}</table>
		</div>
		<p>Você já pode acompanhar o pedido e rever seus dados na sua conta.</p>
		<p class="cta-wrap">${accountButton}</p>
		<div class="link-block">${escapeEmailHtml(accountUrl)}</div>
		${passwordCard}
	`;

	return emailShellHtml({
		title: "Compra concluída",
		eyebrow: "Pedido confirmado",
		preheader: "Sua compra foi confirmada e sua conta já pode ser acessada.",
		bodyHtml,
		supportEmail,
		baseUrl,
		footerNote: "Se precisar de ajuda com este pedido, responda este e-mail ou fale com nosso suporte.",
	});
}
